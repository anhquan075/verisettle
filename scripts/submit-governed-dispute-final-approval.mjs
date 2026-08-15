import { Contract, JsonRpcProvider, Wallet, formatEther } from "ethers";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rpc = "https://rpc.cc3-testnet.creditcoin.network";
const governedEscrow = "0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7";
const governanceAddress = "0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849";
const pending = JSON.parse(readFileSync("/home/ubuntu/verisettle/contracts/test-runs/governed-dispute-first-approval.json", "utf8"));
const buyerConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-buyer-testnet-wallet.json", "utf8"));
const provider = new JsonRpcProvider(rpc);
const buyer = new Wallet(buyerConfig.privateKey, provider);
const governance = new Contract(governanceAddress, [
  "function nextNonce() view returns (uint256)",
  "function approveDisputeResolution(address escrow, bytes32 orderId, bool releaseToSeller, uint256 nonce)",
  "function approvalCount(bytes32 actionHash) view returns (uint256)",
  "function approvedBy(bytes32 actionHash, address signer) view returns (bool)",
  "function executed(bytes32 actionHash) view returns (bool)",
], buyer);
const escrow = new Contract(governedEscrow, [
  "function escrows(bytes32) view returns (address buyer, address seller, bytes32 termsCommitment, uint128 amount, uint64 acceptanceExpiresAt, uint64 refundAfter, uint8 status)",
  "event DisputeResolvedV2(bytes32 indexed orderId, bool releasedToSeller, uint256 amount, address indexed governance)",
], provider);
const [nonce, approvalCountBefore, buyerBalanceBefore] = await Promise.all([
  governance.nextNonce(),
  governance.approvalCount(pending.firstApproval.actionHash),
  provider.getBalance(buyer.address),
]);
if (nonce !== 0n || Number(approvalCountBefore) !== 1) throw new Error("The expected pending 1-of-2 approval state is unavailable; refusing to submit final approval.");
const transaction = await governance.approveDisputeResolution(governedEscrow, pending.orderKey, false, nonce);
const receipt = await transaction.wait();
if (!receipt || receipt.status !== 1) throw new Error("Final governed approval transaction did not succeed.");
const [escrowState, approvalCountAfter, buyerApproved, executed, nonceAfter, buyerBalanceAfter] = await Promise.all([
  escrow.escrows(pending.orderKey),
  governance.approvalCount(pending.firstApproval.actionHash),
  governance.approvedBy(pending.firstApproval.actionHash, buyer.address),
  governance.executed(pending.firstApproval.actionHash),
  governance.nextNonce(),
  provider.getBalance(buyer.address),
]);
const event = receipt.logs.map(log => { try { return escrow.interface.parseLog(log); } catch { return null; } }).find(log => log?.name === "DisputeResolvedV2");
if (Number(escrowState.status) !== 3 || Number(approvalCountAfter) !== 2 || !buyerApproved || !executed || nonceAfter !== 1n || !event || event.args.orderId !== pending.orderKey || event.args.releasedToSeller !== false || event.args.amount.toString() !== "1000000000000000" || event.args.governance.toLowerCase() !== governanceAddress.toLowerCase()) {
  throw new Error("Final transaction did not produce the expected 2-of-3 governed refund state.");
}
const result = {
  ...pending,
  finalApproval: { transactionHash: transaction.hash, blockNumber: receipt.blockNumber, signer: buyer.address, approvalCount: Number(approvalCountAfter) },
  resolution: { escrowStatus: "Refunded", releasedToSeller: false, amountTctc: "0.001", actionExecuted: executed, nonceAfter: nonceAfter.toString(), governance: governanceAddress },
  balances: { buyerBeforeTctc: formatEther(buyerBalanceBefore), buyerAfterTctc: formatEther(buyerBalanceAfter) },
  recordedAt: new Date().toISOString(),
};
const path = resolve("/home/ubuntu/verisettle/contracts/test-runs/governed-dispute-resolution.json");
mkdirSync(resolve("/home/ubuntu/verisettle/contracts/test-runs"), { recursive: true });
writeFileSync(path, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
