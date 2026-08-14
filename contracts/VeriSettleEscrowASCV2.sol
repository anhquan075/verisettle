// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EvmV1Decoder} from "@gluwa/usc-contracts/contracts/decoding/EvmV1Decoder.sol";
import {INativeQueryVerifier, NativeQueryVerifierLib} from "./VerifierInterface.sol";

/**
 * @title VeriSettleEscrowASCV2
 * @notice CC3 native-tCTC escrow whose release policy is immutably bound to a V2 source receipt policy.
 * @dev V2 is a separate deployment from V1; it never accepts V1 OrderAccepted receipts or V1 terms hashes.
 */
contract VeriSettleEscrowASCV2 is Ownable, ReentrancyGuard {
    enum EscrowStatus { None, Funded, Released, Refunded, Disputed }

    struct Escrow {
        address buyer;
        address payable seller;
        bytes32 termsCommitment;
        uint128 amount;
        uint64 acceptanceExpiresAt;
        uint64 refundAfter;
        EscrowStatus status;
    }

    bytes32 public constant ORDER_ACCEPTED_V2_EVENT_SIGNATURE =
        keccak256("OrderAcceptedV2(bytes32,address,address,bytes32,bytes32,uint64)");

    bytes32 public immutable policyHash;
    uint64 public immutable sourceChainKey;
    address public immutable sourceContract;
    uint64 public immutable acceptanceWindowSeconds;
    uint64 public immutable refundWindowSeconds;
    INativeQueryVerifier public immutable verifier;

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
        uint64 refundAfter
    );
    event EscrowReleasedV2(bytes32 indexed orderId, bytes32 indexed queryId, address indexed seller, uint256 amount, bytes32 policyHash);
    event EscrowRefundedV2(bytes32 indexed orderId, address indexed buyer, uint256 amount);
    event EscrowDisputedV2(bytes32 indexed orderId, address indexed raisedBy, bytes32 evidenceHash);
    event DisputeResolvedV2(bytes32 indexed orderId, bool releasedToSeller, uint256 amount);

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
    error RefundNotAvailable(uint64 refundAfter);
    error QueryAlreadyProcessed(bytes32 queryId);
    error InvalidSourceChain(uint64 suppliedChainKey);
    error ProofVerificationFailed();
    error SourceTransactionFailed();
    error MissingAcceptanceEvent();
    error UntrustedSourceEmitter(address emitter);
    error InvalidAcceptanceEvent();
    error PolicyMismatch();
    error NativeTransferFailed();

    constructor(
        address sourceContract_,
        uint64 sourceChainKey_,
        bytes32 policyHash_,
        uint64 acceptanceWindowSeconds_,
        uint64 refundWindowSeconds_
    ) Ownable(msg.sender) {
        if (sourceContract_ == address(0)) revert InvalidSourceContract();
        if (policyHash_ == bytes32(0)) revert InvalidPolicyHash();
        if (acceptanceWindowSeconds_ == 0 || refundWindowSeconds_ < acceptanceWindowSeconds_) revert InvalidPolicyWindow();
        sourceContract = sourceContract_;
        sourceChainKey = sourceChainKey_;
        policyHash = policyHash_;
        acceptanceWindowSeconds = acceptanceWindowSeconds_;
        refundWindowSeconds = refundWindowSeconds_;
        verifier = NativeQueryVerifierLib.getVerifier();
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
        escrows[orderId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            termsCommitment: termsCommitment,
            amount: uint128(msg.value),
            acceptanceExpiresAt: acceptanceExpiresAt,
            refundAfter: refundAfter,
            status: EscrowStatus.Funded
        });
        emit EscrowFundedV2(orderId, msg.sender, seller, msg.value, termsCommitment, policyHash, acceptanceExpiresAt, refundAfter);
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
        if (chainKey != sourceChainKey) revert InvalidSourceChain(chainKey);
        INativeQueryVerifier.MerkleProof memory merkleProof = INativeQueryVerifier.MerkleProof({root: merkleRoot, siblings: siblings});
        queryId = _computeQueryId(chainKey, blockHeight, merkleProof);
        if (processedQueries[queryId]) revert QueryAlreadyProcessed(queryId);

        INativeQueryVerifier.ContinuityProof memory continuityProof =
            INativeQueryVerifier.ContinuityProof({lowerEndpointDigest: lowerEndpointDigest, roots: continuityRoots});
        if (!verifier.verifyAndEmit(chainKey, blockHeight, encodedTransaction, merkleProof, continuityProof)) revert ProofVerificationFailed();

        processedQueries[queryId] = true;
        _releaseFromAcceptanceReceipt(encodedTransaction, queryId);
    }

    function refundExpiredEscrow(bytes32 orderId) external nonReentrant {
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded(orderId);
        if (msg.sender != escrow.buyer) revert Unauthorized();
        if (block.timestamp < escrow.refundAfter) revert RefundNotAvailable(escrow.refundAfter);
        escrow.status = EscrowStatus.Refunded;
        (bool sent,) = payable(escrow.buyer).call{value: escrow.amount}("");
        if (!sent) revert NativeTransferFailed();
        emit EscrowRefundedV2(orderId, escrow.buyer, escrow.amount);
    }

    function raiseDispute(bytes32 orderId, bytes32 evidenceHash) external {
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded(orderId);
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) revert Unauthorized();
        escrow.status = EscrowStatus.Disputed;
        emit EscrowDisputedV2(orderId, msg.sender, evidenceHash);
    }

    /// @dev Explicit testnet arbitrator boundary. Production must use the M3 multisig/timelock resolver.
    function resolveDispute(bytes32 orderId, bool releaseToSeller) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Disputed) revert EscrowNotFunded(orderId);
        escrow.status = releaseToSeller ? EscrowStatus.Released : EscrowStatus.Refunded;
        address payable recipient = releaseToSeller ? escrow.seller : payable(escrow.buyer);
        (bool sent,) = recipient.call{value: escrow.amount}("");
        if (!sent) revert NativeTransferFailed();
        emit DisputeResolvedV2(orderId, releaseToSeller, escrow.amount);
    }

    function _releaseFromAcceptanceReceipt(bytes memory encodedTransaction, bytes32 queryId) internal {
        EvmV1Decoder.ReceiptFields memory receipt = EvmV1Decoder.decodeReceiptFields(encodedTransaction);
        if (receipt.receiptStatus != 1) revert SourceTransactionFailed();
        EvmV1Decoder.LogEntry[] memory logs = EvmV1Decoder.getLogsByEventSignature(receipt, ORDER_ACCEPTED_V2_EVENT_SIGNATURE);
        if (logs.length != 1) revert MissingAcceptanceEvent();
        EvmV1Decoder.LogEntry memory log = logs[0];
        if (log.address_ != sourceContract) revert UntrustedSourceEmitter(log.address_);
        if (log.topics.length != 4 || log.data.length != 96) revert InvalidAcceptanceEvent();

        bytes32 orderId = log.topics[1];
        address buyer = address(uint160(uint256(log.topics[2])));
        address seller = address(uint160(uint256(log.topics[3])));
        (bytes32 termsCommitment, bytes32 receiptPolicyHash, uint64 acceptanceExpiresAt) = abi.decode(log.data, (bytes32, bytes32, uint64));

        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded(orderId);
        if (
            receiptPolicyHash != policyHash ||
            escrow.buyer != buyer ||
            escrow.seller != seller ||
            escrow.termsCommitment != termsCommitment ||
            escrow.acceptanceExpiresAt != acceptanceExpiresAt
        ) revert PolicyMismatch();

        escrow.status = EscrowStatus.Released;
        (bool sent,) = escrow.seller.call{value: escrow.amount}("");
        if (!sent) revert NativeTransferFailed();
        emit EscrowReleasedV2(orderId, queryId, escrow.seller, escrow.amount, policyHash);
    }

    function _computeQueryId(uint64 chainKey, uint64 blockHeight, INativeQueryVerifier.MerkleProof memory merkleProof) internal view returns (bytes32 queryId) {
        uint256 transactionIndex = verifier.calculateTxIndex(merkleProof);
        queryId = keccak256(abi.encodePacked(bytes32(uint256(chainKey)), bytes8(blockHeight), bytes32(transactionIndex)));
    }
}
