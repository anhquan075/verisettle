// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import {EvmV1Decoder} from "@gluwa/usc-contracts/contracts/decoding/EvmV1Decoder.sol";
import {VeriSettleCarrierSource} from "../../contracts/VeriSettleCarrierSource.sol";
import {VeriSettleEscrowASCV2Optional} from "../../contracts/VeriSettleEscrowASCV2Optional.sol";
import {VeriSettleDisputeMultisig} from "../../contracts/VeriSettleDisputeMultisig.sol";
import {INativeQueryVerifier} from "../../contracts/VerifierInterface.sol";
import {IChainInfo} from "../../contracts/IChainInfo.sol";

contract LocalQueryVerifier is INativeQueryVerifier {
    function verifyAndEmit(
        uint64,
        uint64,
        bytes calldata,
        MerkleProof calldata,
        ContinuityProof calldata
    ) external pure returns (bool) {
        return true;
    }

    function calculateTxIndex(MerkleProof calldata) external pure returns (uint64) {
        return 0;
    }
}

contract LocalChainInfo {
    uint64 public height;
    bool public exists = true;

    function set(uint64 height_, bool exists_) external {
        height = height_;
        exists = exists_;
    }

    function get_latest_attestation_height_and_hash(uint64)
        external
        view
        returns (IChainInfo.HeightHashResult memory)
    {
        return IChainInfo.HeightHashResult({
            height: height,
            hash: bytes32(uint256(height)),
            isAttestation: true,
            exists: exists
        });
    }
}

