// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Test} from "forge-std/Test.sol";
import {VeriSettleEscrowASCV2} from "../../contracts/VeriSettleEscrowASCV2.sol";
import {INativeQueryVerifier} from "../../contracts/VerifierInterface.sol";

/**
 * @dev Minimal local substitute for CC3's verifier precompile. It is installed at the
 * production precompile address only within Foundry's ephemeral test VM. Receipt replay
 * reaches the real V2 processed-query guard before any receipt decoding or value release.
 */
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

contract V2EscrowInvariantHandler is Test {
    struct RecordedEscrow {
        bytes32 orderId;
        uint128 amount;
        uint64 createdAt;
        uint64 acceptanceExpiresAt;
        uint64 refundAfter;
    }

    uint64 internal constant SOURCE_CHAIN_KEY = 11155111;
    uint64 internal constant ACCEPTANCE_WINDOW = 2 days;
    uint64 internal constant REFUND_WINDOW = 3 days;

    VeriSettleEscrowASCV2 internal immutable escrow;
    address internal immutable buyer;
    address payable internal immutable seller;
    uint256 internal nonce;
    uint256 internal fundedTotal;
    uint256 internal refundedTotal;
    bool internal earlyRefundSucceeded;
    bool internal replayWasAccepted;
    bool internal replayRejectedForUnexpectedReason;
    bool internal lateRefundFailed;
    RecordedEscrow[] internal recordedEscrows;

    constructor(VeriSettleEscrowASCV2 escrow_, address buyer_, address payable seller_) {
        escrow = escrow_;
        buyer = buyer_;
        seller = seller_;
        vm.deal(buyer, 1_000_000 ether);
    }

    function fund(uint96 amountSeed, uint64 validitySeed) external {
        uint128 amount = uint128(bound(uint256(amountSeed), 1 wei, 1 ether));
        uint64 validity = uint64(bound(uint256(validitySeed), 1, ACCEPTANCE_WINDOW));
        uint64 createdAt = uint64(block.timestamp);
        uint64 acceptanceExpiresAt = createdAt + validity;
        bytes32 orderId = keccak256(abi.encodePacked("invariant-order", ++nonce));
        bytes32 termsCommitment = keccak256(abi.encodePacked("terms", orderId));

        vm.prank(buyer);
        escrow.fundEscrow{value: amount}(orderId, seller, termsCommitment, acceptanceExpiresAt);

        recordedEscrows.push(RecordedEscrow({
            orderId: orderId,
            amount: amount,
            createdAt: createdAt,
            acceptanceExpiresAt: acceptanceExpiresAt,
            refundAfter: acceptanceExpiresAt + REFUND_WINDOW
        }));
        fundedTotal += amount;
    }

    function advanceTime(uint64 jumpSeed) external {
        uint256 boundedJump = bound(uint256(jumpSeed), 1, 14 days);
        vm.warp(block.timestamp + boundedJump);
    }

    function exerciseRefund(uint8 indexSeed) external {
        uint256 count = recordedEscrows.length;
        if (count == 0) return;

        RecordedEscrow memory record = recordedEscrows[uint256(indexSeed) % count];
        (, , , , , , VeriSettleEscrowASCV2.EscrowStatus status) = escrow.escrows(record.orderId);
        if (status != VeriSettleEscrowASCV2.EscrowStatus.Funded) return;

        vm.prank(buyer);
        if (block.timestamp < record.refundAfter) {
            try escrow.refundExpiredEscrow(record.orderId) {
                earlyRefundSucceeded = true;
            } catch {}
        } else {
            try escrow.refundExpiredEscrow(record.orderId) {
                refundedTotal += record.amount;
            } catch {
                lateRefundFailed = true;
            }
        }
    }

    function attemptKnownReplay(uint64 blockHeightSeed) external {
        uint64 blockHeight = uint64(bound(uint256(blockHeightSeed), 1, type(uint32).max));
        bytes32 queryId = keccak256(
            abi.encodePacked(bytes32(uint256(SOURCE_CHAIN_KEY)), bytes8(blockHeight), bytes32(uint256(0)))
        );
        // Slots 0-1 belong to Ownable and ReentrancyGuard; `processedQueries`
        // is the second mapping declared by V2 itself at storage slot 3.
        bytes32 processedQuerySlot = keccak256(abi.encode(queryId, uint256(3)));
        vm.store(address(escrow), processedQuerySlot, bytes32(uint256(1)));

        INativeQueryVerifier.MerkleProofEntry[] memory siblings = new INativeQueryVerifier.MerkleProofEntry[](0);
        bytes32[] memory continuityRoots = new bytes32[](0);
        try escrow.submitAcceptanceProof(
            SOURCE_CHAIN_KEY,
            blockHeight,
            hex"00",
            bytes32(0),
            siblings,
            bytes32(0),
            continuityRoots
        ) {
            replayWasAccepted = true;
        } catch (bytes memory reason) {
            if (reason.length < 4 || bytes4(reason) != VeriSettleEscrowASCV2.QueryAlreadyProcessed.selector) {
                replayRejectedForUnexpectedReason = true;
            }
        }
    }

    function recordCount() external view returns (uint256) {
        return recordedEscrows.length;
    }

    function recordAt(uint256 index) external view returns (RecordedEscrow memory) {
        return recordedEscrows[index];
    }

    function escrowBalance() external view returns (uint256) {
        return address(escrow).balance;
    }

    function expectedEscrowBalance() external view returns (uint256) {
        return fundedTotal - refundedTotal;
    }

    function didEarlyRefundSucceed() external view returns (bool) {
        return earlyRefundSucceeded;
    }

    function wasReplayAccepted() external view returns (bool) {
        return replayWasAccepted;
    }

    function replayFailedUnexpectedly() external view returns (bool) {
        return replayRejectedForUnexpectedReason;
    }

    function didLateRefundFail() external view returns (bool) {
        return lateRefundFailed;
    }
}

