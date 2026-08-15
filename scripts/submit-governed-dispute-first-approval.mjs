import { Contract, JsonRpcProvider, Wallet, keccak256, toUtf8Bytes } from "ethers";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rpc = "https://rpc.cc3-testnet.creditcoin.network";
const governedEscrow = "0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7";
const governanceAddress = "0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849";
const funding = JSON.parse(readFileSync("/home/ubuntu/verisettle/contracts/test-runs/governed-dispute-funding.json", "utf8"));
const deployerConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-testnet-wallet.json", "utf8"));
const buyerConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-buyer-testnet-wallet.json", "utf8"));
const provider = new JsonRpcProvider(rpc);
const deployer = new Wallet(deployerConfig.privateKey, provider);
const buyer = new Wallet(buyerConfig.privateKey, provider);
const escrowAbi = [
  "function raiseDispute(bytes32 orderId, bytes32 evidenceHash)",
  "function escrows(bytes32) view returns (address buyer, address seller, bytes32 termsCommitment, uint128 amount, uint64 acceptanceExpiresAt, uint64 refundAfter, uint8 status)",
  "event EscrowDisputedV2(bytes32 indexed orderId, address indexed raisedBy, bytes32 evidenceHash)",
];
const governanceAbi = [
  "function nextNonce() view returns (uint256)",
  "function disputeResolutionActionHash(address escrow, bytes32 orderId, bool releaseToSeller, uint256 nonce) view returns (bytes32)",
  "function approveDisputeResolution(address escrow, bytes32 orderId, bool releaseToSeller, uint256 nonce)",
  "function approvalCount(bytes32 actionHash) view returns (uint256)",
  "function approvedBy(bytes32 actionHash, address signer) view returns (bool)",
  "function executed(bytes32 actionHash) view returns (bool)",
];
const escrowAsBuyer = new Contract(governedEscrow, escrowAbi, buyer);
const governanceAsDeployer = new Contract(governanceAddress, governanceAbi, deployer);
const evidenceHash = keccak256(toUtf8Bytes("Two-signer governed dispute test"));
const disputeTx = await escrowAsBuyer.raiseDispute(funding.orderKey, evidenceHash);
const disputeReceipt = await disputeTx.wait();
if (!disputeReceipt || disputeReceipt.status !== 1) throw new Error("Governed dispute transaction did not succeed.");
const nonce = await governanceAsDeployer.nextNonce();
const actionHash = await governanceAsDeployer.disputeResolutionActionHash(governedEscrow, funding.orderKey, false, nonce);
const approvalTx = await governanceAsDeployer.approveDisputeResolution(governedEscrow, funding.orderKey, false, nonce);
const approvalReceipt = await approvalTx.wait();
if (!approvalReceipt || approvalReceipt.status !== 1) throw new Error("First governed approval transaction did not succeed.");
const [escrowState, approvalCount, deployerApproved, buyerApproved, executed, nonceAfter] = await Promise.all([
  escrowAsBuyer.escrows(funding.orderKey),
  governanceAsDeployer.approvalCount(actionHash),
  governanceAsDeployer.approvedBy(actionHash, deployer.address),
  governanceAsDeployer.approvedBy(actionHash, buyer.address),
  governanceAsDeployer.executed(actionHash),
  governanceAsDeployer.nextNonce(),
]);
if (Number(escrowState.status) !== 4 || Number(approvalCount) !== 1 || !deployerApproved || buyerApproved || executed || nonceAfter !== nonce) {
  throw new Error("The governed dispute did not end in the expected one-approval pending state.");
}
const result = {
  ...funding,
  evidenceHash,
  dispute: { transactionHash: disputeTx.hash, blockNumber: disputeReceipt.blockNumber, raisedBy: buyer.address },
  firstApproval: { transactionHash: approvalTx.hash, blockNumber: approvalReceipt.blockNumber, signer: deployer.address, actionHash, approvalCount: Number(approvalCount) },
  pendingState: { escrowStatus: "Disputed", executed, nextNonce: nonceAfter.toString(), buyerApproved },
  recordedAt: new Date().toISOString(),
};
const path = resolve("/home/ubuntu/verisettle/contracts/test-runs/governed-dispute-first-approval.json");
mkdirSync(resolve("/home/ubuntu/verisettle/contracts/test-runs"), { recursive: true });
writeFileSync(path, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
