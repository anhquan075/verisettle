import { JsonRpcProvider, Wallet, formatEther, parseEther } from "ethers";
import { readFileSync, writeFileSync } from "node:fs";

const SELLER_ADDRESS = "0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA";
const CC3_RPC = "https://rpc.cc3-testnet.creditcoin.network";
const source = JSON.parse(readFileSync("/home/ubuntu/.verisettle-testnet-wallet.json", "utf8"));

if (process.env.CONFIRM_SELLER_TEST_TRANSFER !== "yes") {
  throw new Error("Set CONFIRM_SELLER_TEST_TRANSFER=yes after explicit user approval before sending testnet funds.");
}

const provider = new JsonRpcProvider(CC3_RPC);
const sender = new Wallet(source.privateKey, provider);
const balanceBefore = await provider.getBalance(SELLER_ADDRESS);
const tx = await sender.sendTransaction({ to: SELLER_ADDRESS, value: parseEther("0.001") });
const receipt = await tx.wait();
if (!receipt || receipt.status !== 1) throw new Error("Seller recipient-readiness transfer was not successful.");
const balanceAfter = await provider.getBalance(SELLER_ADDRESS);

const evidence = {
  type: "seller-recipient-readiness",
  network: "Creditcoin CC3 Testnet",
  sender: sender.address,
  recipient: SELLER_ADDRESS,
  amountTctc: "0.001",
  txHash: tx.hash,
  blockNumber: receipt.blockNumber,
  sellerBalanceBeforeTctc: formatEther(balanceBefore),
  sellerBalanceAfterTctc: formatEther(balanceAfter),
  createdAt: new Date().toISOString(),
  warning: "Public testnet evidence only. No private-key material is stored here.",
};

writeFileSync("/home/ubuntu/verisettle/contracts/test-runs/seller-recipient-readiness.json", `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
