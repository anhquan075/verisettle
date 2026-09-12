export const EVIDENCE_SCHEMA_VERSION = 1;

export type EvidenceKind =
  | "two-wallet-lifecycle"
  | "v2-lifecycle-positive"
  | "v2-lifecycle-negative"
  | "worker-relayer"
  | "template";

export type EvidenceExplorerLinks = {
  funding?: string;
  acceptance?: string;
  release?: string;
  replay?: string;
};

export type LifecycleEvidence = {
  schemaVersion: typeof EVIDENCE_SCHEMA_VERSION;
  kind: EvidenceKind;
  purpose: string;
  policyVersion: "v1_live" | "v2_deployed" | "v2_governed";
  distinctWallets: boolean;
  orderId: string;
  buyer: string;
  seller: string;
  amount?: string;
  sourceContract?: string;
  escrowAsc?: string;
  funding?: { txHash: string; blockNumber: number | null };
  acceptance?: { txHash: string; blockNumber: number | null };
  release?: { txHash: string; blockNumber: number | null; event?: string };
  replayRejection?: string | null;
  negative?: { expectedError: string; observedError: string };
  explorer: EvidenceExplorerLinks;
  note?: string;
  startedAt: string;
  completedAt?: string;
};

export function assertLifecycleEvidence(value: unknown): asserts value is LifecycleEvidence {
  const record = value as LifecycleEvidence;
  if (!record || record.schemaVersion !== EVIDENCE_SCHEMA_VERSION) {
    throw new Error("Evidence JSON is missing schemaVersion 1.");
  }
  if (!record.kind || !record.orderId || !record.buyer || !record.seller) {
    throw new Error("Evidence JSON is missing required identity fields.");
  }
  if (record.distinctWallets && record.buyer.toLowerCase() === record.seller.toLowerCase()) {
    throw new Error("Two-wallet evidence cannot use the same buyer and seller address.");
  }
}
