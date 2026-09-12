import { describe, expect, it } from "vitest";
import { describeAttestationReadiness, type AttestationReadiness } from "../shared/chainInfo";
import { assertLifecycleEvidence } from "../shared/evidenceSchema";
import { FEATURED_JUDGE_EVIDENCE, SECONDARY_JUDGE_EVIDENCE } from "../shared/judgeEvidence";

function readiness(partial: Partial<AttestationReadiness>): AttestationReadiness {
  return {
    status: "waiting",
    chainKey: 1,
    chainId: 11155111,
    chainName: "Ethereum Sepolia",
    sourceBlockNumber: 10,
    attestedHeight: 8,
    attestedHash: null,
    message: "",
    ...partial,
  };
}

describe("ChainInfo copy and evidence schema", () => {
  it("describes waiting and attested states without claiming physical delivery", () => {
    expect(describeAttestationReadiness(readiness({ status: "waiting" }))).toContain("Waiting for Attestcoin");
    expect(describeAttestationReadiness(readiness({ status: "attested", attestedHeight: 12, sourceBlockNumber: 10 }))).toContain("attested");
  });

  it("rejects two-wallet evidence that is actually a self-deal", () => {
    expect(() => assertLifecycleEvidence({
      schemaVersion: 1,
      kind: "two-wallet-lifecycle",
      purpose: "x",
      policyVersion: "v1_live",
      distinctWallets: true,
      orderId: "1",
      buyer: "0xabc",
      seller: "0xABC",
      explorer: {},
      startedAt: new Date().toISOString(),
    })).toThrow(/same buyer and seller/i);
  });

  it("features distinct buyer and seller on the public judge pack", () => {
    expect(FEATURED_JUDGE_EVIDENCE.distinctWallets).toBe(true);
    expect(FEATURED_JUDGE_EVIDENCE.buyer.toLowerCase()).not.toBe(FEATURED_JUDGE_EVIDENCE.seller.toLowerCase());
    expect(SECONDARY_JUDGE_EVIDENCE.distinctWallets).toBe(false);
  });
});
