export const dealStatusValues = [
  "draft",
  "funded",
  "proof_pending",
  "released",
  "refunded",
  "disputed",
] as const;

export type DealStatus = (typeof dealStatusValues)[number];

export const dealStatusLabels: Record<DealStatus, string> = {
  draft: "Draft",
  funded: "Funded",
  proof_pending: "ProofPending",
  released: "Released",
  refunded: "Refunded",
  disputed: "Disputed",
};

export const dealEventTypeValues = [
  "created",
  "funded",
  "proof_submitted",
  "proof_verified",
  "proof_rejected",
  "released",
  "refunded",
  "disputed",
  "replay_rejected",
] as const;

export type DealEventType = (typeof dealEventTypeValues)[number];

export const REPLAY_PROTECTION_ERROR =
  "Replay rejected: this Sepolia transaction has already been processed for settlement.";

export function isTerminalDealStatus(status: DealStatus): boolean {
  return status === "released" || status === "refunded" || status === "disputed";
}
