#!/usr/bin/env node
/**
 * Two-wallet fund → accept → Attestcoin proof → release.
 * Requires BUYER_PRIVATE_KEY ≠ SELLER_PRIVATE_KEY. Writes contracts/test-runs/two-wallet-*.json
 *
 * Usage:
 *   BUYER_PRIVATE_KEY=0x… SELLER_PRIVATE_KEY=0x… node scripts/run-two-wallet-lifecycle.mjs [v1|v2]
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
  escrowAbi,
  sourceAbi,
  v2EscrowAbi,
  v2SourceAbi,
} from "./config.mjs";
import { estimateProofGas, explorerTx, hasLiveKeys, proofArgs, requireDistinctWallets, writeEvidence } from "./lib/evidence.mjs";

const projectRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const policy = (process.argv[2] ?? "v1").toLowerCase();
if (policy !== "v1" && policy !== "v2") {
  throw new Error("Usage: node scripts/run-two-wallet-lifecycle.mjs [v1|v2]");
}

if (!hasLiveKeys()) {
  console.error("BUYER_PRIVATE_KEY and SELLER_PRIVATE_KEY are not set.");
  console.error("Fill contracts/test-runs/TEMPLATE-two-wallet.json after a live run. See contracts/test-runs/RUNBOOK.md.");
  process.exit(2);
}

const sepolia = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL ?? TESTNET_NETWORKS.sepolia.rpcUrl);
const creditcoin = new JsonRpcProvider(process.env.CC3_RPC_URL ?? TESTNET_NETWORKS.creditcoin.rpcUrl);
const buyerCc3 = new Wallet(process.env.BUYER_PRIVATE_KEY, creditcoin);
const buyerSepolia = new Wallet(process.env.BUYER_PRIVATE_KEY, sepolia);
const sellerCc3 = new Wallet(process.env.SELLER_PRIVATE_KEY, creditcoin);
requireDistinctWallets(buyerCc3.address, sellerCc3.address);

const isV2 = policy === "v2";
const sourceAddress = isV2 ? V2_POLICY.source : VERISETTLE_CONTRACTS.source;
const escrowAddress = isV2 ? V2_POLICY.escrowAsc : VERISETTLE_CONTRACTS.escrowAsc;
const source = new Contract(sourceAddress, isV2 ? v2SourceAbi : sourceAbi, buyerSepolia);
const escrow = new Contract(escrowAddress, isV2 ? v2EscrowAbi : escrowAbi, buyerCc3);
const orderId = hexlify(randomBytes(32));
const amount = parseEther(process.env.EVIDENCE_AMOUNT ?? "0.01");
const startedAt = new Date().toISOString();
const chainInfo = new chainInfoSdk.PrecompileChainInfoProvider(creditcoin, CHAIN_INFO_PRECOMPILE_ADDRESS);
const resolvedChain = await chainInfo.getSupportedChainByKey(VERISETTLE_CONTRACTS.sourceChainKey).catch(() => null);
const sourceChainKey = resolvedChain?.chainKey ?? VERISETTLE_CONTRACTS.sourceChainKey;

const evidence = {
  schemaVersion: 1,
  kind: "two-wallet-lifecycle",
  purpose: `Two-wallet ${policy.toUpperCase()} fund → accept → release. Attestcoin verifies the acceptance receipt, not physical delivery.`,
  policyVersion: isV2 ? "v2_deployed" : "v1_live",
  distinctWallets: true,
  orderId,
  buyer: buyerCc3.address,
  seller: sellerCc3.address,
  amount: formatEther(amount),
  sourceContract: sourceAddress,
  escrowAsc: escrowAddress,
  sourceChainKey,
  explorer: {},
  startedAt,
};

if (isV2) {
  const acceptanceExpiresAt = Math.floor(Date.now() / 1000) + 86_400;
  const termsCommitment = keccak256(randomBytes(32));
  const fundTx = await escrow.fundEscrow(orderId, sellerCc3.address, termsCommitment, acceptanceExpiresAt, { value: amount });
  const fundReceipt = await fundTx.wait();
  evidence.funding = { txHash: fundTx.hash, blockNumber: fundReceipt.blockNumber };
  evidence.explorer.funding = explorerTx("creditcoin", fundTx.hash);
  const acceptTx = await source.acceptOrder(orderId, sellerCc3.address, termsCommitment, acceptanceExpiresAt);
  const acceptReceipt = await acceptTx.wait();
  evidence.acceptance = { txHash: acceptTx.hash, blockNumber: acceptReceipt.blockNumber };
  evidence.explorer.acceptance = explorerTx("sepolia", acceptTx.hash);
  evidence.termsCommitment = termsCommitment;
  evidence.acceptanceExpiresAt = acceptanceExpiresAt;
} else {
  const termsHash = keccak256(randomBytes(32));
  const refundAfter = Math.floor(Date.now() / 1000) + 86_400;
  const fundTx = await escrow.fundEscrow(orderId, sellerCc3.address, termsHash, refundAfter, { value: amount });
  const fundReceipt = await fundTx.wait();
  evidence.funding = { txHash: fundTx.hash, blockNumber: fundReceipt.blockNumber };
  evidence.explorer.funding = explorerTx("creditcoin", fundTx.hash);
  const acceptTx = await source.acceptOrder(orderId, sellerCc3.address, termsHash);
  const acceptReceipt = await acceptTx.wait();
  evidence.acceptance = { txHash: acceptTx.hash, blockNumber: acceptReceipt.blockNumber };
  evidence.explorer.acceptance = explorerTx("sepolia", acceptTx.hash);
  evidence.termsHash = termsHash;
}

console.log(`Waiting for ChainInfo 0xFD3 to attest Sepolia height ${evidence.acceptance.blockNumber} (chainKey ${sourceChainKey}).`);
await chainInfo.waitUntilHeightAttested(sourceChainKey, evidence.acceptance.blockNumber, 15_000, 1_200_000);
const proofBuilder = new proofProvider.service.ProofBuilder(sourceChainKey, ATTESTCOIN_PROVER_URL);
const proofResult = await proofBuilder.getProof(evidence.acceptance.txHash);
if (!proofResult.success || !proofResult.data) {
  throw new Error(proofResult.error ?? "Attestcoin proof generation failed.");
}
const args = proofArgs(proofResult.data);
const { gasLimit } = await estimateProofGas(creditcoin, escrow, buyerCc3.address, args);
const proofTx = await escrow.submitAcceptanceProof(...args, { gasLimit });
const proofReceipt = await proofTx.wait();
const onChain = await escrow.escrows(orderId);
if (Number(onChain.status) !== 2) {
  throw new Error(`Expected Released; received status ${onChain.status}.`);
}

evidence.release = {
  txHash: proofTx.hash,
  blockNumber: proofReceipt.blockNumber,
  event: isV2 ? "EscrowReleasedV2" : "EscrowReleased",
};
evidence.explorer.release = explorerTx("creditcoin", proofTx.hash);
evidence.finalStatus = "Released";
evidence.completedAt = new Date().toISOString();

const out = resolve(projectRoot, "contracts/test-runs", `two-wallet-${policy}-${orderId.slice(2, 10)}.json`);
writeEvidence(out, evidence);
console.log(JSON.stringify({ evidencePath: out, ...evidence }, null, 2));
