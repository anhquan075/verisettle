import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { TESTNET_NETWORKS } from "../config.mjs";

export const EVIDENCE_SCHEMA_VERSION = 1;

export function explorerTx(network, hash) {
  const base = network === "sepolia" ? TESTNET_NETWORKS.sepolia.explorerUrl : TESTNET_NETWORKS.creditcoin.explorerUrl;
  return `${base}/tx/${hash}`;
}

export function requireDistinctWallets(buyer, seller) {
  if (!buyer || !seller || buyer.toLowerCase() === seller.toLowerCase()) {
    throw new Error("Two-wallet evidence requires BUYER_PRIVATE_KEY and SELLER_PRIVATE_KEY to control different addresses.");
  }
}

export function writeEvidence(path, evidence) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(evidence, null, 2)}\n`);
  return path;
}

export function proofArgs(proof) {
  return [
    proof.chainKey,
    proof.headerNumber,
    proof.txBytes,
    proof.merkleProof.root,
    proof.merkleProof.siblings,
    proof.continuityProof.lowerEndpointDigest,
    proof.continuityProof.roots,
  ];
}

export async function estimateProofGas(provider, escrow, from, args) {
  const data = escrow.interface.encodeFunctionData("submitAcceptanceProof", args);
  try {
    const estimated = await provider.estimateGas({ to: await escrow.getAddress(), from, data });
    return { data, gasLimit: (estimated * 135n) / 100n };
  } catch (error) {
    const continuityLength = BigInt(Math.max(args[6].length, 1));
    return { data, gasLimit: 250_000n + continuityLength * 30_000n, estimateError: error.shortMessage ?? String(error) };
  }
}

export function envOrThrow(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name}.`);
  return value;
}

export function hasLiveKeys() {
  return Boolean(process.env.BUYER_PRIVATE_KEY?.trim() && process.env.SELLER_PRIVATE_KEY?.trim());
}
