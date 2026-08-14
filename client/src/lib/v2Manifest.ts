import { Contract, JsonRpcProvider, getAddress, keccak256 } from "ethers";
import { TESTNET_NETWORKS } from "@shared/contracts";
import { V2_POLICY_MANIFEST, v2EscrowAbi, v2SourceAbi } from "@shared/v2PolicyManifest";

export type V2ManifestVerification = {
  verified: boolean;
  checkedAt: Date;
  checks: Record<string, boolean>;
  error?: string;
};

export async function verifyV2PolicyManifest(): Promise<V2ManifestVerification> {
  const checkedAt = new Date();
  try {
    const sourceProvider = new JsonRpcProvider(TESTNET_NETWORKS.sepolia.rpcUrl);
    const settlementProvider = new JsonRpcProvider(TESTNET_NETWORKS.creditcoin.rpcUrl);
    const source = new Contract(V2_POLICY_MANIFEST.source.address, v2SourceAbi, sourceProvider);
    const escrow = new Contract(V2_POLICY_MANIFEST.escrowAsc.address, v2EscrowAbi, settlementProvider);
    const [sourceCode, escrowCode, sourcePolicyHash, sourceWindow, escrowPolicyHash, escrowSource, escrowChainKey, escrowWindow, escrowRefundWindow] = await Promise.all([
      sourceProvider.getCode(V2_POLICY_MANIFEST.source.address),
      settlementProvider.getCode(V2_POLICY_MANIFEST.escrowAsc.address),
      source.policyHash(),
      source.acceptanceWindowSeconds(),
      escrow.policyHash(),
      escrow.sourceContract(),
      escrow.sourceChainKey(),
      escrow.acceptanceWindowSeconds(),
      escrow.refundWindowSeconds(),
    ]);
    const checks = {
      sourceRuntimeCodeHash: sourceCode !== "0x" && keccak256(sourceCode) === V2_POLICY_MANIFEST.source.runtimeCodeHash,
      escrowRuntimeCodeHash: escrowCode !== "0x" && keccak256(escrowCode) === V2_POLICY_MANIFEST.escrowAsc.runtimeCodeHash,
      sourcePolicyHash: sourcePolicyHash === V2_POLICY_MANIFEST.policyHash,
      sourceAcceptanceWindow: Number(sourceWindow) === V2_POLICY_MANIFEST.policy.acceptanceWindowSeconds,
      escrowPolicyHash: escrowPolicyHash === V2_POLICY_MANIFEST.policyHash,
      escrowSource: getAddress(escrowSource) === getAddress(V2_POLICY_MANIFEST.source.address),
      escrowSourceChain: Number(escrowChainKey) === V2_POLICY_MANIFEST.policy.sourceChainKey,
      escrowAcceptanceWindow: Number(escrowWindow) === V2_POLICY_MANIFEST.policy.acceptanceWindowSeconds,
      escrowRefundWindow: Number(escrowRefundWindow) === V2_POLICY_MANIFEST.policy.refundWindowSeconds,
    };
    return { verified: Object.values(checks).every(Boolean), checkedAt, checks };
  } catch {
    return { verified: false, checkedAt, checks: {}, error: "Unable to verify the V2 deployment manifest from public testnet RPCs." };
  }
}
