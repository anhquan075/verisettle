import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { describeAttestationReadiness, type AttestationReadiness } from "../shared/chainInfo";
import { assertLifecycleEvidence } from "../shared/evidenceSchema";
import { FEATURED_JUDGE_EVIDENCE, SECONDARY_JUDGE_EVIDENCE, TWO_WALLET_V2_EVIDENCE } from "../shared/judgeEvidence";

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
    expect(FEATURED_JUDGE_EVIDENCE.orderId).toBe("0xf0a16e834330693f346da92251a5b6abee36c0c9923c820f03f54419b7bdd0e5");
    expect(FEATURED_JUDGE_EVIDENCE.evidenceFile).toBe("contracts/test-runs/two-wallet-f0a16e83.json");
    expect(TWO_WALLET_V2_EVIDENCE.distinctWallets).toBe(true);
    expect(TWO_WALLET_V2_EVIDENCE.evidenceFile).toBe("contracts/test-runs/v2-two-wallet-38e0f2e2.json");
    expect(SECONDARY_JUDGE_EVIDENCE.distinctWallets).toBe(false);

    const v2Pack = JSON.parse(readFileSync(new URL("../contracts/test-runs/v2-two-wallet-38e0f2e2.json", import.meta.url), "utf-8"));
    expect(v2Pack.buyerEqualsSeller).toBe(false);
    expect(v2Pack.policyVersion).toBe(2);
    expect(v2Pack.policyHash).toBe("0xf951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f28976");
    expect(v2Pack.orderId).toBe(TWO_WALLET_V2_EVIDENCE.orderId);
    expect(v2Pack.finalStatusName).toBe("Released");
    expect(v2Pack.replayRejection).toBe("QueryAlreadyProcessed");
    expect(v2Pack.sourceContract).toBe("0x56e6d3E213141AA8285D0b12504bDa5dA260aa18");
    expect(v2Pack.escrowAsc).toBe("0x185c81ED5a757d1e290BaBa55F051f3cE791D641");
  });

  it("keeps public copy on the three canonical URLs and records CC3 verification", () => {
    const readme = readFileSync(new URL("../README.md", import.meta.url), "utf-8");
    const dora = readFileSync(new URL("../docs/DORA_COPY.md", import.meta.url), "utf-8");
    const attempt = JSON.parse(readFileSync(new URL("../contracts/deployments/verification-attempt.json", import.meta.url), "utf-8"));
    expect(readme).toContain("https://verisettle.vercel.app");
    expect(readme).toContain("https://verisettle.vercel.app/judge");
    expect(readme).toContain("https://github.com/anhquan075/verisettle");
    expect(readme).not.toContain("verisettle-testnet");
    expect(dora).toContain("https://verisettle.vercel.app/judge");
    expect(dora).not.toContain("verisettle-testnet");
    expect(dora).toContain("contracts/test-runs/two-wallet-f0a16e83.json");
    expect(dora).toContain("contracts/test-runs/v2-two-wallet-38e0f2e2.json");
    const cc3 = attempt.results.filter((row: { chainId: number }) => row.chainId === 102031);
    expect(cc3).toHaveLength(4);
    expect(cc3.every((row: { explorerVerified: boolean }) => row.explorerVerified)).toBe(true);
  });
});