contract V2EscrowInvariants is StdInvariant, Test {
    address internal constant VERIFIER_PRECOMPILE = 0x0000000000000000000000000000000000000FD2;
    address internal constant SOURCE_CONTRACT = 0x1000000000000000000000000000000000000001;
    address internal constant BUYER = 0x2000000000000000000000000000000000000002;
    address payable internal constant SELLER = payable(0x3000000000000000000000000000000000000003);
    bytes32 internal constant POLICY_HASH = keccak256("VeriSettle V2 invariant policy");
    uint64 internal constant ACCEPTANCE_WINDOW = 2 days;
    uint64 internal constant REFUND_WINDOW = 3 days;

    VeriSettleEscrowASCV2 internal escrow;
    V2EscrowInvariantHandler internal handler;

    function setUp() public {
        LocalQueryVerifier localVerifier = new LocalQueryVerifier();
        vm.etch(VERIFIER_PRECOMPILE, address(localVerifier).code);

        escrow = new VeriSettleEscrowASCV2(
            SOURCE_CONTRACT,
            11155111,
            POLICY_HASH,
            ACCEPTANCE_WINDOW,
            REFUND_WINDOW
        );
        handler = new V2EscrowInvariantHandler(escrow, BUYER, SELLER);

        targetContract(address(handler));
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = V2EscrowInvariantHandler.fund.selector;
        selectors[1] = V2EscrowInvariantHandler.advanceTime.selector;
        selectors[2] = V2EscrowInvariantHandler.exerciseRefund.selector;
        selectors[3] = V2EscrowInvariantHandler.attemptKnownReplay.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
    }

    function invariant_expiryIsBoundToTheConfiguredAcceptanceWindow() public view {
        uint256 count = handler.recordCount();
        for (uint256 i; i < count; ++i) {
            V2EscrowInvariantHandler.RecordedEscrow memory record = handler.recordAt(i);
            assertGt(record.acceptanceExpiresAt, record.createdAt);
            assertLe(record.acceptanceExpiresAt, record.createdAt + ACCEPTANCE_WINDOW);
            assertEq(record.refundAfter, record.acceptanceExpiresAt + REFUND_WINDOW);
        }
    }

    function invariant_earlyRefundsNeverSucceed() public view {
        assertFalse(handler.didEarlyRefundSucceed());
    }

    function invariant_processedQueryReplayNeverReachesVerificationOrRelease() public view {
        assertFalse(handler.wasReplayAccepted());
        assertFalse(handler.replayFailedUnexpectedly());
    }

    function invariant_escrowAccountingTracksOnlyFundedOrRefundedValue() public view {
        assertEq(handler.escrowBalance(), handler.expectedEscrowBalance());
        assertFalse(handler.didLateRefundFail());
    }

    function invariant_everyExpiredFundedEscrowIsRefundableExactlyOnce() public {
        uint256 count = handler.recordCount();
        for (uint256 i; i < count; ++i) {
            V2EscrowInvariantHandler.RecordedEscrow memory record = handler.recordAt(i);
            (, , , , , , VeriSettleEscrowASCV2.EscrowStatus status) = escrow.escrows(record.orderId);
            if (status != VeriSettleEscrowASCV2.EscrowStatus.Funded || block.timestamp < record.refundAfter) continue;

            uint256 snapshot = vm.snapshot();
            uint256 buyerBalanceBefore = BUYER.balance;
            vm.prank(BUYER);
            escrow.refundExpiredEscrow(record.orderId);
            assertEq(BUYER.balance, buyerBalanceBefore + record.amount);
            (, , , , , , VeriSettleEscrowASCV2.EscrowStatus refundedStatus) = escrow.escrows(record.orderId);
            assertEq(uint8(refundedStatus), uint8(VeriSettleEscrowASCV2.EscrowStatus.Refunded));
            assertTrue(vm.revertTo(snapshot));
        }
    }
}
