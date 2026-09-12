// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title VeriSettleCarrierSource
 * @notice Optional Sepolia carrier emitter. A registered carrier — not the buyer — emits
 * DeliveryConfirmed. This is an optional third-party delivery signal, not a substitute for
 * buyer OrderAccepted / OrderAcceptedV2 on the live V1/V2 routes.
 */
contract VeriSettleCarrierSource {
    bytes32 public immutable policyHash;
    address public immutable registrar;

    mapping(address => bool) public isCarrier;
    mapping(bytes32 => bool) public confirmedOrders;

    event CarrierRegistered(address indexed carrier, bool allowed);
    event DeliveryConfirmed(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        bytes32 termsCommitment,
        bytes32 policyHash
    );

    error InvalidPolicyHash();
    error InvalidRegistrar();
    error InvalidCarrier();
    error UnauthorizedCarrier(address caller);
    error OrderAlreadyConfirmed(bytes32 orderId);
    error InvalidBuyer();
    error InvalidSeller();
    error InvalidTermsCommitment();

    constructor(bytes32 policyHash_, address registrar_) {
        if (policyHash_ == bytes32(0)) revert InvalidPolicyHash();
        if (registrar_ == address(0)) revert InvalidRegistrar();
        policyHash = policyHash_;
        registrar = registrar_;
    }

    function registerCarrier(address carrier, bool allowed) external {
        if (msg.sender != registrar) revert InvalidRegistrar();
        if (carrier == address(0)) revert InvalidCarrier();
        isCarrier[carrier] = allowed;
        emit CarrierRegistered(carrier, allowed);
    }

    function confirmDelivery(bytes32 orderId, address buyer, address seller, bytes32 termsCommitment) external {
        if (!isCarrier[msg.sender]) revert UnauthorizedCarrier(msg.sender);
        if (confirmedOrders[orderId]) revert OrderAlreadyConfirmed(orderId);
        if (buyer == address(0)) revert InvalidBuyer();
        if (seller == address(0)) revert InvalidSeller();
        if (termsCommitment == bytes32(0)) revert InvalidTermsCommitment();

        confirmedOrders[orderId] = true;
        emit DeliveryConfirmed(orderId, buyer, seller, termsCommitment, policyHash);
    }
}
