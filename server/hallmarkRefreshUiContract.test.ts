import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { REPLAY_PROTECTION_ERROR } from "../shared/deals";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf-8");
}

describe("evidence-studio and protocol-reference UI contract", () => {
  const home = source("../client/src/pages/Home.tsx");
  const ledger = source("../client/src/components/ProofEvidenceLedger.tsx");
  const dashboard = source("../client/src/pages/DealDashboard.tsx");
  const detail = source("../client/src/pages/DealDetail.tsx");
  const layout = source("../client/src/components/DashboardLayout.tsx");
  const app = source("../client/src/App.tsx");
  const protocol = source("../client/src/pages/ProtocolReference.tsx");
  const palette = source("../client/src/components/DealCommandPalette.tsx");
  const evidenceExport = source("../client/src/components/JudgeEvidenceExport.tsx");
  const judgeRoute = source("../client/src/components/JudgeProofRoute.tsx");
  const brand = source("../client/src/components/VeriSettleBrand.tsx");
  const walletPanel = source("../client/src/components/WalletReadinessPanel.tsx");
  const html = source("../client/index.html");
  const styles = source("../client/src/index.css");

  it("keeps the landing proof-first, receipt-linked, and explicit about the testnet boundary", () => {
    expect(home).toContain("veri-proof-canvas");
    expect(home).toContain("Proof first.");
    expect(home).toContain("Release once.");
    expect(home).toContain("public testnet assets");
    expect(home).toContain("veri-live-route");
    expect(home).toContain("VeriSettleBrand");
    expect(home).toContain('setLocation("/app#judge-route")');
    expect(home).toContain("Open judge route");
    expect(ledger).toContain("Receipt index / public testnet");
    expect(ledger).toContain("Evidence, not a mock flow.");
    expect(ledger).toContain("Policy:");
  });

  it("keeps the authenticated workspace organized around a real next action and register", () => {
    expect(layout).toContain("veri-workspace-header");
    expect(layout).toContain("sticky top-0");
    expect(layout).toContain("Receipt-bound ·");
    expect(layout).toContain("Public testnet only");
    expect(dashboard).toContain("Settlement desk");
    expect(dashboard).toContain("Terms first.");
    expect(dashboard).toContain("veri-workspace-spark");
    expect(dashboard).toContain("veri-operator-meter");
    expect(dashboard).toContain("Create purchase order");
    expect(dashboard).toContain("DealCommandPalette");
    expect(dashboard).toContain("JudgeProofRoute");
    expect(dashboard).toContain("Inspect a completed proof");
    expect(dashboard).toContain('window.location.hash !== "#judge-route"');
    expect(dashboard).toContain('route.scrollIntoView({ behavior: "auto", block: "start" })');
    expect(judgeRoute).toContain("Judge route / real testnet evidence");
    expect(judgeRoute).toContain("A delivery receipt becomes");
    expect(judgeRoute).toContain("0x6975…1d94");
    expect(judgeRoute).toContain("0x4b6c…1d18");
    expect(judgeRoute).toContain("0x0e8c…d6df");
    expect(judgeRoute).toContain("cannot be replayed");
    expect(judgeRoute).toContain('tabIndex={-1}');
    expect(judgeRoute).toContain("Governed recovery / deployed V3 route");
    expect(judgeRoute).toContain("2 of 3 independent approvals");
    expect(judgeRoute).toContain("V2_GOVERNED_POLICY_MANIFEST");
  });

  it("routes Protocol reference to a usable live-deployment page instead of a missing app anchor", () => {
    expect(layout).toContain('path: "/protocol"');
    expect(app).toContain('path={"/protocol"}');
    expect(protocol).toContain("Live testnet configuration");
    expect(protocol).toContain("Inspect the contracts.");
    expect(protocol).toContain("BlockProver precompile");
    expect(protocol).toContain("CopyValue");
    expect(protocol).toContain("veri-protocol-route");
    expect(protocol).toContain("Inspect emitter");
  });

  it("keeps the evidence export and keyboard-first deal discovery bound to real workspace data", () => {
    expect(detail).toContain("JudgeEvidenceExport");
    expect(evidenceExport).toContain("Export judge evidence");
    expect(evidenceExport).toContain("navigator.canShare");
    expect(evidenceExport).toContain("private keys, seed phrases, passwords");
    expect(palette).toContain("event.key.toLowerCase() !== \"k\"");
    expect(palette).toContain("buyerAddress");
    expect(palette).toContain("sellerAddress");
    expect(palette).toContain("onOpenDeal");
  });

  it("keeps the judge workspace explorable with inherited wallet controls and explicit SIWE action boundaries", () => {
    expect(layout).toContain("WorkspaceWalletControl");
    expect(layout).toContain("Judge access");
    expect(layout).toContain("Connect wallet");
    expect(dashboard).toContain("Your private deal register appears after sign-in");
    expect(dashboard).toContain("Connect & sign in to create");
    expect(walletPanel).toContain("MetaMask, OKX Wallet, Binance Wallet, Rabby, or SubWallet");
    expect(walletPanel).toContain("VeriSettle never requests keys or recovery phrases.");
    expect(layout).not.toContain("Use another sign-in");
    expect(layout).not.toContain("startLogin");
    expect(layout).not.toContain("Sign in with wallet");
  });

  it("keeps the brand selectable for theme surfaces and publishable in compact and social contexts", () => {
    expect(brand).toContain('tone = "brand"');
    expect(brand).toContain("monochrome");
    expect(brand).toContain('surface = "dark"');
    expect(home).toContain("VeriSettleBrand compact");
    expect(html).toContain('property="og:image"');
    expect(html).toContain("verisettle-og-proof-before-release_327a17cd.png");
    expect(html).toContain("Instrument+Sans");
  });

  it("uses the production-uploaded brand asset and retains a persistent return to the public landing page", () => {
    expect(brand).toContain("https://files.manuscdn.com/user_upload_by_module/session_file/119889830/eFHWodZEAyBplgdg.png");
    expect(layout).toContain("Back to landing page");
    expect(layout).toContain('setLocation("/")');
    expect(layout).toContain("ArrowLeft");
  });

  it("keeps detail actions ahead of immutable evidence without weakening replay safety", () => {
    expect(detail).toContain("Next permitted action");
    expect(detail).toContain("veri-action-rail");
    expect(detail).toContain("veri-evidence-index");
    expect(detail).toContain("Append-only evidence");
    expect(detail).toContain("REPLAY_PROTECTION_ERROR");
    expect(REPLAY_PROTECTION_ERROR).toContain("already been processed");
  });

  it("keeps the shared visual system responsive and reduced-motion safe", () => {
    expect(styles).toContain(".veri-proof-canvas");
    expect(styles).toContain(".veri-workspace-spark");
    expect(styles).toContain(".veri-workspace-header");
    expect(styles).toContain(".veri-live-route");
    expect(styles).toContain(".veri-protocol-route");
    expect(styles).toContain(".veri-action-rail");
    expect(brand).toContain("https://files.manuscdn.com/user_upload_by_module/session_file/119889830/eFHWodZEAyBplgdg.png");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("overflow-x: clip");
  });
});
