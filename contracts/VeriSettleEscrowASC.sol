// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EvmV1Decoder} from "@gluwa/usc-contracts/contracts/decoding/EvmV1Decoder.sol";
import {INativeQueryVerifier, NativeQueryVerifierLib} from "./VerifierInterface.sol";

/**
 * @title VeriSettleEscrowASC
 * @notice Native-tCTC escrow released only by an Attestcoin-verified Sepolia OrderAccepted event.
 * @dev Contract scope: testnet demonstration. It contains no mock proof outcome or synthetic
 * transaction generation. The BlockProver precompile is the sole proof verifier.
 */
contract VeriSettleEscrowASC is Ownable, ReentrancyGuard {
    enum EscrowStatus {
        None,
        Funded,
        Released,
        Refunded,
        Disputed
    }

    struct Escrow {
        address buyer;
        address payable seller;
        bytes32 termsHash;
        uint128 amount;
        uint64 refundAfter;
        EscrowStatus status;
    }

    bytes32 public constant ORDER_ACCEPTED_EVENT_SIGNATURE =
        keccak256("OrderAccepted(bytes32,address,address,bytes32)");

    uint64 public immutable sourceChainKey;
    address public immutable sourceContract;
    INativeQueryVerifier public immutable verifier;

    mapping(bytes32 => Escrow) public escrows;
    mapping(bytes32 => bool) public processedQueries;

    event EscrowFunded(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        bytes32 termsHash,
        uint64 refundAfter
    );
    event EscrowReleased(bytes32 indexed orderId, bytes32 indexed queryId, address indexed seller, uint256 amount);
    event EscrowRefunded(bytes32 indexed orderId, address indexed buyer, uint256 amount);
    event EscrowDisputed(bytes32 indexed orderId, address indexed raisedBy, bytes32 evidenceHash);
    event DisputeResolved(bytes32 indexed orderId, bool releasedToSeller, uint256 amount);

    error InvalidSourceContract();
    error InvalidSeller();
    error InvalidEscrowAmount();
    error InvalidRefundDeadline();
    error EscrowAlreadyExists(bytes32 orderId);
    error EscrowNotFunded(bytes32 orderId);
    error Unauthorized();
    error RefundNotAvailable(uint64 refundAfter);
    error QueryAlreadyProcessed(bytes32 queryId);
    error InvalidSourceChain(uint64 suppliedChainKey);
    error ProofVerificationFailed();
    error TransactionFailed();
    error SourceTransactionFailed();
    error MissingAcceptanceEvent();
    error UntrustedSourceEmitter(address emitter);
    error InvalidAcceptanceEvent();
    error PolicyMismatch();
    error NativeTransferFailed();

    constructor(address sourceContract_, uint64 sourceChainKey_) Ownable(msg.sender) {
        if (sourceContract_ == address(0)) revert InvalidSourceContract();
        sourceContract = sourceContract_;
        sourceChainKey = sourceChainKey_;
        verifier = NativeQueryVerifierLib.getVerifier();
    }

    function fundEscrow(
        bytes32 orderId,
        address payable seller,
        bytes32 termsHash,
        uint64 refundAfter
    ) external payable {
        if (seller == address(0)) revert InvalidSeller();
        if (msg.value == 0 || msg.value > type(uint128).max) revert InvalidEscrowAmount();
        if (refundAfter <= block.timestamp) revert InvalidRefundDeadline();
        if (escrows[orderId].status != EscrowStatus.None) revert EscrowAlreadyExists(orderId);

        escrows[orderId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            termsHash: termsHash,
            amount: uint128(msg.value),
            refundAfter: refundAfter,
            status: EscrowStatus.Funded
        });

        emit EscrowFunded(orderId, msg.sender, seller, msg.value, termsHash, refundAfter);
    }

    /**
     * @notice Verifies an Attestcoin proof and releases the matching funded escrow.
     * @dev The proof query is marked as processed before business logic executes to prevent
     * reentrant proof reuse; any revert atomically rolls the mark back.
     */
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

        INativeQueryVerifier.MerkleProof memory merkleProof =
            INativeQueryVerifier.MerkleProof({root: merkleRoot, siblings: siblings});
        queryId = _computeQueryId(chainKey, blockHeight, merkleProof);
        if (processedQueries[queryId]) revert QueryAlreadyProcessed(queryId);

        INativeQueryVerifier.ContinuityProof memory continuityProof =
            INativeQueryVerifier.ContinuityProof({lowerEndpointDigest: lowerEndpointDigest, roots: continuityRoots});
        if (!verifier.verifyAndEmit(chainKey, blockHeight, encodedTransaction, merkleProof, continuityProof)) {
            revert ProofVerificationFailed();
        }

        processedQueries[queryId] = true;
        _releaseFromAcceptanceReceipt(encodedTransaction, queryId);
    }

    function refundExpiredEscrow(bytes32 orderId) external nonReentrant {
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded(orderId);
        if (msg.sender != escrow.buyer) revert Unauthorized();
        if (block.timestamp < escrow.refundAfter) revert RefundNotAvailable(escrow.refundAfter);

        escrow.status = EscrowStatus.Refunded;
        uint256 amount = escrow.amount;
        (bool sent,) = payable(escrow.buyer).call{value: amount}("");
        if (!sent) revert NativeTransferFailed();
        emit EscrowRefunded(orderId, escrow.buyer, amount);
    }

    function raiseDispute(bytes32 orderId, bytes32 evidenceHash) external {
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded(orderId);
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) revert Unauthorized();

        escrow.status = EscrowStatus.Disputed;
        emit EscrowDisputed(orderId, msg.sender, evidenceHash);
    }

    /**
     * @notice Testnet dispute resolution. The owner is the explicitly disclosed arbitrator.
     * Production deployments should replace this with a documented multisig or arbitration policy.
     */
    function resolveDispute(bytes32 orderId, bool releaseToSeller) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Disputed) revert EscrowNotFunded(orderId);

        uint256 amount = escrow.amount;
        escrow.status = releaseToSeller ? EscrowStatus.Released : EscrowStatus.Refunded;
        address payable recipient = releaseToSeller ? escrow.seller : payable(escrow.buyer);
        (bool sent,) = recipient.call{value: amount}("");
        if (!sent) revert NativeTransferFailed();
        emit DisputeResolved(orderId, releaseToSeller, amount);
    }

    function _releaseFromAcceptanceReceipt(bytes memory encodedTransaction, bytes32 queryId) internal {
        EvmV1Decoder.ReceiptFields memory receipt = EvmV1Decoder.decodeReceiptFields(encodedTransaction);
        if (receipt.receiptStatus != 1) revert SourceTransactionFailed();

        EvmV1Decoder.LogEntry[] memory logs =
            EvmV1Decoder.getLogsByEventSignature(receipt, ORDER_ACCEPTED_EVENT_SIGNATURE);
        if (logs.length != 1) revert MissingAcceptanceEvent();

        EvmV1Decoder.LogEntry memory log = logs[0];
        if (log.address_ != sourceContract) revert UntrustedSourceEmitter(log.address_);
        if (log.topics.length != 4 || log.data.length != 32) revert InvalidAcceptanceEvent();

        bytes32 orderId = log.topics[1];
        address buyer = address(uint160(uint256(log.topics[2])));
        address seller = address(uint160(uint256(log.topics[3])));
        bytes32 termsHash = abi.decode(log.data, (bytes32));

        Escrow storage escrow = escrows[orderId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded(orderId);
        if (escrow.buyer != buyer || escrow.seller != seller || escrow.termsHash != termsHash) revert PolicyMismatch();

        escrow.status = EscrowStatus.Released;
        uint256 amount = escrow.amount;
        (bool sent,) = escrow.seller.call{value: amount}("");
        if (!sent) revert NativeTransferFailed();
        emit EscrowReleased(orderId, queryId, escrow.seller, amount);
    }

    function _computeQueryId(
        uint64 chainKey,
        uint64 blockHeight,
        INativeQueryVerifier.MerkleProof memory merkleProof
    ) internal view returns (bytes32 queryId) {
        uint256 transactionIndex = verifier.calculateTxIndex(merkleProof);
        queryId = keccak256(
            abi.encodePacked(bytes32(uint256(chainKey)), bytes8(blockHeight), bytes32(transactionIndex))
        );
    }
}
