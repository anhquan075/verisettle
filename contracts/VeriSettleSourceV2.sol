// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title VeriSettleSourceV2
 * @notice Policy-pinned Sepolia source of buyer acceptance evidence for a single V2 settlement policy.
 */
contract VeriSettleSourceV2 {
    bytes32 public immutable policyHash;
    uint64 public immutable acceptanceWindowSeconds;
    mapping(bytes32 => bool) public acceptedOrders;

    event OrderAcceptedV2(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        bytes32 termsCommitment,
        bytes32 policyHash,
        uint64 acceptanceExpiresAt
    );

    error OrderAlreadyAccepted(bytes32 orderId);
    error InvalidSeller();
    error InvalidTermsCommitment();
    error InvalidPolicyHash();
    error InvalidAcceptanceDeadline(uint64 acceptanceExpiresAt);

    constructor(bytes32 policyHash_, uint64 acceptanceWindowSeconds_) {
        if (policyHash_ == bytes32(0)) revert InvalidPolicyHash();
        if (acceptanceWindowSeconds_ == 0) revert InvalidAcceptanceDeadline(0);
        policyHash = policyHash_;
        acceptanceWindowSeconds = acceptanceWindowSeconds_;
    }

    function acceptOrder(bytes32 orderId, address seller, bytes32 termsCommitment, uint64 acceptanceExpiresAt) external {
        if (acceptedOrders[orderId]) revert OrderAlreadyAccepted(orderId);
        if (seller == address(0)) revert InvalidSeller();
        if (termsCommitment == bytes32(0)) revert InvalidTermsCommitment();
        if (
            acceptanceExpiresAt <= block.timestamp ||
            acceptanceExpiresAt > block.timestamp + acceptanceWindowSeconds
        ) revert InvalidAcceptanceDeadline(acceptanceExpiresAt);

        acceptedOrders[orderId] = true;
        emit OrderAcceptedV2(orderId, msg.sender, seller, termsCommitment, policyHash, acceptanceExpiresAt);
    }
}
