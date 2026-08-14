import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf-8");
}

describe("judge-mode and wallet-evidence UI accessibility contract", () => {
  const detail = source("../client/src/pages/DealDetail.tsx");
  const walletEvidence = source("../client/src/components/WalletApprovalEvidence.tsx");
  const judgeMode = source("../client/src/components/JudgeReplayWalkthrough.tsx");
  const judgeLogic = source("../shared/judgeMode.ts");

  it("keeps the wallet evidence surface labeled and the adjacent connection action focusable", () => {
    expect(walletEvidence).toContain('aria-label="Wallet approval evidence checklist"');
    expect(walletEvidence).toContain("Never capture passwords, seed phrases, or private key material.");
    expect(detail).toContain("Connect testnet wallet");
    expect(detail).toContain("veri-action mt-4");
  });

  it("exposes an expected replay success status and preserves a disabled state during operations", () => {
    expect(judgeMode).toContain('role="status"');
    expect(judgeMode).toContain("disabled={disabled}");
    expect(judgeMode).toContain("Run safe replay check");
    expect(judgeMode).toContain("Expected replay rejection observed.");
  });

  it("preserves an alert recovery path for unexpected action failures", () => {
    expect(detail).toContain('role="alert"');
    expect(detail).toContain("Action rejected.");
    expect(judgeLogic).toContain("Unexpected replay result.");
  });
});
