// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IVeriSettleDisputeResolutionTarget {
    function executeMultisigDisputeResolution(bytes32 orderId, bool releaseToSeller) external;
}

/**
 * @title VeriSettleDisputeMultisig
 * @notice Minimal threshold executor for VeriSettle escrow dispute outcomes.
 * @dev Each action binds the current chain, escrow target, order, recipient outcome,
 * and strictly increasing nonce. Signers approve on-chain; the threshold approval
 * atomically executes the exact requested escrow resolution.
 */
contract VeriSettleDisputeMultisig {
    mapping(address => bool) public isSigner;
    mapping(bytes32 => mapping(address => bool)) public approvedBy;
    mapping(bytes32 => uint256) public approvalCount;
    mapping(bytes32 => bool) public executed;

    uint8 public immutable threshold;
    uint8 public immutable signerCount;
    uint256 public nextNonce;

    event DisputeResolutionApproved(
        bytes32 indexed actionHash,
        address indexed signer,
        address indexed escrow,
        bytes32 orderId,
        bool releaseToSeller,
        uint256 nonce,
        uint256 approvalCount
    );
    event DisputeResolutionExecuted(
        bytes32 indexed actionHash,
        address indexed escrow,
        bytes32 orderId,
        bool releaseToSeller,
        uint256 nonce
    );

    error InvalidSigner(address signer);
    error DuplicateSigner(address signer);
    error InvalidThreshold(uint8 threshold, uint256 signerCount);
    error UnauthorizedSigner(address signer);
    error InvalidEscrow(address escrow);
    error InvalidNonce(uint256 expected, uint256 supplied);
    error ActionAlreadyApproved(bytes32 actionHash, address signer);
    error ActionAlreadyExecuted(bytes32 actionHash);

    constructor(address[] memory signers, uint8 threshold_) {
        uint256 count = signers.length;
        if (count == 0 || threshold_ == 0 || threshold_ > count || count > type(uint8).max) {
            revert InvalidThreshold(threshold_, count);
        }

        for (uint256 i; i < count; ++i) {
            address signer = signers[i];
            if (signer == address(0)) revert InvalidSigner(signer);
            if (isSigner[signer]) revert DuplicateSigner(signer);
            isSigner[signer] = true;
        }

        threshold = threshold_;
        signerCount = uint8(count);
    }

    function disputeResolutionActionHash(
        address escrow,
        bytes32 orderId,
        bool releaseToSeller,
        uint256 nonce
    ) public view returns (bytes32) {
        return keccak256(
            abi.encode(
                "VERISETTLE_DISPUTE_RESOLUTION_V1",
                block.chainid,
                address(this),
                escrow,
                orderId,
                releaseToSeller,
                nonce
            )
        );
    }

    function approveDisputeResolution(
        address escrow,
        bytes32 orderId,
        bool releaseToSeller,
        uint256 nonce
    ) external {
        if (!isSigner[msg.sender]) revert UnauthorizedSigner(msg.sender);
        if (escrow == address(0)) revert InvalidEscrow(escrow);
        if (nonce != nextNonce) revert InvalidNonce(nextNonce, nonce);

        bytes32 actionHash = disputeResolutionActionHash(escrow, orderId, releaseToSeller, nonce);
        if (executed[actionHash]) revert ActionAlreadyExecuted(actionHash);
        if (approvedBy[actionHash][msg.sender]) revert ActionAlreadyApproved(actionHash, msg.sender);

        approvedBy[actionHash][msg.sender] = true;
        uint256 approvals = ++approvalCount[actionHash];
        emit DisputeResolutionApproved(actionHash, msg.sender, escrow, orderId, releaseToSeller, nonce, approvals);

        if (approvals < threshold) return;

        executed[actionHash] = true;
        ++nextNonce;
        IVeriSettleDisputeResolutionTarget(escrow).executeMultisigDisputeResolution(orderId, releaseToSeller);
        emit DisputeResolutionExecuted(actionHash, escrow, orderId, releaseToSeller, nonce);
    }
}
