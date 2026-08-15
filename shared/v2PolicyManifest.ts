export const V2_POLICY_MANIFEST = {
  manifestVersion: 1,
  policyVersion: 2,
  policyHash: "0xf951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f28976",
  policy: {
    sourceChainKey: 1,
    termsSchemaVersion: 2,
    finalityMode: 1,
    minimumSourceConfirmations: 12,
    acceptanceWindowSeconds: 604800,
    refundWindowSeconds: 2592000,
    sourceContract: "0x56e6d3E213141AA8285D0b12504bDa5dA260aa18",
  },
  source: {
    address: "0x56e6d3E213141AA8285D0b12504bDa5dA260aa18",
    deploymentTxHash: "0xd1ae9f1e7918822806578e50ae8c3ec122def8dd5ba318e9ed4b85a835806817",
    runtimeCodeHash: "0x44ece7e3750d1475fc96b4eca7cef95aca02a77afdf70d8a83d2f9fa2f3205cb",
    orderAcceptedV2EventSignature: "0x1189a453ca96da1cce83000df1d7b5d83b274c6abcd7b79fce558a02e3aa6263",
  },
  decoderLibrary: {
    address: "0x1aC5b6B47EFe751681A206Fa8A5C305250017425",
    runtimeCodeHash: "0x110c20ed5c24a85a044c544cfbac4bcf30de3d5411787415247212cb3814d983",
  },
  escrowAsc: {
    address: "0x185c81ED5a757d1e290BaBa55F051f3cE791D641",
    deploymentTxHash: "0x158732dbab9aef09fbc12ae7999af78af11e3284e007c348ad99646191773f07",
    runtimeCodeHash: "0xdce0cdfda55ad89aed199ee74d5d9d6914936ed11c38bad0937d7e9609e88388",
    sourceChainKey: 1,
    blockProverPrecompile: "0x0000000000000000000000000000000000000FD2",
  },
} as const;

/**
 * A separately deployed V2-policy route which keeps the verified source policy
 * but binds Creditcoin dispute execution to the immutable 2-of-3 multisig.
 */
export const V2_GOVERNED_POLICY_MANIFEST = {
  ...V2_POLICY_MANIFEST,
  policyKind: "v2_governed",
  governance: {
    address: "0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849",
    deploymentTxHash: "0x5547fbd93d802522bc8c28509299c19c2a9b7ceaecfebea0973bd4593a7dddbe",
    runtimeCodeHash: "0x405b23101b7bba716651a5d2fe169127de32e88dc2949bc46cce6ae4857f7bd7",
    threshold: 2,
    signerCount: 3,
    signers: [
      "0xc7774720D1C14B9dA1c656b796a2a092D0b9D1c9",
      "0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620",
      "0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA",
    ],
  },
  escrowAsc: {
    address: "0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7",
    deploymentTxHash: "0xf7d9e76c14da6577e910cc5cc9d7e5902d57c71cdd03907ba67003ac55734c43",
    runtimeCodeHash: "0xa6941218e616580443904913bd4a901798b76acdaf0d6f9f8e25cece02c2bf74",
    sourceChainKey: 1,
    blockProverPrecompile: "0x0000000000000000000000000000000000000FD2",
  },
} as const;

export const v2SourceAbi = [
  "function policyHash() view returns (bytes32)",
  "function acceptanceWindowSeconds() view returns (uint64)",
  "function acceptOrder(bytes32 orderId, address seller, bytes32 termsCommitment, uint64 acceptanceExpiresAt)",
  "event OrderAcceptedV2(bytes32 indexed orderId, address indexed buyer, address indexed seller, bytes32 termsCommitment, bytes32 policyHash, uint64 acceptanceExpiresAt)",
] as const;

export const v2EscrowAbi = [
  "function policyHash() view returns (bytes32)",
  "function sourceContract() view returns (address)",
  "function sourceChainKey() view returns (uint64)",
  "function acceptanceWindowSeconds() view returns (uint64)",
  "function refundWindowSeconds() view returns (uint64)",
  "function disputeGovernance() view returns (address)",
  "function fundEscrow(bytes32 orderId, address seller, bytes32 termsCommitment, uint64 acceptanceExpiresAt) payable",
  "function submitAcceptanceProof(uint64 chainKey, uint64 blockHeight, bytes encodedTransaction, bytes32 merkleRoot, tuple(bytes32 hash, bool isLeft)[] siblings, bytes32 lowerEndpointDigest, bytes32[] continuityRoots) returns (bytes32)",
  "function refundExpiredEscrow(bytes32 orderId)",
  "function raiseDispute(bytes32 orderId, bytes32 evidenceHash)",
  "event EscrowFundedV2(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount, bytes32 termsCommitment, bytes32 policyHash, uint64 acceptanceExpiresAt, uint64 refundAfter)",
  "event EscrowReleasedV2(bytes32 indexed orderId, bytes32 indexed queryId, address indexed seller, uint256 amount, bytes32 policyHash)",
  "event EscrowRefundedV2(bytes32 indexed orderId, address indexed buyer, uint256 amount)",
  "event EscrowDisputedV2(bytes32 indexed orderId, address indexed raisedBy, bytes32 evidenceHash)",
] as const;

export const v2GovernanceAbi = [
  "function threshold() view returns (uint8)",
  "function signerCount() view returns (uint8)",
  "function isSigner(address) view returns (bool)",
  "function nextNonce() view returns (uint256)",
  "function disputeResolutionActionHash(address escrow, bytes32 orderId, bool releaseToSeller, uint256 nonce) view returns (bytes32)",
  "function approvalCount(bytes32 actionHash) view returns (uint256)",
  "function approvedBy(bytes32 actionHash, address signer) view returns (bool)",
  "function executed(bytes32 actionHash) view returns (bool)",
] as const;
