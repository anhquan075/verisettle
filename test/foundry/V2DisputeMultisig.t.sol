// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import {VeriSettleDisputeMultisig} from "../../contracts/VeriSettleDisputeMultisig.sol";
import {VeriSettleEscrowASCV2Governed} from "../../contracts/VeriSettleEscrowASCV2Governed.sol";

contract V2DisputeMultisigTest is Test {
    address internal constant BUYER = 0x1000000000000000000000000000000000000001;
    address payable internal constant SELLER = payable(0x2000000000000000000000000000000000000002);
    address internal constant SIGNER_ONE = 0x3000000000000000000000000000000000000003;
    address internal constant SIGNER_TWO = 0x4000000000000000000000000000000000000004;
    address internal constant SIGNER_THREE = 0x5000000000000000000000000000000000000005;
    bytes32 internal constant ORDER_ID = keccak256("multisig-dispute-order");
    bytes32 internal constant TERMS = keccak256("multisig-dispute-terms");
    bytes32 internal constant POLICY = keccak256("multisig-governed-v2-policy");

    VeriSettleDisputeMultisig internal multisig;
    VeriSettleEscrowASCV2Governed internal escrow;

    function setUp() public {
        address[] memory signers = new address[](3);
        signers[0] = SIGNER_ONE;
        signers[1] = SIGNER_TWO;
        signers[2] = SIGNER_THREE;
        multisig = new VeriSettleDisputeMultisig(signers, 2);
        escrow = new VeriSettleEscrowASCV2Governed(
            address(0xA11CE),
            11155111,
            POLICY,
            2 days,
            3 days,
            address(multisig)
        );

        vm.deal(BUYER, 10 ether);
        vm.prank(BUYER);
        escrow.fundEscrow{value: 1 ether}(ORDER_ID, SELLER, TERMS, uint64(block.timestamp + 1 days));
        vm.prank(BUYER);
        escrow.raiseDispute(ORDER_ID, keccak256("evidence"));
    }

    function test_twoOfThreeApprovalsAtomicallyReleaseTheDisputedEscrow() public {
        uint256 sellerBalanceBefore = SELLER.balance;
        vm.prank(SIGNER_ONE);
        multisig.approveDisputeResolution(address(escrow), ORDER_ID, true, 0);

        (, , , , , , VeriSettleEscrowASCV2Governed.EscrowStatus waitingStatus) = escrow.escrows(ORDER_ID);
        assertEq(uint8(waitingStatus), uint8(VeriSettleEscrowASCV2Governed.EscrowStatus.Disputed));
        assertEq(SELLER.balance, sellerBalanceBefore);

        vm.prank(SIGNER_TWO);
        multisig.approveDisputeResolution(address(escrow), ORDER_ID, true, 0);

        (, , , uint128 amount, , , VeriSettleEscrowASCV2Governed.EscrowStatus releasedStatus) = escrow.escrows(ORDER_ID);
        assertEq(uint8(releasedStatus), uint8(VeriSettleEscrowASCV2Governed.EscrowStatus.Released));
        assertEq(SELLER.balance, sellerBalanceBefore + amount);
        assertEq(multisig.nextNonce(), 1);
    }

    function test_singleSignerCannotResolveAndDuplicateApprovalIsRejected() public {
        vm.prank(SIGNER_ONE);
        multisig.approveDisputeResolution(address(escrow), ORDER_ID, false, 0);

        bytes32 actionHash = multisig.disputeResolutionActionHash(address(escrow), ORDER_ID, false, 0);
        vm.prank(SIGNER_ONE);
        vm.expectRevert(
            abi.encodeWithSelector(VeriSettleDisputeMultisig.ActionAlreadyApproved.selector, actionHash, SIGNER_ONE)
        );
        multisig.approveDisputeResolution(address(escrow), ORDER_ID, false, 0);

        (, , , , , , VeriSettleEscrowASCV2Governed.EscrowStatus status) = escrow.escrows(ORDER_ID);
        assertEq(uint8(status), uint8(VeriSettleEscrowASCV2Governed.EscrowStatus.Disputed));
    }

    function test_nonSignerAndDirectResolutionAreRejected() public {
        vm.prank(address(0xB0B));
        vm.expectRevert(abi.encodeWithSelector(VeriSettleDisputeMultisig.UnauthorizedSigner.selector, address(0xB0B)));
        multisig.approveDisputeResolution(address(escrow), ORDER_ID, true, 0);

        vm.expectRevert(abi.encodeWithSelector(VeriSettleEscrowASCV2Governed.UnauthorizedGovernance.selector, address(this)));
        escrow.executeMultisigDisputeResolution(ORDER_ID, true);
    }

    function test_resolutionHashCannotBeReplayedWithANewNonce() public {
        vm.prank(SIGNER_ONE);
        multisig.approveDisputeResolution(address(escrow), ORDER_ID, false, 0);
        vm.prank(SIGNER_TWO);
        multisig.approveDisputeResolution(address(escrow), ORDER_ID, false, 0);

        vm.prank(SIGNER_THREE);
        vm.expectRevert(abi.encodeWithSelector(VeriSettleDisputeMultisig.InvalidNonce.selector, 1, 0));
        multisig.approveDisputeResolution(address(escrow), ORDER_ID, false, 0);
    }
}
