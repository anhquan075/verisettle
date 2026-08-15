import { Contract, JsonRpcProvider, Wallet, keccak256, toUtf8Bytes } from "ethers";
import { readFileSync } from "node:fs";

const rpc = "https://rpc.cc3-testnet.creditcoin.network";
const governedEscrow = "0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7";
const governanceAddress = "0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849";
const evidence = JSON.parse(readFileSync("/home/ubuntu/verisettle/contracts/test-runs/governed-dispute-funding.json", "utf8"));
const deployerConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-testnet-wallet.json", "utf8"));
const buyerConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-buyer-testnet-wallet.json", "utf8"));
const provider = new JsonRpcProvider(rpc);
const deployer = new Wallet(deployerConfig.privateKey, provider);
const buyer = new Wallet(buyerConfig.privateKey, provider);
const escrow = new Contract(governedEscrow, [
  "function escrows(bytes32) view returns (address buyer, address seller, bytes32 termsCommitment, uint128 amount, uint64 acceptanceExpiresAt, uint64 refundAfter, uint8 status)",
  "function raiseDispute(bytes32 orderId, bytes32 evidenceHash)",
], provider);
const governance = new Contract(governanceAddress, [
  "function nextNonce() view returns (uint256)",
  "function approveDisputeResolution(address escrow, bytes32 orderId, bool releaseToSeller, uint256 nonce)",
], provider);
const [storedEscrow, nonce, feeData] = await Promise.all([escrow.escrows(evidence.orderKey), governance.nextNonce(), provider.getFeeData()]);
if (Number(storedEscrow.status) !== 1) throw new Error("The governed test escrow is not in Funded status; refusing to preflight a dispute.");
if (storedEscrow.buyer.toLowerCase() !== buyer.address.toLowerCase()) throw new Error("The configured buyer signer does not match the funded escrow.");
if (deployer.address.toLowerCase() === buyer.address.toLowerCase()) throw new Error("Distinct signer requirement failed.");
const disputeData = escrow.interface.encodeFunctionData("raiseDispute", [evidence.orderKey, keccak256(toUtf8Bytes("Two-signer governed dispute test"))]);
const approvalData = governance.interface.encodeFunctionData("approveDisputeResolution", [governedEscrow, evidence.orderKey, false, nonce]);
const [disputeGas, firstApprovalGas] = await Promise.all([
  provider.estimateGas({ from: buyer.address, to: governedEscrow, data: disputeData }),
  provider.estimateGas({ from: deployer.address, to: governanceAddress, data: approvalData }),
]);
const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;
if (!gasPrice) throw new Error("CC3 did not provide a usable gas price.");
console.log(JSON.stringify({
  mode: "READ_ONLY_PREFLIGHT_NO_SIGNATURE_OR_TRANSACTION",
  orderId: evidence.orderId,
  orderKey: evidence.orderKey,
  state: "Funded",
  outcome: "refund buyer",
  nonce: nonce.toString(),
  transactions: {
    buyerDispute: { signer: buyer.address, target: governedEscrow, estimatedGas: disputeGas.toString(), estimatedTctc: (disputeGas * gasPrice).toString() },
    firstApproval: { signer: deployer.address, target: governanceAddress, estimatedGas: firstApprovalGas.toString(), estimatedTctc: (firstApprovalGas * gasPrice).toString() },
  },
  note: "The second approval will be estimated after the first approval is mined because it atomically executes the configured refund outcome.",
}, null, 2));
