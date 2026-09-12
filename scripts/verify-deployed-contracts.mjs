#!/usr/bin/env node
/**
 * Attempt explorer verification for live Sepolia sources and CC3 ASCs/multisig.
 * Requires ETHERSCAN_API_KEY and/or BLOCKSCOUT_API_KEY. Records results under
 * contracts/deployments/verification-attempt.json. Never prints secrets.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { V2_POLICY, VERISETTLE_CONTRACTS } from "./config.mjs";

const projectRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const etherscanKey = process.env.ETHERSCAN_API_KEY?.trim();
const blockscoutKey = process.env.BLOCKSCOUT_API_KEY?.trim();

const targets = [
  {
    name: "VeriSettleSource V1",
    address: VERISETTLE_CONTRACTS.source,
    contract: "contracts/VeriSettleSource.sol:VeriSettleSource",
    chainId: 11155111,
    verifier: "etherscan",
    constructorArgs: "",
  },
  {
    name: "VeriSettleSourceV2",
    address: V2_POLICY.source,
    contract: "contracts/VeriSettleSourceV2.sol:VeriSettleSourceV2",
    chainId: 11155111,
    verifier: "etherscan",
    constructorArgs: "",
    note: "Requires the deployed policyHash and acceptanceWindowSeconds ABI-encoded constructor args. See docs/VERIFY_CONTRACTS.md.",
  },
  {
    name: "VeriSettleEscrowASC V1",
    address: VERISETTLE_CONTRACTS.escrowAsc,
    contract: "contracts/VeriSettleEscrowASC.sol:VeriSettleEscrowASC",
    chainId: 102031,
    verifier: "blockscout",
    verifierUrl: "https://creditcoin-testnet.blockscout.com/api/",
  },
  {
    name: "VeriSettleEscrowASCV2",
    address: V2_POLICY.escrowAsc,
    contract: "contracts/VeriSettleEscrowASCV2.sol:VeriSettleEscrowASCV2",
    chainId: 102031,
    verifier: "blockscout",
    verifierUrl: "https://creditcoin-testnet.blockscout.com/api/",
  },
  {
    name: "VeriSettleDisputeMultisig V3",
    address: "0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849",
    contract: "contracts/VeriSettleDisputeMultisig.sol:VeriSettleDisputeMultisig",
    chainId: 102031,
    verifier: "blockscout",
    verifierUrl: "https://creditcoin-testnet.blockscout.com/api/",
  },
  {
    name: "VeriSettleEscrowASCV2Governed V3",
    address: "0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7",
    contract: "contracts/VeriSettleEscrowASCV2Governed.sol:VeriSettleEscrowASCV2Governed",
    chainId: 102031,
    verifier: "blockscout",
    verifierUrl: "https://creditcoin-testnet.blockscout.com/api/",
  },
];

function verifyCommand(target) {
  const args = [
    "verify-contract",
    "--chain-id",
    String(target.chainId),
    "--compiler-version",
    "0.8.23",
    "--optimizer-runs",
    "200",
    "--watch",
    target.address,
    target.contract,
  ];
  if (target.verifier === "blockscout") {
    args.push("--verifier", "blockscout", "--verifier-url", target.verifierUrl);
  } else {
    args.push("--etherscan-api-key", "$ETHERSCAN_API_KEY");
  }
  return `forge ${args.join(" ")}`;
}

const results = [];
for (const target of targets) {
  const documented = verifyCommand(target);
  const skip =
    (target.verifier === "etherscan" && !etherscanKey) ||
    (target.verifier === "blockscout" && !blockscoutKey && !process.env.VERIFY_BLOCKSCOUT_WITHOUT_KEY);
  if (skip) {
    results.push({ name: target.name, address: target.address, status: "skipped", reason: "API key not present", command: documented });
    continue;
  }
  const args = [
    "verify-contract",
    "--chain-id",
    String(target.chainId),
    "--compiler-version",
    "0.8.23",
    "--optimizer-runs",
    "200",
    target.address,
    target.contract,
  ];
  if (target.verifier === "blockscout") {
    args.push("--verifier", "blockscout", "--verifier-url", target.verifierUrl);
  } else {
    args.push("--etherscan-api-key", etherscanKey);
  }
  const ran = spawnSync("forge", args, { cwd: projectRoot, encoding: "utf8" });
  results.push({
    name: target.name,
    address: target.address,
    status: ran.status === 0 ? "submitted" : "failed",
    exitCode: ran.status,
    stdout: (ran.stdout ?? "").slice(0, 2000),
    stderr: (ran.stderr ?? "").slice(0, 2000),
    command: documented,
    note: target.note,
  });
}

const report = {
  attemptedAt: new Date().toISOString(),
  etherscanKeyPresent: Boolean(etherscanKey),
  blockscoutKeyPresent: Boolean(blockscoutKey),
  results,
};
const out = resolve(projectRoot, "contracts/deployments/verification-attempt.json");
writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath: out, skipped: results.filter((row) => row.status === "skipped").length, submitted: results.filter((row) => row.status === "submitted").length, failed: results.filter((row) => row.status === "failed").length }, null, 2));
if (!etherscanKey && !blockscoutKey) process.exit(2);
