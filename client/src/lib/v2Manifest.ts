import { Contract, JsonRpcProvider, getAddress, keccak256 } from "ethers";
import { TESTNET_NETWORKS } from "@shared/contracts";
import { V2_GOVERNED_POLICY_MANIFEST, V2_POLICY_MANIFEST, v2EscrowAbi, v2GovernanceAbi, v2SourceAbi } from "@shared/v2PolicyManifest";

export type ManifestPolicyKind = "v2_deployed" | "v2_governed";

export type V2ManifestVerification = {
  verified: boolean;
  checkedAt: Date;
  checks: Record<string, boolean>;
  error?: string;
};

export async function verifyV2PolicyManifest(policyKind: ManifestPolicyKind = "v2_deployed"): Promise<V2ManifestVerification> {
  const checkedAt = new Date();
  try {
    const governedManifest = policyKind === "v2_governed" ? V2_GOVERNED_POLICY_MANIFEST : null;
    const manifest = governedManifest ?? V2_POLICY_MANIFEST;
    const sourceProvider = new JsonRpcProvider(TESTNET_NETWORKS.sepolia.rpcUrl);
    const settlementProvider = new JsonRpcProvider(TESTNET_NETWORKS.creditcoin.rpcUrl);
    const source = new Contract(manifest.source.address, v2SourceAbi, sourceProvider);
    const escrow = new Contract(manifest.escrowAsc.address, v2EscrowAbi, settlementProvider);
    const governance = governedManifest ? new Contract(governedManifest.governance.address, v2GovernanceAbi, settlementProvider) : null;
    const [sourceCode, escrowCode, sourcePolicyHash, sourceWindow, escrowPolicyHash, escrowSource, escrowChainKey, escrowWindow, escrowRefundWindow, disputeGovernance, governanceCode, threshold, signerCount, ...signerChecks] = await Promise.all([
      sourceProvider.getCode(manifest.source.address),
      settlementProvider.getCode(manifest.escrowAsc.address),
      source.policyHash(),
      source.acceptanceWindowSeconds(),
      escrow.policyHash(),
      escrow.sourceContract(),
      escrow.sourceChainKey(),
      escrow.acceptanceWindowSeconds(),
      escrow.refundWindowSeconds(),
      governedManifest ? escrow.disputeGovernance() : Promise.resolve(undefined),
      governedManifest ? settlementProvider.getCode(governedManifest.governance.address) : Promise.resolve(undefined),
      governance ? governance.threshold() : Promise.resolve(undefined),
      governance ? governance.signerCount() : Promise.resolve(undefined),
      ...(governance ? governedManifest!.governance.signers.map(signer => governance.isSigner(signer)) : []),
    ]);
    const checks = {
      sourceRuntimeCodeHash: sourceCode !== "0x" && keccak256(sourceCode) === manifest.source.runtimeCodeHash,
      escrowRuntimeCodeHash: escrowCode !== "0x" && keccak256(escrowCode) === manifest.escrowAsc.runtimeCodeHash,
      sourcePolicyHash: sourcePolicyHash === manifest.policyHash,
      sourceAcceptanceWindow: Number(sourceWindow) === manifest.policy.acceptanceWindowSeconds,
      escrowPolicyHash: escrowPolicyHash === manifest.policyHash,
      escrowSource: getAddress(escrowSource) === getAddress(manifest.source.address),
      escrowSourceChain: Number(escrowChainKey) === manifest.policy.sourceChainKey,
      escrowAcceptanceWindow: Number(escrowWindow) === manifest.policy.acceptanceWindowSeconds,
      escrowRefundWindow: Number(escrowRefundWindow) === manifest.policy.refundWindowSeconds,
      ...(governedManifest ? {
        governanceRuntimeCodeHash: governanceCode !== "0x" && keccak256(governanceCode!) === governedManifest.governance.runtimeCodeHash,
        governanceThreshold: Number(threshold) === governedManifest.governance.threshold,
        governanceSignerCount: Number(signerCount) === governedManifest.governance.signerCount,
        governanceSigners: signerChecks.every(Boolean),
        escrowGovernance: getAddress(disputeGovernance!) === getAddress(governedManifest.governance.address),
      } : {}),
    };
    return { verified: Object.values(checks).every(Boolean), checkedAt, checks };
  } catch {
    return { verified: false, checkedAt, checks: {}, error: "Unable to verify the V2 deployment manifest from public testnet RPCs." };
  }
}
