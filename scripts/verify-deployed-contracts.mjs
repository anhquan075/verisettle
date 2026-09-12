#!/usr/bin/env node
/**
 * Probe explorers, then run forge verify-contract for unverified live deployments.
 * CC3 Blockscout does not require an API key. Sepolia Etherscan is skipped
 * unless ETHERSCAN_API_KEY is set — never invent a key.
 * Writes contracts/deployments/verification-attempt.json. Never prints secrets.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { V2_POLICY, VERISETTLE_CONTRACTS } from "./config.mjs";

const projectRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const etherscanKey = process.env.ETHERSCAN_API_KEY?.trim();
const decoderLibrary =
  "node_modules/@gluwa/usc-contracts/contracts/decoding/EvmV1Decoder.sol:EvmV1Decoder:0x1aC5b6B47EFe751681A206Fa8A5C305250017425";

export const V2_SOURCE_CONSTRUCTOR_ARGS =
  "0xf951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f289760000000000000000000000000000000000000000000000000000000000093a80";
export const V1_ESCROW_CONSTRUCTOR_ARGS =
  "0x0000000000000000000000001ac5b6b47efe751681a206fa8a5c3052500174250000000000000000000000000000000000000000000000000000000000000001";
export const V2_ESCROW_CONSTRUCTOR_ARGS =
  "0x00000000000000000000000056e6d3e213141aa8285d0b12504bda5da260aa180000000000000000000000000000000000000000000000000000000000000001f951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f289760000000000000000000000000000000000000000000000000000000000093a800000000000000000000000000000000000000000000000000000000000278d00";
export const MULTISIG_CONSTRUCTOR_ARGS =
  "0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003000000000000000000000000c7774720d1c14b9da1c656b796a2a092d0b9d1c9000000000000000000000000d0af9b88ce5aa93358afb510e1cbd55c044f362000000000000000000000000036ab1bbd6f9e64a35d81ee75ad039d9bdb2fdcaa";
export const GOVERNED_CONSTRUCTOR_ARGS =
  "0x00000000000000000000000056e6d3e213141aa8285d0b12504bda5da260aa180000000000000000000000000000000000000000000000000000000000000001f951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f289760000000000000000000000000000000000000000000000000000000000093a800000000000000000000000000000000000000000000000000000000000278d000000000000000000000000000c9b8ef45aa36922bb3dde9aeec1bb1bafce2849";

export const VERIFY_TARGETS = [
  {
    name: "VeriSettleSource V1",
    address: VERISETTLE_CONTRACTS.source,
    contract: "contracts/VeriSettleSource.sol:VeriSettleSource",
    chainId: 11155111,
    verifier: "etherscan",
    evmVersion: "shanghai",
    explorerUrl: `https://sepolia.etherscan.io/address/${VERISETTLE_CONTRACTS.source}`,
    constructorArgs: "",
  },
  {
    name: "VeriSettleSourceV2",
    address: V2_POLICY.source,
    contract: "contracts/VeriSettleSourceV2.sol:VeriSettleSourceV2",
    chainId: 11155111,
    verifier: "etherscan",
    evmVersion: "shanghai",
    explorerUrl: `https://sepolia.etherscan.io/address/${V2_POLICY.source}`,
    constructorArgs: V2_SOURCE_CONSTRUCTOR_ARGS,
  },
  {
    name: "VeriSettleEscrowASC V1",
    address: VERISETTLE_CONTRACTS.escrowAsc,
    contract: "contracts/VeriSettleEscrowASC.sol:VeriSettleEscrowASC",
    chainId: 102031,
    verifier: "blockscout",
    verifierUrl: "https://creditcoin-testnet.blockscout.com/api/",
    evmVersion: "shanghai",
    flatten: true,
    libraries: decoderLibrary,
    explorerUrl: `https://creditcoin-testnet.blockscout.com/address/${VERISETTLE_CONTRACTS.escrowAsc}?tab=contract`,
    constructorArgs: V1_ESCROW_CONSTRUCTOR_ARGS,
  },
  {
    name: "VeriSettleEscrowASCV2",
    address: V2_POLICY.escrowAsc,
    contract: "contracts/VeriSettleEscrowASCV2.sol:VeriSettleEscrowASCV2",
    chainId: 102031,
    verifier: "blockscout",
    verifierUrl: "https://creditcoin-testnet.blockscout.com/api/",
    evmVersion: "shanghai",
    flatten: true,
    libraries: decoderLibrary,
    explorerUrl: `https://creditcoin-testnet.blockscout.com/address/${V2_POLICY.escrowAsc}?tab=contract`,
    constructorArgs: V2_ESCROW_CONSTRUCTOR_ARGS,
  },
  {
    name: "VeriSettleDisputeMultisig",
    address: "0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849",
    contract: "contracts/VeriSettleDisputeMultisig.sol:VeriSettleDisputeMultisig",
    chainId: 102031,
    verifier: "blockscout",
    verifierUrl: "https://creditcoin-testnet.blockscout.com/api/",
    evmVersion: "paris",
    explorerUrl: "https://creditcoin-testnet.blockscout.com/address/0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849?tab=contract",
    constructorArgs: MULTISIG_CONSTRUCTOR_ARGS,
  },
  {
    name: "VeriSettleEscrowASCV2Governed",
    address: "0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7",
    contract: "contracts/VeriSettleEscrowASCV2Governed.sol:VeriSettleEscrowASCV2Governed",
    chainId: 102031,
    verifier: "blockscout",
    verifierUrl: "https://creditcoin-testnet.blockscout.com/api/",
    evmVersion: "paris",
    libraries: decoderLibrary,
    explorerUrl: "https://creditcoin-testnet.blockscout.com/address/0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7?tab=contract",
    constructorArgs: GOVERNED_CONSTRUCTOR_ARGS,
  },
];

function verifyArgs(target, { redactKey = false } = {}) {
  const args = [
    "verify-contract",
    "--chain-id",
    String(target.chainId),
    "--compiler-version",
    "0.8.23",
    "--optimizer-runs",
    "200",
    "--evm-version",
    target.evmVersion,
  ];
  if (target.flatten) args.push("--flatten");
  if (target.constructorArgs) args.push("--constructor-args", target.constructorArgs);
  if (target.libraries) args.push("--libraries", target.libraries);
  args.push("--watch", target.address, target.contract);
  if (target.verifier === "blockscout") {
    args.push("--verifier", "blockscout", "--verifier-url", target.verifierUrl);
  } else {
    args.push("--etherscan-api-key", redactKey ? "$ETHERSCAN_API_KEY" : etherscanKey);
  }
  return args;
}

export function documentedCommand(target) {
  return `forge ${verifyArgs(target, { redactKey: true }).join(" ")}`;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "user-agent": "VeriSettleVerify/1.0" } });
  if (!response.ok) return null;
  return response.json();
}

async function probeVerified(target) {
  if (target.verifier === "blockscout") {
    const data = await fetchJson(`https://creditcoin-testnet.blockscout.com/api/v2/addresses/${target.address}`);
    if (data?.is_verified) return { verified: true, name: data.name ?? target.name };
    return { verified: false };
  }
  const data = await fetchJson(`https://sourcify.dev/server/v2/contract/${target.chainId}/${target.address}`);
  if (data?.match) return { verified: true, name: target.name, sourcifyMatch: data.match };
  return { verified: false };
}

async function main() {
  const results = [];
  for (const target of VERIFY_TARGETS) {
    const documented = documentedCommand(target);
    const probed = await probeVerified(target).catch(() => ({ verified: false }));
    if (probed.verified) {
      results.push({
        name: target.name,
        address: target.address,
        network: target.chainId === 11155111 ? "Ethereum Sepolia" : "Creditcoin CC3 Testnet",
        chainId: target.chainId,
        status: "already_verified",
        explorerVerified: true,
        explorerUrl: target.explorerUrl,
        constructorArgs: target.constructorArgs || "",
        command: documented,
      });
      continue;
    }
    if (target.verifier === "etherscan" && !etherscanKey) {
      results.push({
        name: target.name,
        address: target.address,
        network: "Ethereum Sepolia",
        chainId: target.chainId,
        status: "pending_etherscan_key",
        explorerVerified: false,
        explorerUrl: target.explorerUrl,
        reason: "ETHERSCAN_API_KEY was not present. Do not invent a key. TODO: run the documented command.",
        constructorArgs: target.constructorArgs || "",
        command: documented,
      });
      continue;
    }
    const ran = spawnSync("forge", verifyArgs(target), { cwd: projectRoot, encoding: "utf8" });
    const combined = `${ran.stdout ?? ""}\n${ran.stderr ?? ""}`;
    const already = /already verified/i.test(combined);
    const passed = /successfully verified|Pass - Verified/i.test(combined);
    results.push({
      name: target.name,
      address: target.address,
      network: target.chainId === 11155111 ? "Ethereum Sepolia" : "Creditcoin CC3 Testnet",
      chainId: target.chainId,
      status: already ? "already_verified" : passed && ran.status === 0 ? "verified" : ran.status === 0 ? "submitted" : "failed",
      explorerVerified: already || passed,
      explorerUrl: target.explorerUrl,
      exitCode: ran.status,
      stdout: (ran.stdout ?? "").slice(0, 2000),
      stderr: (ran.stderr ?? "").slice(0, 2000),
      constructorArgs: target.constructorArgs || "",
      command: documented,
    });
  }

  const report = {
    attemptedAt: new Date().toISOString(),
    etherscanKeyPresent: Boolean(etherscanKey),
    blockscoutKeyPresent: false,
    results,
  };
  const out = resolve(projectRoot, "contracts/deployments/verification-attempt.json");
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  const counts = {
    reportPath: out,
    verified: results.filter((row) => row.explorerVerified).length,
    pending: results.filter((row) => row.status === "pending_etherscan_key").length,
    failed: results.filter((row) => row.status === "failed").length,
  };
  console.log(JSON.stringify(counts, null, 2));
  if (results.some((row) => row.status === "failed")) process.exit(1);
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  await main();
}
