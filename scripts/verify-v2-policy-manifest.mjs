import { Contract, JsonRpcProvider, getAddress, keccak256 } from "ethers";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = "/home/ubuntu/verisettle";
const deploymentPath = resolve(projectRoot, "contracts/deployments/v2-policy-cc3-testnet.json");
const verificationPath = resolve(projectRoot, "contracts/deployments/v2-policy-cc3-testnet.verification.json");
const manifest = JSON.parse(readFileSync(deploymentPath, "utf8"));
const sourceProvider = new JsonRpcProvider(manifest.network.source.rpc);
const settlementProvider = new JsonRpcProvider(manifest.network.settlement.rpc);

const sourceAbi = ["function policyHash() view returns (bytes32)", "function acceptanceWindowSeconds() view returns (uint64)"];
const escrowAbi = [
  "function policyHash() view returns (bytes32)",
  "function sourceContract() view returns (address)",
  "function sourceChainKey() view returns (uint64)",
  "function acceptanceWindowSeconds() view returns (uint64)",
  "function refundWindowSeconds() view returns (uint64)",
];

const source = new Contract(manifest.source.address, sourceAbi, sourceProvider);
const escrow = new Contract(manifest.escrowAsc.address, escrowAbi, settlementProvider);
const [sourceCode, escrowCode, decoderCode, sourcePolicyHash, sourceWindow, escrowPolicyHash, escrowSource, escrowChainKey, escrowWindow, escrowRefundWindow] = await Promise.all([
  sourceProvider.getCode(manifest.source.address),
  settlementProvider.getCode(manifest.escrowAsc.address),
  settlementProvider.getCode(manifest.decoderLibrary.address),
  source.policyHash(),
  source.acceptanceWindowSeconds(),
  escrow.policyHash(),
  escrow.sourceContract(),
  escrow.sourceChainKey(),
  escrow.acceptanceWindowSeconds(),
  escrow.refundWindowSeconds(),
]);

if (sourceCode === "0x" || escrowCode === "0x" || decoderCode === "0x") throw new Error("A recorded V2 deployment address has no runtime code.");
const checks = {
  sourceRuntimeCodeHash: keccak256(sourceCode) === manifest.source.runtimeCodeHash,
  escrowRuntimeCodeHash: keccak256(escrowCode) === manifest.escrowAsc.runtimeCodeHash,
  decoderRuntimeCodeHash: keccak256(decoderCode) === manifest.decoderLibrary.runtimeCodeHash,
  sourcePolicyHash: sourcePolicyHash === manifest.policyHash,
  sourceAcceptanceWindowSeconds: Number(sourceWindow) === manifest.policy.acceptanceWindowSeconds,
  escrowPolicyHash: escrowPolicyHash === manifest.policyHash,
  escrowSource: getAddress(escrowSource) === getAddress(manifest.source.address),
  escrowSourceChainKey: Number(escrowChainKey) === manifest.policy.sourceChainKey,
  escrowAcceptanceWindowSeconds: Number(escrowWindow) === manifest.policy.acceptanceWindowSeconds,
  escrowRefundWindowSeconds: Number(escrowRefundWindow) === manifest.policy.refundWindowSeconds,
};
if (Object.values(checks).some(result => !result)) {
  throw new Error(`V2 manifest integrity verification failed: ${JSON.stringify(checks)}`);
}

const verification = {
  manifestVersion: manifest.manifestVersion,
  policyHash: manifest.policyHash,
  verifiedAt: new Date().toISOString(),
  checks,
  source: { address: manifest.source.address, runtimeCodeHash: keccak256(sourceCode), policyHash: sourcePolicyHash },
  escrowAsc: { address: manifest.escrowAsc.address, runtimeCodeHash: keccak256(escrowCode), policyHash: escrowPolicyHash },
};
writeFileSync(verificationPath, JSON.stringify(verification, null, 2));
console.log(JSON.stringify(verification, null, 2));
