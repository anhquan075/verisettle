import { Contract, JsonRpcProvider, getAddress, keccak256 } from "ethers";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = "/home/ubuntu/verisettle";
const deploymentDirectory = resolve(projectRoot, "contracts/deployments");
const manifestPath = resolve(deploymentDirectory, "v2-governed-policy-cc3-testnet.json");
const verificationPath = resolve(deploymentDirectory, "v2-governed-policy-cc3-testnet.verification.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const sourceProvider = new JsonRpcProvider(manifest.network.source.rpc);
const settlementProvider = new JsonRpcProvider(manifest.network.settlement.rpc);
const sourceAbi = ["function policyHash() view returns (bytes32)"];
const multisigAbi = [
  "function threshold() view returns (uint8)",
  "function signerCount() view returns (uint8)",
  "function isSigner(address) view returns (bool)",
];
const escrowAbi = [
  "function policyHash() view returns (bytes32)",
  "function sourceContract() view returns (address)",
  "function sourceChainKey() view returns (uint64)",
  "function acceptanceWindowSeconds() view returns (uint64)",
  "function refundWindowSeconds() view returns (uint64)",
  "function disputeGovernance() view returns (address)",
];

const source = new Contract(manifest.source.address, sourceAbi, sourceProvider);
const multisig = new Contract(manifest.governance.contract, multisigAbi, settlementProvider);
const escrow = new Contract(manifest.escrowAsc.address, escrowAbi, settlementProvider);
const [sourceNetwork, settlementNetwork, sourceCode, multisigCode, escrowCode, sourcePolicyHash, threshold, signerCount, escrowPolicyHash, escrowSource, escrowSourceChainKey, acceptanceWindow, refundWindow, disputeGovernance, ...signerChecks] = await Promise.all([
  sourceProvider.getNetwork(),
  settlementProvider.getNetwork(),
  sourceProvider.getCode(manifest.source.address),
  settlementProvider.getCode(manifest.governance.contract),
  settlementProvider.getCode(manifest.escrowAsc.address),
  source.policyHash(),
  multisig.threshold(),
  multisig.signerCount(),
  escrow.policyHash(),
  escrow.sourceContract(),
  escrow.sourceChainKey(),
  escrow.acceptanceWindowSeconds(),
  escrow.refundWindowSeconds(),
  escrow.disputeGovernance(),
  ...manifest.governance.signers.map(signer => multisig.isSigner(signer)),
]);

const checks = {
  sourceChainId: Number(sourceNetwork.chainId) === manifest.network.source.chainId,
  settlementChainId: Number(settlementNetwork.chainId) === manifest.network.settlement.chainId,
  sourceRuntimeCodeHash: sourceCode !== "0x" && keccak256(sourceCode) === manifest.source.runtimeCodeHash,
  multisigRuntimeCodeHash: multisigCode !== "0x" && keccak256(multisigCode) === manifest.governance.runtimeCodeHash,
  escrowRuntimeCodeHash: escrowCode !== "0x" && keccak256(escrowCode) === manifest.escrowAsc.runtimeCodeHash,
  sourcePolicyHash: sourcePolicyHash === manifest.policyHash,
  multisigThreshold: Number(threshold) === manifest.governance.threshold,
  multisigSignerCount: Number(signerCount) === manifest.governance.signerCount,
  multisigSigners: signerChecks.every(Boolean),
  escrowPolicyHash: escrowPolicyHash === manifest.policyHash,
  escrowSource: getAddress(escrowSource) === getAddress(manifest.source.address),
  escrowSourceChainKey: Number(escrowSourceChainKey) === manifest.policy.sourceChainKey,
  escrowAcceptanceWindowSeconds: Number(acceptanceWindow) === manifest.policy.acceptanceWindowSeconds,
  escrowRefundWindowSeconds: Number(refundWindow) === manifest.policy.refundWindowSeconds,
  escrowDisputeGovernance: getAddress(disputeGovernance) === getAddress(manifest.governance.contract),
};
const verified = Object.values(checks).every(Boolean);
const result = {
  manifestVersion: manifest.manifestVersion,
  policyKind: manifest.policyKind,
  policyHash: manifest.policyHash,
  verified,
  verifiedAt: new Date().toISOString(),
  checks,
  source: { address: manifest.source.address, runtimeCodeHash: keccak256(sourceCode), policyHash: sourcePolicyHash },
  governance: {
    contract: manifest.governance.contract,
    runtimeCodeHash: keccak256(multisigCode),
    threshold: Number(threshold),
    signerCount: Number(signerCount),
    signerChecks: manifest.governance.signers.map((address, index) => ({ address, isSigner: signerChecks[index] })),
  },
  escrowAsc: {
    address: manifest.escrowAsc.address,
    runtimeCodeHash: keccak256(escrowCode),
    policyHash: escrowPolicyHash,
    source: escrowSource,
    disputeGovernance,
  },
};
writeFileSync(verificationPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (!verified) process.exitCode = 1;
