import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { REPLAY_PROTECTION_ERROR } from "../shared/deals";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf-8");
}

describe("Hallmark evidence-led UI contract", () => {
  const home = source("../client/src/pages/Home.tsx");
  const ledger = source("../client/src/components/ProofEvidenceLedger.tsx");
  const dashboard = source("../client/src/pages/DealDashboard.tsx");
  const detail = source("../client/src/pages/DealDetail.tsx");
  const layout = source("../client/src/components/DashboardLayout.tsx");
  const styles = source("../client/src/index.css");

  it("keeps the landing proof-first, receipt-linked, and honest about its testnet boundary", () => {
    expect(home).toContain("veri-context-rail");
    expect(home).toContain("Test assets only");
    expect(home).toContain("Release escrow only when the chain can explain why.");
    expect(ledger).toContain("Receipt index / public testnet");
    expect(ledger).toContain("Evidence, not a mock flow.");
    expect(ledger).toContain("Policy:");
  });

  it("keeps the authenticated workspace organized around a register and real action readiness", () => {
    expect(layout).toContain("veri-workspace-index");
    expect(layout).toContain("Receipt-bound transitions · public testnet only");
    expect(dashboard).toContain("Workspace index / 01");
    expect(dashboard).toContain("A register for receipt-governed settlement.");
    expect(dashboard).toContain("veri-operator-meter");
    expect(dashboard).toContain("Create purchase order");
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
    expect(styles).toContain(".veri-context-rail");
    expect(styles).toContain(".veri-workspace-index");
    expect(styles).toContain(".veri-action-rail");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("overflow-x: clip");
  });
});
