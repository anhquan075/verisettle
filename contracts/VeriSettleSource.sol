// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title VeriSettleSource
 * @notice Canonical Sepolia source of a buyer's on-chain acceptance evidence.
 * @dev The Creditcoin ASC accepts an attested receipt only when it contains this event
 * from this exact deployed contract. No application-supplied hash can replace it.
 */
contract VeriSettleSource {
    mapping(bytes32 => bool) public acceptedOrders;

    event OrderAccepted(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        bytes32 termsHash
    );

    error OrderAlreadyAccepted(bytes32 orderId);
    error InvalidSeller();
    error InvalidTermsHash();

    function acceptOrder(bytes32 orderId, address seller, bytes32 termsHash) external {
        if (acceptedOrders[orderId]) revert OrderAlreadyAccepted(orderId);
        if (seller == address(0)) revert InvalidSeller();
        if (termsHash == bytes32(0)) revert InvalidTermsHash();

        acceptedOrders[orderId] = true;
        emit OrderAccepted(orderId, msg.sender, seller, termsHash);
    }
}
