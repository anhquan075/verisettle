import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { proofProvider } from "@gluwa/usc-sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { dealsRouter } from "../server/routers/deals.ts";
import { escrowAbi, toOrderKey, VERISETTLE_CONTRACTS } from "../shared/contracts.ts";

const ORDER_ID = "2w8_iT1aNogY1b";
const SOURCE_TX_HASH = "0x46d774edf8321e68020559751a03929176484749776ca419927277da9736ca7a";

if (process.env.CONFIRM_SANDBOX_RELEASE !== "yes") {
  throw new Error("Set CONFIRM_SANDBOX_RELEASE=yes after explicit user authorization.");
}

const delay = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));
const buyer = JSON.parse(readFileSync("/home/ubuntu/.verisettle-buyer-testnet-wallet.json", "utf8"));
const provider = new JsonRpcProvider("https://rpc.cc3-testnet.creditcoin.network");
const signer = new Wallet(buyer.privateKey, provider);
const escrow = new Contract(VERISETTLE_CONTRACTS.escrowAsc, escrowAbi, signer);
const proofBuilder = new proofProvider.service.ProofBuilder(VERISETTLE_CONTRACTS.sourceChainKey, "https://prover.cc3-testnet.creditcoin.network/");

let proof;
for (let attempt = 1; attempt <= 20; attempt += 1) {
  const result = await proofBuilder.getProof(SOURCE_TX_HASH);
  if (result.success && result.data) {
    proof = result.data;
    break;
  }
  console.log(JSON.stringify({ state: "waiting-for-attestation", attempt, sourceTxHash: SOURCE_TX_HASH, detail: result.error ?? "Proof payload not available yet." }));
  if (attempt === 20) throw new Error(`Attestcoin proof was not available after ${attempt} checks: ${result.error ?? "unknown error"}`);
  await delay(30_000);
}

const proofArgs = [
  proof.chainKey,
  proof.headerNumber,
  proof.txBytes,
  proof.merkleProof.root,
  proof.merkleProof.siblings,
  proof.continuityProof.lowerEndpointDigest,
  proof.continuityProof.roots,
];
const encoded = escrow.interface.encodeFunctionData("submitAcceptanceProof", proofArgs);
let gasLimit;
try {
  gasLimit = ((await provider.estimateGas({ to: VERISETTLE_CONTRACTS.escrowAsc, from: signer.address, data: encoded })) * 135n) / 100n;
} catch {
  gasLimit = 350_000n + BigInt(Math.max(proof.continuityProof.roots.length, 1)) * 30_000n;
}
const transaction = await escrow.submitAcceptanceProof(...proofArgs, { gasLimit });
const receipt = await transaction.wait();
if (!receipt || receipt.status !== 1) throw new Error("Attestcoin proof submission did not succeed on CC3.");

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
const recorded = await caller.recordSettlement({ orderId: ORDER_ID, settlementTxHash: transaction.hash });

let replayRejection = "";
try {
  await provider.call({ to: VERISETTLE_CONTRACTS.escrowAsc, from: signer.address, data: encoded });
  throw new Error("Replay call unexpectedly succeeded.");
} catch (error) {
  const payload = error?.data ?? error?.info?.error?.data ?? "0x";
  const parsed = escrow.interface.parseError(payload);
  replayRejection = parsed?.name ?? error?.shortMessage ?? error?.message ?? "unknown";
  if (parsed?.name !== "QueryAlreadyProcessed") throw new Error(`Expected QueryAlreadyProcessed replay rejection; received ${replayRejection}.`);
}

const escrowState = await escrow.escrows(toOrderKey(ORDER_ID));
const evidence = {
  type: "sandbox-buyer-attestcoin-release",
  orderId: ORDER_ID,
  buyer: signer.address,
  seller: escrowState.seller,
  sourceTxHash: SOURCE_TX_HASH,
  sourceBlockHeight: proof.headerNumber,
  proofSubmissionTxHash: transaction.hash,
  proofSubmissionBlockNumber: receipt.blockNumber,
  escrowAsc: VERISETTLE_CONTRACTS.escrowAsc,
  finalStatus: recorded.deal.status,
  replayRejection,
  createdAt: new Date().toISOString(),
  warning: "Sandbox-only testnet signer. No private-key material is stored here.",
};
writeFileSync("/home/ubuntu/verisettle/contracts/test-runs/user-draft-attestcoin-release.json", `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
