import { Contract, JsonRpcProvider, Wallet, parseUnits } from "ethers";
import { readFileSync, writeFileSync } from "node:fs";
import { dealsRouter } from "../server/routers/deals.ts";
import { escrowAbi, toOrderKey, toTermsHash, VERISETTLE_CONTRACTS } from "../shared/contracts.ts";

const ORDER_ID = "2w8_iT1aNogY1b";
const terms = {
  orderId: ORDER_ID,
  buyerAddress: "0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620",
  sellerAddress: "0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA",
  amount: "0.01",
  currency: "tCTC",
  description: "hihi alo alo",
};

if (process.env.CONFIRM_SANDBOX_ESCROW_FUNDING !== "yes") {
  throw new Error("Set CONFIRM_SANDBOX_ESCROW_FUNDING=yes after explicit user authorization.");
}

const buyer = JSON.parse(readFileSync("/home/ubuntu/.verisettle-buyer-testnet-wallet.json", "utf8"));
const provider = new JsonRpcProvider("https://rpc.cc3-testnet.creditcoin.network");
const signer = new Wallet(buyer.privateKey, provider);

if (signer.address.toLowerCase() !== terms.buyerAddress.toLowerCase()) {
  throw new Error("The local buyer role key does not match the persisted deal buyer address.");
}

const escrow = new Contract(VERISETTLE_CONTRACTS.escrowAsc, escrowAbi, signer);
const refundAfter = Math.floor(Date.now() / 1000) + 86_400;
const transaction = await escrow.fundEscrow(
  toOrderKey(terms.orderId),
  terms.sellerAddress,
  toTermsHash(terms),
  refundAfter,
  { value: parseUnits(terms.amount, 18) }
);
const receipt = await transaction.wait();
if (!receipt || receipt.status !== 1) throw new Error("The CC3 escrow funding transaction did not succeed.");

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

const recorded = await caller.recordFunding({ orderId: ORDER_ID, fundingTxHash: transaction.hash });
const evidence = {
  type: "sandbox-buyer-escrow-funding",
  orderId: ORDER_ID,
  buyer: signer.address,
  seller: terms.sellerAddress,
  amountTctc: terms.amount,
  escrowAsc: VERISETTLE_CONTRACTS.escrowAsc,
  termsHash: toTermsHash(terms),
  refundAfter,
  txHash: transaction.hash,
  blockNumber: receipt.blockNumber,
  recordedStatus: recorded.deal.status,
  createdAt: new Date().toISOString(),
  warning: "Sandbox-only testnet signer. No private-key material is stored here.",
};

writeFileSync("/home/ubuntu/verisettle/contracts/test-runs/user-draft-escrow-funding.json", `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
