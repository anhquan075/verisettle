// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EvmV1Decoder} from "@gluwa/usc-contracts/contracts/decoding/EvmV1Decoder.sol";
import {INativeQueryVerifier, NativeQueryVerifierLib} from "./VerifierInterface.sol";
import {IChainInfo, ChainInfoLib} from "./IChainInfo.sol";

/**
 * @title VeriSettleEscrowASCV2Optional
 * @notice Optional V2-family policy: buyer OrderAcceptedV2 remains a valid release path,
 * a registered carrier DeliveryConfirmed event may also release, and silence after the
 * acceptance deadline can refund the buyer. Multisig may execute the same timeout refund.
 * @dev This is a new optional deployment. Live V1/V2/V3 buyer-accept routes stay authoritative.
 * A relayer that only calls submitAcceptanceProof / submitDeliveryProof cannot redirect funds:
 * ASC party and terms checks remain the release authority.
 */
contract VeriSettleEscrowASCV2Optional is ReentrancyGuard {
    enum EscrowStatus { None, Funded, Released, Refunded, Disputed }

    struct Escrow {
        address buyer;
        address payable seller;
        bytes32 termsCommitment;
        uint128 amount;
        uint64 acceptanceExpiresAt;
        uint64 refundAfter;
        uint64 silenceAfterSourceHeight;
        EscrowStatus status;
    }

    bytes32 public constant ORDER_ACCEPTED_V2_EVENT_SIGNATURE =
        keccak256("OrderAcceptedV2(bytes32,address,address,bytes32,bytes32,uint64)");
    bytes32 public constant DELIVERY_CONFIRMED_EVENT_SIGNATURE =
        keccak256("DeliveryConfirmed(bytes32,address,address,bytes32,bytes32)");

    bytes32 public immutable policyHash;
    uint64 public immutable sourceChainKey;
    address public immutable sourceContract;
    address public immutable carrierContract;
    uint64 public immutable acceptanceWindowSeconds;
    uint64 public immutable refundWindowSeconds;
    address public immutable disputeGovernance;
    INativeQueryVerifier public immutable verifier;
    IChainInfo public immutable chainInfo;

    mapping(bytes32 => Escrow) public escrows;
    mapping(bytes32 => bool) public processedQueries;

    event EscrowFundedV2(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        bytes32 termsCommitment,
        bytes32 policyHash,
        uint64 acceptanceExpiresAt,
        uint64 refundAfter,
        uint64 silenceAfterSourceHeight
    );
    event EscrowReleasedV2(bytes32 indexed orderId, bytes32 indexed queryId, address indexed seller, uint256 amount, bytes32 policyHash);
    event EscrowRefundedV2(bytes32 indexed orderId, address indexed buyer, uint256 amount);
    event EscrowDisputedV2(bytes32 indexed orderId, address indexed raisedBy, bytes32 evidenceHash);
    event DisputeResolvedV2(bytes32 indexed orderId, bool releasedToSeller, uint256 amount, address indexed governance);
    event SilenceTimeoutRefunded(bytes32 indexed orderId, address indexed buyer, uint256 amount, uint64 attestedHeight, address indexed caller);

    error InvalidSourceContract();
    error InvalidPolicyHash();
    error InvalidPolicyWindow();
    error InvalidSeller();
    error InvalidEscrowAmount();
    error InvalidTermsCommitment();
    error InvalidAcceptanceDeadline(uint64 acceptanceExpiresAt);
    error EscrowAlreadyExists(bytes32 orderId);
    error EscrowNotFunded(bytes32 orderId);
    error Unauthorized();
    error UnauthorizedGovernance(address caller);
    error RefundNotAvailable(uint64 refundAfter);
    error QueryAlreadyProcessed(bytes32 queryId);
    error InvalidSourceChain(uint64 suppliedChainKey);
    error ProofVerificationFailed();
    error SourceTransactionFailed();
    error MissingAcceptanceEvent();
    error MissingDeliveryEvent();
    error UntrustedSourceEmitter(address emitter);
    error InvalidAcceptanceEvent();
    error InvalidDeliveryEvent();
    error PolicyMismatch();
    error NativeTransferFailed();
    error CarrierPolicyDisabled();
    error GovernancePolicyDisabled();
    error SourceAttestationUnavailable();
    error AttestedClockNotElapsed(uint64 attestedHeight, uint64 requiredHeight);
    error AcceptanceWindowOpen(uint64 acceptanceExpiresAt);

    constructor(
        address sourceContract_,
        address carrierContract_,
        uint64 sourceChainKey_,
        bytes32 policyHash_,
        uint64 acceptanceWindowSeconds_,
        uint64 refundWindowSeconds_,
        address disputeGovernance_
    ) {
        if (sourceContract_ == address(0)) revert InvalidSourceContract();
        if (policyHash_ == bytes32(0)) revert InvalidPolicyHash();
        if (acceptanceWindowSeconds_ == 0 || refundWindowSeconds_ < acceptanceWindowSeconds_) revert InvalidPolicyWindow();
        sourceContract = sourceContract_;
        carrierContract = carrierContract_;
        sourceChainKey = sourceChainKey_;
        policyHash = policyHash_;
        acceptanceWindowSeconds = acceptanceWindowSeconds_;
        refundWindowSeconds = refundWindowSeconds_;
        disputeGovernance = disputeGovernance_;
        verifier = NativeQueryVerifierLib.getVerifier();
        chainInfo = ChainInfoLib.getChainInfo();
    }

    function fundEscrow(bytes32 orderId, address payable seller, bytes32 termsCommitment, uint64 acceptanceExpiresAt) external payable {
        if (seller == address(0)) revert InvalidSeller();
        if (termsCommitment == bytes32(0)) revert InvalidTermsCommitment();
        if (msg.value == 0 || msg.value > type(uint128).max) revert InvalidEscrowAmount();
        if (
            acceptanceExpiresAt <= block.timestamp ||
            acceptanceExpiresAt > block.timestamp + acceptanceWindowSeconds
        ) revert InvalidAcceptanceDeadline(acceptanceExpiresAt);
        if (escrows[orderId].status != EscrowStatus.None) revert EscrowAlreadyExists(orderId);

        uint64 refundAfter = acceptanceExpiresAt + refundWindowSeconds;
        uint64 silenceAfterSourceHeight = _attestedHeightOrZero() + 1;
        escrows[orderId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            termsCommitment: termsCommitment,
            amount: uint128(msg.value),
            acceptanceExpiresAt: acceptanceExpiresAt,
            refundAfter: refundAfter,
            silenceAfterSourceHeight: silenceAfterSourceHeight,
            status: EscrowStatus.Funded
        });
        emit EscrowFundedV2(
            orderId,
            msg.sender,
            seller,
            msg.value,
            termsCommitment,
            policyHash,
            acceptanceExpiresAt,
            refundAfter,
            silenceAfterSourceHeight
        );
    }

    function submitAcceptanceProof(
        uint64 chainKey,
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings,
        bytes32 lowerEndpointDigest,
        bytes32[] calldata continuityRoots
    ) external nonReentrant returns (bytes32 queryId) {
        queryId = _verifyAndMarkQuery(chainKey, blockHeight, encodedTransaction, merkleRoot, siblings, lowerEndpointDigest, continuityRoots);
        _releaseFromAcceptanceReceipt(encodedTransaction, queryId);
    }

    function submitDeliveryProof(
        uint64 chainKey,
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings,
        bytes32 lowerEndpointDigest,
        bytes32[] calldata continuityRoots
    ) external nonReentrant returns (bytes32 queryId) {
        if (carrierContract == address(0)) revert CarrierPolicyDisabled();
        queryId = _verifyAndMarkQuery(chainKey, blockHeight, encodedTransaction, merkleRoot, siblings, lowerEndpointDigest, continuityRoots);
        _releaseFromDeliveryReceipt(encodedTransaction, queryId);
    }

    function refundExpiredEscrow(bytes32 orderId) external nonReentrant {
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded(orderId);
        if (msg.sender != escrow.buyer) revert Unauthorized();
        if (block.timestamp < escrow.refundAfter) revert RefundNotAvailable(escrow.refundAfter);
        _refundBuyer(orderId, escrow, msg.sender, 0, false);
    }

    /// @notice Buyer reclaim after the acceptance window if no proof arrived. ChainInfo attested height is the source-chain clock.
    function refundIfAcceptanceSilent(bytes32 orderId) external nonReentrant {
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded(orderId);
        if (msg.sender != escrow.buyer) revert Unauthorized();
        _requireSilenceElapsed(escrow);
        _refundBuyer(orderId, escrow, msg.sender, _requireAttestedHeight(), true);
    }

    /// @notice V3-aligned governed timeout: the dispute multisig may refund a silent funded escrow.
    function executeMultisigTimeoutRefund(bytes32 orderId) external nonReentrant {
        if (disputeGovernance == address(0)) revert GovernancePolicyDisabled();
        if (msg.sender != disputeGovernance) revert UnauthorizedGovernance(msg.sender);
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded(orderId);
        _requireSilenceElapsed(escrow);
        _refundBuyer(orderId, escrow, msg.sender, _requireAttestedHeight(), true);
    }

    function raiseDispute(bytes32 orderId, bytes32 evidenceHash) external {
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded(orderId);
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) revert Unauthorized();
        escrow.status = EscrowStatus.Disputed;
        emit EscrowDisputedV2(orderId, msg.sender, evidenceHash);
    }

    function executeMultisigDisputeResolution(bytes32 orderId, bool releaseToSeller) external nonReentrant {
        if (disputeGovernance == address(0)) revert GovernancePolicyDisabled();
        if (msg.sender != disputeGovernance) revert UnauthorizedGovernance(msg.sender);
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Disputed) revert EscrowNotFunded(orderId);
        escrow.status = releaseToSeller ? EscrowStatus.Released : EscrowStatus.Refunded;
        address payable recipient = releaseToSeller ? escrow.seller : payable(escrow.buyer);
        (bool sent,) = recipient.call{value: escrow.amount}("");
        if (!sent) revert NativeTransferFailed();
        emit DisputeResolvedV2(orderId, releaseToSeller, escrow.amount, msg.sender);
    }

    function _verifyAndMarkQuery(
        uint64 chainKey,
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings,
        bytes32 lowerEndpointDigest,
        bytes32[] calldata continuityRoots
    ) internal returns (bytes32 queryId) {
        if (chainKey != sourceChainKey) revert InvalidSourceChain(chainKey);
        INativeQueryVerifier.MerkleProof memory merkleProof = INativeQueryVerifier.MerkleProof({root: merkleRoot, siblings: siblings});
        queryId = _computeQueryId(chainKey, blockHeight, merkleProof);
        if (processedQueries[queryId]) revert QueryAlreadyProcessed(queryId);

        INativeQueryVerifier.ContinuityProof memory continuityProof =
            INativeQueryVerifier.ContinuityProof({lowerEndpointDigest: lowerEndpointDigest, roots: continuityRoots});
        if (!verifier.verifyAndEmit(chainKey, blockHeight, encodedTransaction, merkleProof, continuityProof)) revert ProofVerificationFailed();

        processedQueries[queryId] = true;
    }

    function _releaseFromAcceptanceReceipt(bytes memory encodedTransaction, bytes32 queryId) internal {
        EvmV1Decoder.LogEntry memory log = _requireSingleLog(
            encodedTransaction,
            ORDER_ACCEPTED_V2_EVENT_SIGNATURE,
            sourceContract,
            96,
            true
        );
        (bytes32 termsCommitment, bytes32 receiptPolicyHash, uint64 acceptanceExpiresAt) =
            abi.decode(log.data, (bytes32, bytes32, uint64));
        _releaseMatchedEscrow(log, termsCommitment, receiptPolicyHash, acceptanceExpiresAt, true, queryId);
    }

    function _releaseFromDeliveryReceipt(bytes memory encodedTransaction, bytes32 queryId) internal {
        EvmV1Decoder.LogEntry memory log = _requireSingleLog(
            encodedTransaction,
            DELIVERY_CONFIRMED_EVENT_SIGNATURE,
            carrierContract,
            64,
            false
        );
        (bytes32 termsCommitment, bytes32 receiptPolicyHash) = abi.decode(log.data, (bytes32, bytes32));
        _releaseMatchedEscrow(log, termsCommitment, receiptPolicyHash, 0, false, queryId);
    }

    function _requireSingleLog(
        bytes memory encodedTransaction,
        bytes32 eventSignature,
        address trustedEmitter,
        uint256 expectedDataLength,
        bool acceptance
    ) internal pure returns (EvmV1Decoder.LogEntry memory log) {
        EvmV1Decoder.ReceiptFields memory receipt = EvmV1Decoder.decodeReceiptFields(encodedTransaction);
        if (receipt.receiptStatus != 1) revert SourceTransactionFailed();
        EvmV1Decoder.LogEntry[] memory logs = EvmV1Decoder.getLogsByEventSignature(receipt, eventSignature);
        if (logs.length != 1) {
            if (acceptance) revert MissingAcceptanceEvent();
            revert MissingDeliveryEvent();
        }
        log = logs[0];
        if (log.address_ != trustedEmitter) revert UntrustedSourceEmitter(log.address_);
        if (log.topics.length != 4 || log.data.length != expectedDataLength) {
            if (acceptance) revert InvalidAcceptanceEvent();
            revert InvalidDeliveryEvent();
        }
    }

    function _releaseMatchedEscrow(
        EvmV1Decoder.LogEntry memory log,
        bytes32 termsCommitment,
        bytes32 receiptPolicyHash,
        uint64 acceptanceExpiresAt,
        bool requireAcceptanceDeadline,
        bytes32 queryId
    ) internal {
        bytes32 orderId = log.topics[1];
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded(orderId);
        if (
            receiptPolicyHash != policyHash ||
            escrow.buyer != address(uint160(uint256(log.topics[2]))) ||
            escrow.seller != address(uint160(uint256(log.topics[3]))) ||
            escrow.termsCommitment != termsCommitment ||
            (requireAcceptanceDeadline && escrow.acceptanceExpiresAt != acceptanceExpiresAt)
        ) revert PolicyMismatch();

        escrow.status = EscrowStatus.Released;
        (bool sent,) = escrow.seller.call{value: escrow.amount}("");
        if (!sent) revert NativeTransferFailed();
        emit EscrowReleasedV2(orderId, queryId, escrow.seller, escrow.amount, policyHash);
    }

    function _requireSilenceElapsed(Escrow storage escrow) internal view {
        if (block.timestamp < escrow.acceptanceExpiresAt) revert AcceptanceWindowOpen(escrow.acceptanceExpiresAt);
        uint64 attestedHeight = _requireAttestedHeight();
        if (attestedHeight < escrow.silenceAfterSourceHeight) {
            revert AttestedClockNotElapsed(attestedHeight, escrow.silenceAfterSourceHeight);
        }
    }

    function _attestedHeightOrZero() internal view returns (uint64) {
        IChainInfo.HeightHashResult memory latest = chainInfo.get_latest_attestation_height_and_hash(sourceChainKey);
        return latest.exists ? latest.height : 0;
    }

    function _requireAttestedHeight() internal view returns (uint64) {
        IChainInfo.HeightHashResult memory latest = chainInfo.get_latest_attestation_height_and_hash(sourceChainKey);
        if (!latest.exists) revert SourceAttestationUnavailable();
        return latest.height;
    }

    function _refundBuyer(bytes32 orderId, Escrow storage escrow, address caller, uint64 attestedHeight, bool silence) internal {
        escrow.status = EscrowStatus.Refunded;
        (bool sent,) = payable(escrow.buyer).call{value: escrow.amount}("");
        if (!sent) revert NativeTransferFailed();
        emit EscrowRefundedV2(orderId, escrow.buyer, escrow.amount);
        if (silence) emit SilenceTimeoutRefunded(orderId, escrow.buyer, escrow.amount, attestedHeight, caller);
    }

    function _computeQueryId(uint64 chainKey, uint64 blockHeight, INativeQueryVerifier.MerkleProof memory merkleProof) internal view returns (bytes32 queryId) {
        uint256 transactionIndex = verifier.calculateTxIndex(merkleProof);
        queryId = keccak256(abi.encodePacked(bytes32(uint256(chainKey)), bytes8(blockHeight), bytes32(transactionIndex)));
    }
}
