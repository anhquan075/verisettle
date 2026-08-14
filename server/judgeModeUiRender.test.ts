import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { JudgeReplayWalkthrough } from "../client/src/components/JudgeReplayWalkthrough";
import { WalletApprovalEvidence } from "../client/src/components/WalletApprovalEvidence";
import { REPLAY_PROTECTION_ERROR } from "../shared/deals";

describe("judge-mode rendered UI states", () => {
  const baseProps = {
    disabled: false,
    onRunReplay: () => undefined,
    onDismissReplayError: () => undefined,
    expectedError: REPLAY_PROTECTION_ERROR,
    settlementTxHash: "0x1234",
    explorerUrl: "https://creditcoin-testnet.blockscout.com",
  };

  it("renders the expected replay rejection as a status, not an error", () => {
    const html = renderToStaticMarkup(createElement(JudgeReplayWalkthrough, { ...baseProps, replayVerified: true, replayError: null }));
    expect(html).toContain('role="status"');
    expect(html).toContain("Expected replay rejection observed.");
    expect(html).not.toContain('role="alert"');
  });

  it("renders an unexpected replay failure as a recoverable alert", () => {
    const html = renderToStaticMarkup(createElement(JudgeReplayWalkthrough, { ...baseProps, replayVerified: false, replayError: "RPC unavailable" }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Replay check did not complete.");
    expect(html).toContain("RPC unavailable");
    expect(html).toContain("Review retry steps");
  });

  it("renders only public wallet evidence guidance", () => {
    const html = renderToStaticMarkup(createElement(WalletApprovalEvidence, { buyerAddress: "0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620", connectedAddress: null }));
    expect(html).toContain('aria-label="Wallet approval evidence checklist"');
    expect(html).toContain("Capture public proof after your own extension approval.");
    expect(html).toContain("Never capture passwords, seed phrases, or private key material.");
  });
});
