import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { readFileSync, writeFileSync } from "node:fs";
import { dealsRouter } from "../server/routers/deals.ts";
import { sourceAbi, toOrderKey, toTermsHash, VERISETTLE_CONTRACTS } from "../shared/contracts.ts";

const ORDER_ID = "2w8_iT1aNogY1b";
const terms = {
  orderId: ORDER_ID,
  buyerAddress: "0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620",
  sellerAddress: "0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA",
  amount: "0.01",
  currency: "tCTC",
  description: "hihi alo alo",
};

if (process.env.CONFIRM_SANDBOX_ACCEPTANCE !== "yes") {
  throw new Error("Set CONFIRM_SANDBOX_ACCEPTANCE=yes after explicit user authorization.");
}

const buyer = JSON.parse(readFileSync("/home/ubuntu/.verisettle-buyer-testnet-wallet.json", "utf8"));
const provider = new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
const signer = new Wallet(buyer.privateKey, provider);
if (signer.address.toLowerCase() !== terms.buyerAddress.toLowerCase()) throw new Error("Buyer key does not match the persisted deal buyer.");

const source = new Contract(VERISETTLE_CONTRACTS.source, sourceAbi, signer);
const transaction = await source.acceptOrder(toOrderKey(terms.orderId), terms.sellerAddress, toTermsHash(terms));
const receipt = await transaction.wait();
if (!receipt || receipt.status !== 1) throw new Error("Sepolia buyer-acceptance transaction did not succeed.");

const caller = dealsRouter.createCaller({
  user: {
    id: 1,
    openId: "mHUE76sXnwYxsmawwUxL7m",
    name: "Anh Quân (Anh Quân)",
    email: "nguyenlequan02@gmail.com",
    loginMethod: "google",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
});
const recorded = await caller.submitProof({ orderId: ORDER_ID, sepoliaSourceTxHash: transaction.hash });
const evidence = {
  type: "sandbox-buyer-source-acceptance",
  orderId: ORDER_ID,
  buyer: signer.address,
  seller: terms.sellerAddress,
  sourceEmitter: VERISETTLE_CONTRACTS.source,
  termsHash: toTermsHash(terms),
  txHash: transaction.hash,
  blockNumber: receipt.blockNumber,
  recordedStatus: recorded.deal.status,
  createdAt: new Date().toISOString(),
  warning: "Sandbox-only testnet signer. No private-key material is stored here.",
};
writeFileSync("/home/ubuntu/verisettle/contracts/test-runs/user-draft-source-acceptance.json", `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
