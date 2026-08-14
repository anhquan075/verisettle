import { JsonRpcProvider, Wallet, formatEther, parseEther } from "ethers";
import { readFileSync, writeFileSync } from "node:fs";

const BUYER_ADDRESS = "0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620";
const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const CC3_RPC = "https://rpc.cc3-testnet.creditcoin.network";
const source = JSON.parse(readFileSync("/home/ubuntu/.verisettle-testnet-wallet.json", "utf8"));

if (process.env.CONFIRM_TESTNET_FUNDING !== "yes") {
  throw new Error("Set CONFIRM_TESTNET_FUNDING=yes after explicit user approval before sending testnet funds.");
}

const sepoliaProvider = new JsonRpcProvider(SEPOLIA_RPC);
const cc3Provider = new JsonRpcProvider(CC3_RPC);
const sepoliaWallet = new Wallet(source.privateKey, sepoliaProvider);
const cc3Wallet = new Wallet(source.privateKey, cc3Provider);

const [sepoliaBalance, cc3Balance] = await Promise.all([
  sepoliaProvider.getBalance(sepoliaWallet.address),
  cc3Provider.getBalance(cc3Wallet.address),
]);

if (sepoliaBalance < parseEther("0.01")) throw new Error("Deployment wallet lacks the requested 0.01 Sepolia ETH before gas.");
if (cc3Balance < parseEther("1")) throw new Error("Deployment wallet lacks the requested 1.00 CC3 tCTC before gas.");

const sepoliaTx = await sepoliaWallet.sendTransaction({ to: BUYER_ADDRESS, value: parseEther("0.01") });
const sepoliaReceipt = await sepoliaTx.wait();
if (!sepoliaReceipt || sepoliaReceipt.status !== 1) throw new Error("Sepolia buyer-funding transaction was not successful.");

const cc3Tx = await cc3Wallet.sendTransaction({ to: BUYER_ADDRESS, value: parseEther("1") });
const cc3Receipt = await cc3Tx.wait();
if (!cc3Receipt || cc3Receipt.status !== 1) throw new Error("CC3 buyer-funding transaction was not successful.");

const evidence = {
  type: "buyer-testnet-wallet-funding",
  recipient: BUYER_ADDRESS,
  sender: sepoliaWallet.address,
  sepolia: { amountEth: "0.01", txHash: sepoliaTx.hash, blockNumber: sepoliaReceipt.blockNumber },
  creditcoinCc3: { amountTctc: "1.00", txHash: cc3Tx.hash, blockNumber: cc3Receipt.blockNumber },
  senderBalanceBefore: { sepoliaEth: formatEther(sepoliaBalance), cc3Tctc: formatEther(cc3Balance) },
  createdAt: new Date().toISOString(),
  warning: "Public testnet evidence only. No private-key material is stored here.",
};

writeFileSync("/home/ubuntu/verisettle/contracts/test-runs/buyer-wallet-funding.json", `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
