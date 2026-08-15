import { Contract, JsonRpcProvider, Wallet, formatEther, keccak256, parseUnits, toUtf8Bytes } from "ethers";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rpc = "https://rpc.cc3-testnet.creditcoin.network";
const governedEscrow = "0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7";
const orderId = "governed-dispute-1786777969007";
const amount = parseUnits("0.001", 18);
const acceptanceExpiresAt = 1786864369;
const buyerConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-buyer-testnet-wallet.json", "utf8"));
const provider = new JsonRpcProvider(rpc);
const buyer = new Wallet(buyerConfig.privateKey, provider);
const orderKey = keccak256(toUtf8Bytes(orderId));
const termsCommitment = keccak256(toUtf8Bytes(`VeriSettle governance test / ${orderId}`));
const escrow = new Contract(governedEscrow, [
  "function fundEscrow(bytes32 orderId, address seller, bytes32 termsCommitment, uint64 acceptanceExpiresAt) payable",
  "event EscrowFundedV2(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount, bytes32 termsCommitment, bytes32 policyHash, uint64 acceptanceExpiresAt, uint64 refundAfter)",
], buyer);

if (Math.floor(Date.now() / 1000) >= acceptanceExpiresAt) throw new Error("The preflighted acceptance window expired; create a new read-only preflight before spending testnet funds.");
const balanceBefore = await provider.getBalance(buyer.address);
const transaction = await escrow.fundEscrow(orderKey, buyer.address, termsCommitment, acceptanceExpiresAt, { value: amount });
const receipt = await transaction.wait();
if (!receipt || receipt.status !== 1) throw new Error("Governed test funding transaction did not succeed.");
const event = receipt.logs.map(log => { try { return escrow.interface.parseLog(log); } catch { return null; } }).find(log => log?.name === "EscrowFundedV2");
if (!event || event.args.orderId !== orderKey || event.args.buyer.toLowerCase() !== buyer.address.toLowerCase() || event.args.seller.toLowerCase() !== buyer.address.toLowerCase() || event.args.amount !== amount || event.args.termsCommitment !== termsCommitment) {
  throw new Error("The mined governed funding receipt did not match the approved order, buyer, seller, amount, or commitment.");
}
const balanceAfter = await provider.getBalance(buyer.address);
const evidence = {
  orderId,
  orderKey,
  governedEscrow,
  buyer: buyer.address,
  seller: buyer.address,
  amountTctc: formatEther(amount),
  termsCommitment,
  acceptanceExpiresAt,
  refundAfter: Number(event.args.refundAfter),
  transactionHash: transaction.hash,
  blockNumber: receipt.blockNumber,
  balanceBeforeTctc: formatEther(balanceBefore),
  balanceAfterTctc: formatEther(balanceAfter),
  recordedAt: new Date().toISOString(),
};
const path = resolve("/home/ubuntu/verisettle/contracts/test-runs/governed-dispute-funding.json");
mkdirSync(resolve("/home/ubuntu/verisettle/contracts/test-runs"), { recursive: true });
writeFileSync(path, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