contract V2OptionalPolicyTest is Test {
    address internal constant BUYER = 0x1000000000000000000000000000000000000001;
    address payable internal constant SELLER = payable(0x2000000000000000000000000000000000000002);
    address internal constant CARRIER = 0x3000000000000000000000000000000000000003;
    address internal constant SIGNER_ONE = 0x4000000000000000000000000000000000000004;
    address internal constant SIGNER_TWO = 0x5000000000000000000000000000000000000005;
    address internal constant SIGNER_THREE = 0x6000000000000000000000000000000000000006;
    address internal constant SOURCE = 0x000000000000000000000000000000000000a11c;
    uint64 internal constant SOURCE_CHAIN_KEY = 1;
    uint64 internal constant ACCEPTANCE_WINDOW = 2 days;
    uint64 internal constant REFUND_WINDOW = 3 days;
    bytes32 internal constant POLICY = keccak256("optional-v2-policy");
    bytes32 internal constant ORDER_ID = keccak256("optional-order");
    bytes32 internal constant TERMS = keccak256("optional-terms");

    LocalChainInfo internal chainInfo;
    VeriSettleCarrierSource internal carrierSource;
    VeriSettleDisputeMultisig internal multisig;
    VeriSettleEscrowASCV2Optional internal escrow;

    function setUp() public {
        vm.etch(0x0000000000000000000000000000000000000FD2, address(new LocalQueryVerifier()).code);
        chainInfo = new LocalChainInfo();
        vm.etch(0x0000000000000000000000000000000000000fD3, address(chainInfo).code);
        chainInfo = LocalChainInfo(0x0000000000000000000000000000000000000fD3);
        chainInfo.set(100, true);

        carrierSource = new VeriSettleCarrierSource(POLICY, address(this));
        carrierSource.registerCarrier(CARRIER, true);

        address[] memory signers = new address[](3);
        signers[0] = SIGNER_ONE;
        signers[1] = SIGNER_TWO;
        signers[2] = SIGNER_THREE;
        multisig = new VeriSettleDisputeMultisig(signers, 2);

        escrow = new VeriSettleEscrowASCV2Optional(
            SOURCE,
            address(carrierSource),
            SOURCE_CHAIN_KEY,
            POLICY,
            ACCEPTANCE_WINDOW,
            REFUND_WINDOW,
            address(multisig)
        );

        vm.deal(BUYER, 10 ether);
        _fundDefault();
    }

    function test_buyerAcceptanceStillReleasesSeller() public {
        uint256 sellerBefore = SELLER.balance;
        uint64 expiresAt = uint64(block.timestamp + 1 days);
        bytes memory encoded = _encodeAcceptance(SOURCE, ORDER_ID, BUYER, SELLER, TERMS, POLICY, expiresAt);
        _submitAcceptance(encoded);
        assertEq(SELLER.balance, sellerBefore + 1 ether);
        (, , , , , , , VeriSettleEscrowASCV2Optional.EscrowStatus status) = escrow.escrows(ORDER_ID);
        assertEq(uint8(status), uint8(VeriSettleEscrowASCV2Optional.EscrowStatus.Released));
    }

    function test_carrierDeliveryReleasesSeller() public {
        uint256 sellerBefore = SELLER.balance;
        bytes memory encoded = _encodeDelivery(address(carrierSource), ORDER_ID, BUYER, SELLER, TERMS, POLICY);
        _submitDelivery(encoded);
        assertEq(SELLER.balance, sellerBefore + 1 ether);
        (, , , , , , , VeriSettleEscrowASCV2Optional.EscrowStatus status) = escrow.escrows(ORDER_ID);
        assertEq(uint8(status), uint8(VeriSettleEscrowASCV2Optional.EscrowStatus.Released));
    }

    function test_unregisteredEmitterAndPolicyMismatchRevert() public {
        bytes memory wrongEmitter = _encodeDelivery(address(0xB0B), ORDER_ID, BUYER, SELLER, TERMS, POLICY);
        vm.expectRevert(abi.encodeWithSelector(VeriSettleEscrowASCV2Optional.UntrustedSourceEmitter.selector, address(0xB0B)));
        _submitDelivery(wrongEmitter);

        bytes memory wrongTerms = _encodeDelivery(address(carrierSource), ORDER_ID, BUYER, SELLER, keccak256("other"), POLICY);
        vm.expectRevert(VeriSettleEscrowASCV2Optional.PolicyMismatch.selector);
        _submitDelivery(wrongTerms);
    }

    function test_carrierPathDisabledWhenNoCarrierConfigured() public {
        VeriSettleEscrowASCV2Optional buyerOnly = new VeriSettleEscrowASCV2Optional(
            SOURCE,
            address(0),
            SOURCE_CHAIN_KEY,
            POLICY,
            ACCEPTANCE_WINDOW,
            REFUND_WINDOW,
            address(multisig)
        );
        vm.prank(BUYER);
        buyerOnly.fundEscrow{value: 1 ether}(keccak256("buyer-only"), SELLER, TERMS, uint64(block.timestamp + 1 days));
        bytes memory encoded = _encodeDelivery(address(carrierSource), keccak256("buyer-only"), BUYER, SELLER, TERMS, POLICY);
        INativeQueryVerifier.MerkleProofEntry[] memory siblings = new INativeQueryVerifier.MerkleProofEntry[](0);
        bytes32[] memory roots = new bytes32[](0);
        vm.expectRevert(VeriSettleEscrowASCV2Optional.CarrierPolicyDisabled.selector);
        buyerOnly.submitDeliveryProof(SOURCE_CHAIN_KEY, 1, encoded, bytes32(0), siblings, bytes32(0), roots);
    }

    function test_relayerCannotRedirectFunds() public {
        uint256 sellerBefore = SELLER.balance;
        uint256 relayerBefore = address(this).balance;
        bytes memory encoded = _encodeDelivery(address(carrierSource), ORDER_ID, BUYER, SELLER, TERMS, POLICY);
        _submitDelivery(encoded);
        assertEq(SELLER.balance, sellerBefore + 1 ether);
        assertEq(address(this).balance, relayerBefore);
    }

    function test_silenceRefundRequiresAttestedHeightProgress() public {
        uint256 buyerBefore = BUYER.balance;
        vm.prank(BUYER);
        vm.expectRevert(abi.encodeWithSelector(VeriSettleEscrowASCV2Optional.AcceptanceWindowOpen.selector, uint64(block.timestamp + 1 days)));
        escrow.refundIfAcceptanceSilent(ORDER_ID);

        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(BUYER);
        vm.expectRevert(abi.encodeWithSelector(VeriSettleEscrowASCV2Optional.AttestedClockNotElapsed.selector, 100, 101));
        escrow.refundIfAcceptanceSilent(ORDER_ID);

        chainInfo.set(101, true);
        vm.prank(BUYER);
        escrow.refundIfAcceptanceSilent(ORDER_ID);
        assertEq(BUYER.balance, buyerBefore + 1 ether);
        (, , , , , , , VeriSettleEscrowASCV2Optional.EscrowStatus status) = escrow.escrows(ORDER_ID);
        assertEq(uint8(status), uint8(VeriSettleEscrowASCV2Optional.EscrowStatus.Refunded));
    }

    function test_unavailableAttestationBlocksSilenceRefund() public {
        vm.warp(block.timestamp + 1 days + 1);
        chainInfo.set(101, false);
        vm.prank(BUYER);
        vm.expectRevert(VeriSettleEscrowASCV2Optional.SourceAttestationUnavailable.selector);
        escrow.refundIfAcceptanceSilent(ORDER_ID);
    }

    function test_multisigCanTimeoutRefundSilentEscrow() public {
        vm.warp(block.timestamp + 1 days + 1);
        chainInfo.set(101, true);
        uint256 buyerBefore = BUYER.balance;
        vm.prank(address(multisig));
        escrow.executeMultisigTimeoutRefund(ORDER_ID);
        assertEq(BUYER.balance, buyerBefore + 1 ether);
    }

    function test_strangerCannotTimeoutRefund() public {
        vm.warp(block.timestamp + 1 days + 1);
        chainInfo.set(101, true);
        vm.prank(SELLER);
        vm.expectRevert(VeriSettleEscrowASCV2Optional.Unauthorized.selector);
        escrow.refundIfAcceptanceSilent(ORDER_ID);

        vm.prank(SELLER);
        vm.expectRevert(abi.encodeWithSelector(VeriSettleEscrowASCV2Optional.UnauthorizedGovernance.selector, SELLER));
        escrow.executeMultisigTimeoutRefund(ORDER_ID);
    }

    function test_carrierSourceRejectsUnregisteredCaller() public {
        vm.prank(BUYER);
        vm.expectRevert(abi.encodeWithSelector(VeriSettleCarrierSource.UnauthorizedCarrier.selector, BUYER));
        carrierSource.confirmDelivery(ORDER_ID, BUYER, SELLER, TERMS);
    }

    function _fundDefault() internal {
        vm.prank(BUYER);
        escrow.fundEscrow{value: 1 ether}(ORDER_ID, SELLER, TERMS, uint64(block.timestamp + 1 days));
    }

    function _submitAcceptance(bytes memory encoded) internal {
        INativeQueryVerifier.MerkleProofEntry[] memory siblings = new INativeQueryVerifier.MerkleProofEntry[](0);
        bytes32[] memory roots = new bytes32[](0);
        escrow.submitAcceptanceProof(SOURCE_CHAIN_KEY, 1, encoded, bytes32(0), siblings, bytes32(0), roots);
    }

    function _submitDelivery(bytes memory encoded) internal {
        INativeQueryVerifier.MerkleProofEntry[] memory siblings = new INativeQueryVerifier.MerkleProofEntry[](0);
        bytes32[] memory roots = new bytes32[](0);
        escrow.submitDeliveryProof(SOURCE_CHAIN_KEY, 1, encoded, bytes32(0), siblings, bytes32(0), roots);
    }

    function _encodeAcceptance(
        address emitter,
        bytes32 orderId,
        address buyer,
        address seller,
        bytes32 termsCommitment,
        bytes32 policyHash,
        uint64 acceptanceExpiresAt
    ) internal pure returns (bytes memory) {
        bytes32[] memory topics = new bytes32[](4);
        topics[0] = keccak256("OrderAcceptedV2(bytes32,address,address,bytes32,bytes32,uint64)");
        topics[1] = orderId;
        topics[2] = bytes32(uint256(uint160(buyer)));
        topics[3] = bytes32(uint256(uint160(seller)));
        return _encodeReceipt(emitter, topics, abi.encode(termsCommitment, policyHash, acceptanceExpiresAt));
    }

    function _encodeDelivery(
        address emitter,
        bytes32 orderId,
        address buyer,
        address seller,
        bytes32 termsCommitment,
        bytes32 policyHash
    ) internal pure returns (bytes memory) {
        bytes32[] memory topics = new bytes32[](4);
        topics[0] = keccak256("DeliveryConfirmed(bytes32,address,address,bytes32,bytes32)");
        topics[1] = orderId;
        topics[2] = bytes32(uint256(uint160(buyer)));
        topics[3] = bytes32(uint256(uint160(seller)));
        return _encodeReceipt(emitter, topics, abi.encode(termsCommitment, policyHash));
    }

    function _encodeReceipt(address emitter, bytes32[] memory topics, bytes memory data) internal pure returns (bytes memory) {
        EvmV1Decoder.LogEntryTuple[] memory logs = new EvmV1Decoder.LogEntryTuple[](1);
        logs[0] = EvmV1Decoder.LogEntryTuple({address_: emitter, topics: topics, data: data});
        bytes[] memory chunks = new bytes[](3);
        chunks[0] = hex"00";
        chunks[1] = hex"00";
        chunks[2] = abi.encode(uint8(1), uint64(21_000), logs, bytes(""));
        return abi.encode(uint8(2), chunks);
    }

    receive() external payable {}
}
