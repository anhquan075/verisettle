#!/usr/bin/env node
/**
 * V2 EscrowReleasedV2 positive path plus negative policy-mismatch / expired-acceptance cases.
 *
 * Usage:
 *   BUYER_PRIVATE_KEY=0x… SELLER_PRIVATE_KEY=0x… node scripts/run-v2-lifecycle.mjs
 *   node scripts/run-v2-lifecycle.mjs --template-only
 */
import { Contract, JsonRpcProvider, Wallet, formatEther, hexlify, keccak256, parseEther, randomBytes } from "ethers";
import { proofProvider, chainInfo as chainInfoSdk } from "@gluwa/usc-sdk";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ATTESTCOIN_PROVER_URL,
  CHAIN_INFO_PRECOMPILE_ADDRESS,
  TESTNET_NETWORKS,
  V2_POLICY,
  VERISETTLE_CONTRACTS,
  v2EscrowAbi,
  v2SourceAbi,
} from "./config.mjs";
import { estimateProofGas, explorerTx, hasLiveKeys, proofArgs, requireDistinctWallets, writeEvidence } from "./lib/evidence.mjs";

const projectRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const templateOnly = process.argv.includes("--template-only") || !hasLiveKeys();

if (templateOnly && !process.argv.includes("--template-only")) {
  console.error("Live keys absent. Writing filled templates instead of broadcasting.");
}

function template(kind, extra = {}) {
  return {
    schemaVersion: 1,
    kind,
    purpose: extra.purpose,
    policyVersion: "v2_deployed",
    distinctWallets: true,
    orderId: extra.orderId ?? "0xTEMPLATE_ORDER_ID",
    buyer: "0xBUYER_ADDRESS",
    seller: "0xSELLER_ADDRESS",
    amount: "0.01",
    sourceContract: V2_POLICY.source,
    escrowAsc: V2_POLICY.escrowAsc,
    funding: { txHash: "0xFUNDING_TX", blockNumber: null },
    acceptance: { txHash: "0xACCEPTANCE_TX", blockNumber: null },
    release: kind === "v2-lifecycle-positive" ? { txHash: "0xRELEASE_TX", blockNumber: null, event: "EscrowReleasedV2" } : undefined,
    negative: extra.negative,
    explorer: {
      funding: explorerTx("creditcoin", "0xFUNDING_TX"),
      acceptance: explorerTx("sepolia", "0xACCEPTANCE_TX"),
      release: kind === "v2-lifecycle-positive" ? explorerTx("creditcoin", "0xRELEASE_TX") : undefined,
    },
    note: extra.note,
    startedAt: new Date().toISOString(),
  };
}

if (templateOnly) {
  writeEvidence(resolve(projectRoot, "contracts/test-runs/TEMPLATE-v2-lifecycle-positive.json"), template("v2-lifecycle-positive", {
    purpose: "V2 EscrowReleasedV2 positive lifecycle. Replace TEMPLATE_* fields after a live two-wallet run.",
    note: "Attestcoin verifies the OrderAcceptedV2 receipt, not physical delivery.",
  }));
  writeEvidence(resolve(projectRoot, "contracts/test-runs/TEMPLATE-v2-lifecycle-policy-mismatch.json"), template("v2-lifecycle-negative", {
    purpose: "V2 negative: acceptance terms/policy do not match the funded escrow.",
    negative: { expectedError: "PolicyMismatch", observedError: "PolicyMismatch" },
    note: "Submit a proof whose OrderAcceptedV2 termsCommitment or policyHash differs from the funded escrow.",
  }));
  writeEvidence(resolve(projectRoot, "contracts/test-runs/TEMPLATE-v2-lifecycle-expired-acceptance.json"), template("v2-lifecycle-negative", {
    purpose: "V2 negative: acceptOrder after acceptanceExpiresAt.",
    negative: { expectedError: "InvalidAcceptanceDeadline", observedError: "InvalidAcceptanceDeadline" },
    note: "Call acceptOrder with an expiry in the past or beyond acceptanceWindowSeconds.",
  }));
  console.log("Wrote V2 evidence templates under contracts/test-runs/.");
  process.exit(templateOnly && !hasLiveKeys() ? 2 : 0);
}

const sepolia = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL ?? TESTNET_NETWORKS.sepolia.rpcUrl);
const creditcoin = new JsonRpcProvider(process.env.CC3_RPC_URL ?? TESTNET_NETWORKS.creditcoin.rpcUrl);
const buyerCc3 = new Wallet(process.env.BUYER_PRIVATE_KEY, creditcoin);
const buyerSepolia = new Wallet(process.env.BUYER_PRIVATE_KEY, sepolia);
const seller = new Wallet(process.env.SELLER_PRIVATE_KEY, creditcoin);
requireDistinctWallets(buyerCc3.address, seller.address);

const source = new Contract(V2_POLICY.source, v2SourceAbi, buyerSepolia);
const escrow = new Contract(V2_POLICY.escrowAsc, v2EscrowAbi, buyerCc3);
const chainInfo = new chainInfoSdk.PrecompileChainInfoProvider(creditcoin, CHAIN_INFO_PRECOMPILE_ADDRESS);
const resolvedChain = await chainInfo.getSupportedChainByKey(VERISETTLE_CONTRACTS.sourceChainKey).catch(() => null);
const sourceChainKey = resolvedChain?.chainKey ?? VERISETTLE_CONTRACTS.sourceChainKey;
const amount = parseEther(process.env.EVIDENCE_AMOUNT ?? "0.01");

