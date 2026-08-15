import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { readFileSync } from "node:fs";

const rpc = "https://rpc.cc3-testnet.creditcoin.network";
const governedEscrow = "0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7";
const governanceAddress = "0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849";
const evidence = JSON.parse(readFileSync("/home/ubuntu/verisettle/contracts/test-runs/governed-dispute-first-approval.json", "utf8"));
const buyerConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-buyer-testnet-wallet.json", "utf8"));
const provider = new JsonRpcProvider(rpc);
const buyer = new Wallet(buyerConfig.privateKey, provider);
const governance = new Contract(governanceAddress, [
  "function nextNonce() view returns (uint256)",
  "function approvalCount(bytes32 actionHash) view returns (uint256)",
  "function approvedBy(bytes32 actionHash, address signer) view returns (bool)",
  "function executed(bytes32 actionHash) view returns (bool)",
  "function approveDisputeResolution(address escrow, bytes32 orderId, bool releaseToSeller, uint256 nonce)",
], provider);
const [nonce, approvalCount, buyerApproved, executed, feeData] = await Promise.all([
  governance.nextNonce(),
  governance.approvalCount(evidence.firstApproval.actionHash),
  governance.approvedBy(evidence.firstApproval.actionHash, buyer.address),
  governance.executed(evidence.firstApproval.actionHash),
  provider.getFeeData(),
]);
if (nonce !== 0n || Number(approvalCount) !== 1 || buyerApproved || executed) throw new Error("The expected one-approval governed dispute state is no longer present; refusing to estimate final execution.");
const data = governance.interface.encodeFunctionData("approveDisputeResolution", [governedEscrow, evidence.orderKey, false, nonce]);
const gas = await provider.estimateGas({ from: buyer.address, to: governanceAddress, data });
const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;
if (!gasPrice) throw new Error("CC3 did not return a usable gas price.");
console.log(JSON.stringify({
  mode: "READ_ONLY_PREFLIGHT_NO_SIGNATURE_OR_TRANSACTION",
  orderId: evidence.orderId,
  actionHash: evidence.firstApproval.actionHash,
  signer: buyer.address,
  target: governanceAddress,
  effect: "Second approval reaches the 2-of-3 threshold and atomically refunds 0.001 tCTC to the buyer from the governed escrow.",
  estimatedGas: gas.toString(),
  estimatedTctcWei: (gas * gasPrice).toString(),
}, null, 2));
