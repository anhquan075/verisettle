import { readFileSync, writeFileSync } from "node:fs";
import { dealsRouter } from "../server/routers/deals.ts";

if (process.env.CONFIRM_RECEIPT_RECOVERY_TEST !== "yes") {
  throw new Error("Set CONFIRM_RECEIPT_RECOVERY_TEST=yes after explicit user authorization.");
}

const sourcePath = process.env.RECOVERY_EVIDENCE_FILE ?? "/home/ubuntu/verisettle/contracts/test-runs/recovery-test-unattached-funding.json";
const outputPath = process.env.RECOVERY_ATTACHMENT_OUTPUT ?? "/home/ubuntu/verisettle/contracts/test-runs/recovery-test-attached-receipt.json";
const source = JSON.parse(readFileSync(sourcePath, "utf8"));
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

const recorded = await caller.recordFunding({ orderId: source.orderId, fundingTxHash: source.fundingTxHash });
const evidence = {
  type: "external-receipt-recovery-attached",
  orderId: source.orderId,
  fundingTxHash: source.fundingTxHash,
  persistedStatusAfterAttachment: recorded.deal.status,
  immutableEvent: recorded.events.at(-1),
  createdAt: new Date().toISOString(),
  warning: "The transaction was mined before this recovery attachment call; recordFunding independently verified the on-chain EscrowFunded receipt.",
};
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
