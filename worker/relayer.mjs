#!/usr/bin/env node
/**
 * Thin permissionless relayer.
 *
 * Watches Sepolia OrderAccepted / OrderAcceptedV2, waits for ChainInfo 0xFD3
 * attestation, builds a ProofBuilder proof, and submits submitAcceptanceProof
 * on CC3. The relayer cannot steal escrow: ASC party/terms checks remain
 * authoritative and pay the recorded seller.
 *
 * Manual wallet submit stays available. This worker is optional convenience.
 *
 * Env:
 *   RELAYER_PRIVATE_KEY   CC3 gas payer (not an escrow authority)
 *   POLL_INTERVAL_MS      default 30000
 *   LOOKBACK_BLOCKS       default 2000
 */
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { proofProvider, chainInfo as chainInfoSdk } from "@gluwa/usc-sdk";
import { mkdirSync, writeFileSync } from "node:fs";
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
} from "../scripts/config.mjs";
import { estimateProofGas, explorerTx, proofArgs } from "../scripts/lib/evidence.mjs";

const projectRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const pollMs = Number(process.env.POLL_INTERVAL_MS ?? 30_000);
const lookback = Number(process.env.LOOKBACK_BLOCKS ?? 2000);
const once = process.argv.includes("--once");

const routes = [
  {
    id: "v1",
    source: VERISETTLE_CONTRACTS.source,
    escrow: VERISETTLE_CONTRACTS.escrowAsc,
    sourceAbi,
    escrowAbi,
    event: "OrderAccepted",
  },
  {
    id: "v2",
    source: V2_POLICY.source,
    escrow: V2_POLICY.escrowAsc,
    sourceAbi: v2SourceAbi,
    escrowAbi: v2EscrowAbi,
    event: "OrderAcceptedV2",
  },
];

const sepolia = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL ?? TESTNET_NETWORKS.sepolia.rpcUrl);
const creditcoin = new JsonRpcProvider(process.env.CC3_RPC_URL ?? TESTNET_NETWORKS.creditcoin.rpcUrl);
const chainInfo = new chainInfoSdk.PrecompileChainInfoProvider(creditcoin, CHAIN_INFO_PRECOMPILE_ADDRESS);
const processed = new Set();

function requireRelayer() {
  const key = process.env.RELAYER_PRIVATE_KEY?.trim();
  if (!key) {
    throw new Error("RELAYER_PRIVATE_KEY is required to submit proofs. The key only pays gas; it cannot redirect escrow.");
  }
  return new Wallet(key, creditcoin);
}

async function resolveChainKey() {
  try {
    const supported = await chainInfo.getSupportedChainByKey(VERISETTLE_CONTRACTS.sourceChainKey);
    return supported?.chainKey ?? VERISETTLE_CONTRACTS.sourceChainKey;
  } catch {
    return VERISETTLE_CONTRACTS.sourceChainKey;
  }
}

async function handleAcceptance(route, event, relayer, sourceChainKey) {
  const orderId = event.args[0];
  const key = `${route.id}:${event.transactionHash}`;
  if (processed.has(key)) return;
  const escrow = new Contract(route.escrow, route.escrowAbi, relayer);
  const funded = await escrow.escrows(orderId);
  if (Number(funded.status) !== 1) {
    console.log(`[${route.id}] skip ${event.transactionHash}: escrow not funded`);
    return;
  }

  const sourceBlock = event.blockNumber;
  console.log(`[${route.id}] waiting for ChainInfo attestation of height ${sourceBlock}`);
  await chainInfo.waitUntilHeightAttested(sourceChainKey, sourceBlock, 15_000, 1_200_000);
  const proof = await new proofProvider.service.ProofBuilder(sourceChainKey, ATTESTCOIN_PROVER_URL).getProof(event.transactionHash);
  if (!proof.success || !proof.data) {
    throw new Error(proof.error ?? "ProofBuilder failed");
  }
  const args = proofArgs(proof.data);
  const { gasLimit } = await estimateProofGas(creditcoin, escrow, relayer.address, args);
  const tx = await escrow.submitAcceptanceProof(...args, { gasLimit });
  const receipt = await tx.wait();
  processed.add(key);

  const evidence = {
    schemaVersion: 1,
    kind: "worker-relayer",
    purpose: "Permissionless relayer submitted an Attestcoin proof. Relayer cannot steal escrow.",
    policyVersion: route.id === "v2" ? "v2_deployed" : "v1_live",
    distinctWallets: funded.buyer.toLowerCase() !== funded.seller.toLowerCase(),
    orderId,
    buyer: funded.buyer,
    seller: funded.seller,
    relayer: relayer.address,
    acceptance: { txHash: event.transactionHash, blockNumber: sourceBlock },
    release: { txHash: tx.hash, blockNumber: receipt.blockNumber, event: route.id === "v2" ? "EscrowReleasedV2" : "EscrowReleased" },
    explorer: {
      acceptance: explorerTx("sepolia", event.transactionHash),
      release: explorerTx("creditcoin", tx.hash),
    },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    note: "Manual submitAcceptanceProof remains available. ASC checks stay authoritative.",
  };
  const directory = resolve(projectRoot, "contracts/test-runs/worker-relayer");
  mkdirSync(directory, { recursive: true });
  const path = resolve(directory, `${route.id}-${event.transactionHash.slice(2, 10)}.json`);
  writeFileSync(path, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`[${route.id}] submitted ${tx.hash} → ${path}`);
}

async function poll(relayer, sourceChainKey) {
  const head = await sepolia.getBlockNumber();
  const fromBlock = Math.max(0, head - lookback);
  for (const route of routes) {
    const source = new Contract(route.source, route.sourceAbi, sepolia);
    const logs = await source.queryFilter(source.filters[route.event](), fromBlock, head);
    for (const log of logs) {
      try {
        await handleAcceptance(route, log, relayer, sourceChainKey);
      } catch (error) {
        console.warn(`[${route.id}] ${log.transactionHash}: ${error.shortMessage ?? error.message}`);
      }
    }
  }
}

const sourceChainKey = await resolveChainKey();
if (process.argv.includes("--dry-run")) {
  const latest = await chainInfo.getLatestAttestedHeightAndHash(sourceChainKey).catch((error) => ({ error: error.message }));
  console.log(JSON.stringify({ sourceChainKey, latest, routes: routes.map((route) => route.id) }, null, 2));
  process.exit(0);
}

const relayer = requireRelayer();
console.log(`Relayer ${relayer.address} watching Sepolia acceptances. ChainKey ${sourceChainKey}. Cannot steal escrow.`);
await poll(relayer, sourceChainKey);
if (!once) {
  setInterval(() => {
    poll(relayer, sourceChainKey).catch((error) => console.warn(error.message));
  }, pollMs);
}