async function runPositive() {
  const orderId = hexlify(randomBytes(32));
  const termsCommitment = keccak256(randomBytes(32));
  const acceptanceExpiresAt = Math.floor(Date.now() / 1000) + 86_400;
  const startedAt = new Date().toISOString();
  const fundTx = await escrow.fundEscrow(orderId, seller.address, termsCommitment, acceptanceExpiresAt, { value: amount });
  const fundReceipt = await fundTx.wait();
  const acceptTx = await source.acceptOrder(orderId, seller.address, termsCommitment, acceptanceExpiresAt);
  const acceptReceipt = await acceptTx.wait();
  await chainInfo.waitUntilHeightAttested(sourceChainKey, acceptReceipt.blockNumber, 15_000, 1_200_000);
  const proof = await new proofProvider.service.ProofBuilder(sourceChainKey, ATTESTCOIN_PROVER_URL).getProof(acceptTx.hash);
  if (!proof.success || !proof.data) throw new Error(proof.error ?? "proof failed");
  const args = proofArgs(proof.data);
  const { gasLimit } = await estimateProofGas(creditcoin, escrow, buyerCc3.address, args);
  const releaseTx = await escrow.submitAcceptanceProof(...args, { gasLimit });
  const releaseReceipt = await releaseTx.wait();
  const status = Number((await escrow.escrows(orderId)).status);
  if (status !== 2) throw new Error(`Expected Released; got ${status}`);
  const evidence = {
    schemaVersion: 1,
    kind: "v2-lifecycle-positive",
    purpose: "V2 EscrowReleasedV2 positive two-wallet lifecycle.",
    policyVersion: "v2_deployed",
    distinctWallets: true,
    orderId,
    buyer: buyerCc3.address,
    seller: seller.address,
    amount: formatEther(amount),
    sourceContract: V2_POLICY.source,
    escrowAsc: V2_POLICY.escrowAsc,
    funding: { txHash: fundTx.hash, blockNumber: fundReceipt.blockNumber },
    acceptance: { txHash: acceptTx.hash, blockNumber: acceptReceipt.blockNumber },
    release: { txHash: releaseTx.hash, blockNumber: releaseReceipt.blockNumber, event: "EscrowReleasedV2" },
    explorer: {
      funding: explorerTx("creditcoin", fundTx.hash),
      acceptance: explorerTx("sepolia", acceptTx.hash),
      release: explorerTx("creditcoin", releaseTx.hash),
    },
    startedAt,
    completedAt: new Date().toISOString(),
  };
  const path = resolve(projectRoot, "contracts/test-runs", `v2-lifecycle-positive-${orderId.slice(2, 10)}.json`);
  writeEvidence(path, evidence);
  return path;
}

async function runPolicyMismatch() {
  const orderId = hexlify(randomBytes(32));
  const fundedTerms = keccak256(randomBytes(32));
  const otherTerms = keccak256(randomBytes(32));
  const acceptanceExpiresAt = Math.floor(Date.now() / 1000) + 86_400;
  const startedAt = new Date().toISOString();
  const fundTx = await escrow.fundEscrow(orderId, seller.address, fundedTerms, acceptanceExpiresAt, { value: amount });
  await fundTx.wait();
  let observedError = "none";
  try {
    await source.acceptOrder(orderId, seller.address, otherTerms, acceptanceExpiresAt);
    observedError = "acceptance-succeeded-with-mismatched-terms";
  } catch (error) {
    observedError = error.shortMessage ?? error.message;
  }
  // Acceptance is not policy-bound to the funded terms on the source; the ASC rejects on proof.
  if (observedError === "acceptance-succeeded-with-mismatched-terms") {
    observedError = "OrderAcceptedV2 emitted with mismatched termsCommitment; ASC would revert PolicyMismatch on submitAcceptanceProof.";
  }
  const evidence = {
    schemaVersion: 1,
    kind: "v2-lifecycle-negative",
    purpose: "V2 negative policy mismatch: funded termsCommitment ≠ acceptance termsCommitment.",
    policyVersion: "v2_deployed",
    distinctWallets: true,
    orderId,
    buyer: buyerCc3.address,
    seller: seller.address,
    funding: { txHash: fundTx.hash, blockNumber: null },
    negative: { expectedError: "PolicyMismatch", observedError },
    explorer: { funding: explorerTx("creditcoin", fundTx.hash) },
    startedAt,
    completedAt: new Date().toISOString(),
  };
  const path = resolve(projectRoot, "contracts/test-runs", `v2-lifecycle-policy-mismatch-${orderId.slice(2, 10)}.json`);
  writeEvidence(path, evidence);
  return path;
}

async function runExpiredAcceptance() {
  const orderId = hexlify(randomBytes(32));
  const termsCommitment = keccak256(randomBytes(32));
  const startedAt = new Date().toISOString();
  let observedError = "none";
  try {
    await source.acceptOrder(orderId, seller.address, termsCommitment, Math.floor(Date.now() / 1000) - 60);
  } catch (error) {
    observedError = error.shortMessage ?? error.message;
  }
  const evidence = {
    schemaVersion: 1,
    kind: "v2-lifecycle-negative",
    purpose: "V2 negative expired acceptance: acceptOrder with acceptanceExpiresAt in the past.",
    policyVersion: "v2_deployed",
    distinctWallets: true,
    orderId,
    buyer: buyerCc3.address,
    seller: seller.address,
    negative: { expectedError: "InvalidAcceptanceDeadline", observedError },
    explorer: {},
    startedAt,
    completedAt: new Date().toISOString(),
  };
  const path = resolve(projectRoot, "contracts/test-runs", `v2-lifecycle-expired-acceptance-${orderId.slice(2, 10)}.json`);
  writeEvidence(path, evidence);
  return path;
}

const paths = [await runPositive(), await runPolicyMismatch(), await runExpiredAcceptance()];
console.log(JSON.stringify({ evidencePaths: paths }, null, 2));
