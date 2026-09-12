import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JudgeEvidencePackCard } from "../client/src/components/JudgeEvidencePackCard";
import { JudgeForJudgesStrip } from "../client/src/components/JudgeForJudgesStrip";
import { JudgeProofRoute } from "../client/src/components/JudgeProofRoute";
import {
  CC3_VERIFIED_CONTRACTS,
  FEATURED_JUDGE_EVIDENCE,
  TWO_WALLET_V2_EVIDENCE,
  describeJudgeEvidenceView,
  judgeHashPreview,
} from "../shared/judgeEvidence";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf-8");
}

const UI_COPY_FILES = [
  "../client/src/pages/Home.tsx",
  "../client/src/pages/JudgeEvidence.tsx",
  "../client/src/pages/ProtocolReference.tsx",
  "../client/src/pages/DealDetail.tsx",
  "../client/src/components/JudgeProofRoute.tsx",
  "../client/src/components/JudgeEvidencePackCard.tsx",
  "../client/src/components/JudgeForJudgesStrip.tsx",
  "../client/src/components/WalletFirstLaunchpad.tsx",
  "../client/src/components/JudgeEvidenceExport.tsx",
  "../client/src/lib/sessionExpiry.ts",
  "../client/index.html",
] as const;

describe("judge evidence page contract", () => {
  const home = source("../client/src/pages/Home.tsx");
  const judgePage = source("../client/src/pages/JudgeEvidence.tsx");
  const judgeRoute = source("../client/src/components/JudgeProofRoute.tsx");
  const html = source("../client/index.html");

  it("makes two-wallet V1 and V2 receipts, replay, and verified CC3 contracts unmissable", () => {
    expect(judgeRoute).toContain("FEATURED_JUDGE_EVIDENCE");
    expect(judgeRoute).toContain("TWO_WALLET_V2_EVIDENCE");
    expect(judgeRoute).toContain("QueryAlreadyProcessed");
    expect(judgeRoute).toContain("CC3_VERIFIED_CONTRACTS");
    expect(judgePage).toContain("JudgeForJudgesStrip");
    expect(judgePage).toContain("Attestcoin verifies the acceptance receipt, NOT physical delivery.");
    expect(FEATURED_JUDGE_EVIDENCE.replayRejection).toBe("QueryAlreadyProcessed");
    expect(TWO_WALLET_V2_EVIDENCE.replayRejection).toBe("QueryAlreadyProcessed");
    expect(judgeHashPreview(FEATURED_JUDGE_EVIDENCE.receipts[0].hash)).toBe("0x804d1c26…");
    expect(judgeHashPreview(FEATURED_JUDGE_EVIDENCE.receipts[1].hash)).toBe("0x71970aa7…");
    expect(judgeHashPreview(FEATURED_JUDGE_EVIDENCE.receipts[2].hash)).toBe("0x100f44bf…");
    expect(judgeHashPreview(TWO_WALLET_V2_EVIDENCE.receipts[0].hash)).toBe("0xe104db9b…");
    expect(judgeHashPreview(TWO_WALLET_V2_EVIDENCE.receipts[1].hash)).toBe("0x771d35f7…");
    expect(judgeHashPreview(TWO_WALLET_V2_EVIDENCE.receipts[2].hash)).toBe("0xd3b47603…");
    expect(CC3_VERIFIED_CONTRACTS).toHaveLength(4);

    const cockpit = renderToStaticMarkup(createElement(JudgeProofRoute));
    expect(cockpit).toContain("0xe3565A1A1B947f363ab433889522267cE3D4736F");
    expect(cockpit).toContain("0x185c81ED5a757d1e290BaBa55F051f3cE791D641");
    expect(cockpit).toContain("0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849");
    expect(cockpit).toContain("0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7");
    expect(cockpit).toContain("0x804d1c26");
    expect(cockpit).toContain("0xe104db9b");
    expect(cockpit).toContain("QueryAlreadyProcessed");
    expect(cockpit).toContain("Buyer");
    expect(cockpit).toContain("Seller");
  });

  it("keeps Home on the judge path with a first-viewport proof-first hero", () => {
    expect(home).toContain("Proof first.");
    expect(home).toContain("Release once.");
    expect(home).toContain("Judge evidence");
    expect(home).toContain("Open workspace");
    expect(home).toContain('setLocation("/judge")');
    expect(home).toContain('setLocation("/app")');
    expect(home).toContain("veri-live-route");
    expect(home).toContain("01 · Source");
    expect(home).toContain("02 · Verify");
    expect(home).toContain("03 · Settle");
    expect(home).not.toContain("Judge proof");
    expect(home).not.toContain("New order");
    expect(home).not.toContain("delivery proof");
    expect(home).not.toContain("Sparkles");
  });

  it("uses Geist + Geist Mono instead of Inter-as-default", () => {
    expect(html).toContain("family=Geist");
    expect(html).toContain("family=Geist+Mono");
    expect(html).not.toContain("Instrument+Sans");
    expect(html).not.toContain("family=Inter");
  });

  it("renders loading, empty, and missing-file states for judge packs", () => {
    expect(describeJudgeEvidenceView({ loading: true })).toEqual({ status: "loading" });
    expect(describeJudgeEvidenceView({ pack: null })).toMatchObject({ status: "empty" });
    expect(describeJudgeEvidenceView({ pack: FEATURED_JUDGE_EVIDENCE, fileMissing: true }).status).toBe("error");

    const loading = renderToStaticMarkup(createElement(JudgeEvidencePackCard, { view: { status: "loading" } }));
    expect(loading).toContain('role="status"');
    expect(loading).toContain("Loading evidence file");

    const empty = renderToStaticMarkup(createElement(JudgeEvidencePackCard, { view: { status: "empty", message: "No featured evidence pack is bound." } }));
    expect(empty).toContain('role="status"');
    expect(empty).toContain("No featured evidence pack is bound.");

    const missing = renderToStaticMarkup(createElement(JudgeEvidencePackCard, { view: { status: "error", message: "Evidence file missing: contracts/test-runs/two-wallet-f0a16e83.json" } }));
    expect(missing).toContain('role="alert"');
    expect(missing).toContain("Evidence file missing");

    const ready = renderToStaticMarkup(createElement(JudgeEvidencePackCard, { view: { status: "ready", pack: FEATURED_JUDGE_EVIDENCE } }));
    expect(ready).toContain("Buyer");
    expect(ready).toContain("Seller");
    expect(ready).toContain("0x804d1c26");
    expect(ready).toContain("QueryAlreadyProcessed");
    expect(ready).toContain("0xABe59F75");
    expect(ready).toContain("0x26321500");
  });

  it("renders the sticky For judges strip with live app, GitHub, evidence, and explorers", () => {
    const strip = renderToStaticMarkup(createElement(JudgeForJudgesStrip));
    expect(strip).toContain('id="judge-actions"');
    expect(strip).toContain("For judges");
    expect(strip).toContain("/app");
    expect(strip).toContain("https://github.com/anhquan075/verisettle");
    expect(strip).toContain("#judge-route");
    expect(strip).toContain("https://creditcoin-testnet.blockscout.com");
    expect(strip).toContain("https://sepolia.etherscan.io");
    expect(strip).toContain("For judges");
    expect(judgePage).toContain("JudgeForJudgesStrip");
  });

  it("keeps UI copy free of em-dashes and leftover testnet/delivery wording", () => {
    for (const file of UI_COPY_FILES) {
      const contents = source(file);
      expect(contents, file).not.toContain("—");
      expect(contents, file).not.toContain("delivery proof");
      expect(contents, file).not.toContain("verisettle-testnet");
    }
  });
});
