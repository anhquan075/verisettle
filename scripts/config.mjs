export const TESTNET_NETWORKS = {
  sepolia: {
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    explorerUrl: "https://sepolia.etherscan.io",
  },
  creditcoin: {
    chainId: 102031,
    rpcUrl: "https://rpc.cc3-testnet.creditcoin.network",
    explorerUrl: "https://creditcoin-testnet.blockscout.com",
  },
};

export const VERISETTLE_CONTRACTS = {
  source: "0x1aC5b6B47EFe751681A206Fa8A5C305250017425",
  escrowAsc: "0xe3565A1A1B947f363ab433889522267cE3D4736F",
  sourceChainKey: 1,
  blockProverPrecompile: "0x0000000000000000000000000000000000000FD2",
  chainInfoPrecompile: "0x0000000000000000000000000000000000000FD3",
};

export const V2_POLICY = {
  policyHash: "0xf951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f28976",
  source: "0x56e6d3E213141AA8285D0b12504bDa5dA260aa18",
  escrowAsc: "0x185c81ED5a757d1e290BaBa55F051f3cE791D641",
};

export const ATTESTCOIN_PROVER_URL = "https://prover.cc3-testnet.creditcoin.network/";
export const CHAIN_INFO_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000FD3";

export const sourceAbi = [
  "function acceptOrder(bytes32 orderId, address seller, bytes32 termsHash)",
  "event OrderAccepted(bytes32 indexed orderId, address indexed buyer, address indexed seller, bytes32 termsHash)",
];

export const escrowAbi = [
  "function fundEscrow(bytes32 orderId, address seller, bytes32 termsHash, uint64 refundAfter) payable",
  "function submitAcceptanceProof(uint64 chainKey, uint64 blockHeight, bytes encodedTransaction, bytes32 merkleRoot, tuple(bytes32 hash, bool isLeft)[] siblings, bytes32 lowerEndpointDigest, bytes32[] continuityRoots) returns (bytes32)",
  "function escrows(bytes32 orderId) view returns (address buyer, address seller, bytes32 termsHash, uint128 amount, uint64 refundAfter, uint8 status)",
  "event EscrowReleased(bytes32 indexed orderId, bytes32 indexed queryId, address indexed seller, uint256 amount)",
];

export const v2SourceAbi = [
  "function acceptOrder(bytes32 orderId, address seller, bytes32 termsCommitment, uint64 acceptanceExpiresAt)",
  "event OrderAcceptedV2(bytes32 indexed orderId, address indexed buyer, address indexed seller, bytes32 termsCommitment, bytes32 policyHash, uint64 acceptanceExpiresAt)",
];

export const v2EscrowAbi = [
  "function fundEscrow(bytes32 orderId, address seller, bytes32 termsCommitment, uint64 acceptanceExpiresAt) payable",
  "function submitAcceptanceProof(uint64 chainKey, uint64 blockHeight, bytes encodedTransaction, bytes32 merkleRoot, tuple(bytes32 hash, bool isLeft)[] siblings, bytes32 lowerEndpointDigest, bytes32[] continuityRoots) returns (bytes32)",
  "function escrows(bytes32 orderId) view returns (address buyer, address seller, bytes32 termsCommitment, uint128 amount, uint64 acceptanceExpiresAt, uint64 refundAfter, uint8 status)",
  "event EscrowFundedV2(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount, bytes32 termsCommitment, bytes32 policyHash, uint64 acceptanceExpiresAt, uint64 refundAfter)",
  "event EscrowReleasedV2(bytes32 indexed orderId, bytes32 indexed queryId, address indexed seller, uint256 amount, bytes32 policyHash)",
];
