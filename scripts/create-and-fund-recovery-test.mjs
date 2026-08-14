import { Contract, JsonRpcProvider, Wallet, parseUnits } from "ethers";
import { readFileSync, writeFileSync } from "node:fs";
import { dealsRouter } from "../server/routers/deals.ts";
import { escrowAbi, toOrderKey, toTermsHash, VERISETTLE_CONTRACTS } from "../shared/contracts.ts";

if (process.env.CONFIRM_RECEIPT_RECOVERY_TEST !== "yes") {
  throw new Error("Set CONFIRM_RECEIPT_RECOVERY_TEST=yes after explicit user authorization.");
}

const buyerAddress = "0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620";
const sellerAddress = "0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA";
const amount = "0.001";
const description = "External receipt recovery validation";
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

const created = await caller.createDeal({ buyerAddress, sellerAddress, amount, currency: "tCTC", description });
const terms = {
  orderId: created.deal.orderId,
  buyerAddress,
  sellerAddress,
  amount,
  currency: "tCTC",
  description,
};
const wallet = JSON.parse(readFileSync("/home/ubuntu/.verisettle-buyer-testnet-wallet.json", "utf8"));
const provider = new JsonRpcProvider("https://rpc.cc3-testnet.creditcoin.network");
const signer = new Wallet(wallet.privateKey, provider);
if (signer.address.toLowerCase() !== buyerAddress.toLowerCase()) throw new Error("Buyer signer does not match recovery test buyer.");

const escrow = new Contract(VERISETTLE_CONTRACTS.escrowAsc, escrowAbi, signer);
const refundAfter = Math.floor(Date.now() / 1000) + 86_400;
const tx = await escrow.fundEscrow(toOrderKey(terms.orderId), sellerAddress, toTermsHash(terms), refundAfter, { value: parseUnits(amount, 18) });
const receipt = await tx.wait();
if (!receipt || receipt.status !== 1) throw new Error("Recovery test funding transaction failed.");

const evidence = {
  type: "external-receipt-recovery-unattached-funding",
  orderId: created.deal.orderId,
  buyer: signer.address,
  seller: sellerAddress,
  amountTctc: amount,
  termsHash: toTermsHash(terms),
  refundAfter,
  fundingTxHash: tx.hash,
  blockNumber: receipt.blockNumber,
  persistedStatusBeforeAttachment: created.deal.status,
  createdAt: new Date().toISOString(),
  warning: "The funding receipt is intentionally not recorded yet. Attach it through the verified recovery procedure next.",
};
const evidencePath = process.env.RECOVERY_EVIDENCE_FILE ?? "/home/ubuntu/verisettle/contracts/test-runs/recovery-test-unattached-funding.json";
writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
