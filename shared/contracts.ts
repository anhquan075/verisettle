import { getAddress, keccak256, parseUnits, solidityPackedKeccak256, toUtf8Bytes } from "ethers";

export const TESTNET_NETWORKS = {
  sepolia: {
    chainId: 11155111,
    chainIdHex: "0xaa36a7",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    explorerUrl: "https://sepolia.etherscan.io",
  },
  creditcoin: {
    chainId: 102031,
    chainIdHex: "0x18e8f",
    rpcUrl: "https://rpc.cc3-testnet.creditcoin.network",
    explorerUrl: "https://creditcoin-testnet.blockscout.com",
  },
} as const;

export const VERISETTLE_CONTRACTS = {
  source: "0x1aC5b6B47EFe751681A206Fa8A5C305250017425",
  escrowAsc: "0xe3565A1A1B947f363ab433889522267cE3D4736F",
  sourceChainKey: 1,
  blockProverPrecompile: "0x0000000000000000000000000000000000000FD2",
} as const;

export const sourceAbi = [
  "function acceptOrder(bytes32 orderId, address seller, bytes32 termsHash)",
  "event OrderAccepted(bytes32 indexed orderId, address indexed buyer, address indexed seller, bytes32 termsHash)",
] as const;

export const escrowAbi = [
  "function fundEscrow(bytes32 orderId, address seller, bytes32 termsHash, uint64 refundAfter) payable",
  "function submitAcceptanceProof(uint64 chainKey, uint64 blockHeight, bytes encodedTransaction, bytes32 merkleRoot, tuple(bytes32 hash, bool isLeft)[] siblings, bytes32 lowerEndpointDigest, bytes32[] continuityRoots) returns (bytes32)",
  "function refundExpiredEscrow(bytes32 orderId)",
  "function raiseDispute(bytes32 orderId, bytes32 evidenceHash)",
  "function escrows(bytes32 orderId) view returns (address buyer, address seller, bytes32 termsHash, uint128 amount, uint64 refundAfter, uint8 status)",
  "event EscrowFunded(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount, bytes32 termsHash, uint64 refundAfter)",
  "event EscrowReleased(bytes32 indexed orderId, bytes32 indexed queryId, address indexed seller, uint256 amount)",
  "event EscrowRefunded(bytes32 indexed orderId, address indexed buyer, uint256 amount)",
  "event EscrowDisputed(bytes32 indexed orderId, address indexed raisedBy, bytes32 evidenceHash)",
  "error QueryAlreadyProcessed(bytes32 queryId)",
] as const;

export function toOrderKey(orderId: string) {
  return keccak256(toUtf8Bytes(orderId));
}

export function toTermsHash(input: {
  orderId: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: string;
  currency: string;
  description: string;
}) {
  const amountUnits = parseUnits(input.amount, 18);
  const descriptionHash = keccak256(toUtf8Bytes(input.description.trim()));
  return solidityPackedKeccak256(
    ["bytes32", "address", "address", "uint256", "bytes32", "bytes32"],
    [
      toOrderKey(input.orderId),
      getAddress(input.buyerAddress),
      getAddress(input.sellerAddress),
      amountUnits,
      keccak256(toUtf8Bytes(input.currency.toUpperCase())),
      descriptionHash,
    ]
  );
}
