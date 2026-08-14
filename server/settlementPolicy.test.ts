import { describe, expect, it } from "vitest";
import { buildV2PolicyDraft, toV2PolicyHash, toV2TermsCommitmentHash, V2_POLICY_DEFAULTS } from "../shared/settlementPolicy";

const basePolicy = buildV2PolicyDraft();
const baseTerms = {
  policyHash: basePolicy.policyHash,
  orderId: "v2_policy_order_001",
  buyerAddress: "0xc7774720D1C14B9dA1c656b796a2a092D0b9D1c9",
  sellerAddress: "0x1111111111111111111111111111111111111111",
  assetKind: "tCTC",
  amount: "0.01",
  acceptanceExpiresAt: new Date("2026-09-01T00:00:00.000Z"),
  refundWindowSeconds: V2_POLICY_DEFAULTS.refundWindowSeconds,
  commercialDescription: "VeriSettle V2 policy acceptance milestone",
};

describe("V2 settlement policy commitments", () => {
  it("is deterministic for the same policy and order terms", () => {
    expect(toV2PolicyHash(basePolicy)).toBe(toV2PolicyHash({ ...basePolicy }));
    expect(toV2TermsCommitmentHash(baseTerms)).toBe(toV2TermsCommitmentHash({ ...baseTerms }));
  });

  it.each([
    ["confirmation threshold", { minimumSourceConfirmations: 24 }],
    ["acceptance window", { acceptanceWindowSeconds: 86_400 }],
    ["refund window", { refundWindowSeconds: 4_320_000 }],
    ["source contract", { sourceContract: "0x1111111111111111111111111111111111111111" }],
  ])("changes the policy hash when the %s changes", (_label, change) => {
    expect(toV2PolicyHash({ ...basePolicy, ...change })).not.toBe(basePolicy.policyHash);
  });

  it.each([
    ["policy hash", { policyHash: "0x" + "11".repeat(32) }],
    ["order ID", { orderId: "v2_policy_order_002" }],
    ["expiry", { acceptanceExpiresAt: new Date("2026-09-02T00:00:00.000Z") }],
    ["amount", { amount: "0.02" }],
    ["description", { commercialDescription: "A changed commercial commitment" }],
  ])("changes the order commitment when the %s changes", (_label, change) => {
    expect(toV2TermsCommitmentHash({ ...baseTerms, ...change })).not.toBe(toV2TermsCommitmentHash(baseTerms));
  });
});
