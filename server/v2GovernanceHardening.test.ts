import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const governedEscrow = fs.readFileSync(path.join(root, "contracts/VeriSettleEscrowASCV2Governed.sol"), "utf8");
const multisig = fs.readFileSync(path.join(root, "contracts/VeriSettleDisputeMultisig.sol"), "utf8");
const invariantSuite = fs.readFileSync(path.join(root, "test/foundry/V2EscrowInvariants.t.sol"), "utf8");
const manifestExplainer = fs.readFileSync(path.join(root, "client/src/components/V2ManifestGateExplainer.tsx"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "client/src/pages/DealDashboard.tsx"), "utf8");
const detail = fs.readFileSync(path.join(root, "client/src/pages/DealDetail.tsx"), "utf8");

describe("V2 governance hardening contract", () => {
  it("makes governed escrow resolution callable only by an immutable governance contract", () => {
    expect(governedEscrow).not.toContain("Ownable");
    expect(governedEscrow).toContain("address public immutable disputeGovernance");
    expect(governedEscrow).toContain("executeMultisigDisputeResolution");
    expect(governedEscrow).toContain("if (msg.sender != disputeGovernance)");
  });

  it("binds multisig approvals to chain, target, order, outcome, and nonce", () => {
    expect(multisig).toContain("block.chainid");
    expect(multisig).toContain("address(this)");
    expect(multisig).toContain("escrow,");
    expect(multisig).toContain("orderId,");
    expect(multisig).toContain("releaseToSeller,");
    expect(multisig).toContain("nonce");
    expect(multisig).toContain("if (approvals < threshold) return");
    expect(multisig).toContain("executed[actionHash] = true");
  });

  it("includes expiry, replay, refund liveness, and accounting invariants", () => {
    expect(invariantSuite).toContain("invariant_expiryIsBoundToTheConfiguredAcceptanceWindow");
    expect(invariantSuite).toContain("invariant_processedQueryReplayNeverReachesVerificationOrRelease");
    expect(invariantSuite).toContain("invariant_everyExpiredFundedEscrowIsRefundableExactlyOnce");
    expect(invariantSuite).toContain("invariant_escrowAccountingTracksOnlyFundedOrRefundedValue");
  });

  it("surfaces a keyboard-accessible explanation wherever V2 action routing is gated", () => {
    expect(manifestExplainer).toContain("Why this is gated");
    expect(manifestExplainer).toContain("pinned policy hash");
    expect(manifestExplainer).toContain("runtime code hashes");
    expect(dashboard).toContain("V2ManifestGateExplainer");
    expect(detail).toContain("V2ManifestGateExplainer");
  });
});
