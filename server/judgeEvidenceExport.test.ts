import { describe, expect, it } from "vitest";
import { buildJudgeEvidenceMarkdown } from "../client/src/components/JudgeEvidenceExport";
import { REPLAY_PROTECTION_ERROR } from "../shared/deals";

describe("judge evidence export", () => {
  it("exports real-format terms, chronological immutable events, public receipts, and the replay boundary without sensitive material", () => {
    const markdown = buildJudgeEvidenceMarkdown({
      deal: {
        orderId: "order_real_testnet",
        status: "released",
        buyerAddress: "0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620",
        sellerAddress: "0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA",
        amount: "0.01",
        currency: "tCTC",
        description: "Verified delivery acceptance",
        sepoliaSourceTxHash: "0xsource",
        fundingTxHash: "0xfunding",
        settlementTxHash: "0xsettlement",
        proofPolicyNonce: "policy-nonce",
        createdAt: new Date("2026-08-14T00:00:00.000Z"),
      },
      events: [
        { sequence: 2, type: "released", title: "Released", detail: "CC3 receipt decoded.", txHash: "0xsettlement", createdAt: new Date("2026-08-14T00:02:00.000Z") },
        { sequence: 1, type: "proof_submitted", title: "Source accepted", detail: "Sepolia receipt decoded.", txHash: "0xsource", createdAt: new Date("2026-08-14T00:01:00.000Z") },
      ],
      termsHash: "0xterms",
      replayVerified: true,
    });

    expect(markdown).toContain("VeriSettle Judge Evidence Bundle");
    expect(markdown).toContain("0xterms");
    expect(markdown).toContain("0xsource");
    expect(markdown).toContain("0xfunding");
    expect(markdown).toContain("0xsettlement");
    expect(markdown.indexOf("#1 · **Source accepted**")).toBeLessThan(markdown.indexOf("#2 · **Released**"));
    expect(markdown).toContain(REPLAY_PROTECTION_ERROR);
    expect(markdown).toContain("private keys, seed phrases, passwords");
  });
});
