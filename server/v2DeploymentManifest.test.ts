import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { V2_POLICY_MANIFEST } from "../shared/v2PolicyManifest";

const root = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(root, "contracts/VeriSettleSourceV2.sol"), "utf8");
const escrow = fs.readFileSync(path.join(root, "contracts/VeriSettleEscrowASCV2.sol"), "utf8");
const verifier = fs.readFileSync(path.join(root, "scripts/verify-v2-policy-manifest.mjs"), "utf8");

describe("V2 deployment manifest", () => {
  it("pins non-zero independent V2 testnet addresses and code hashes", () => {
    expect(V2_POLICY_MANIFEST.policyVersion).toBe(2);
    expect(V2_POLICY_MANIFEST.source.address).toMatch(/^0x[\da-fA-F]{40}$/);
    expect(V2_POLICY_MANIFEST.escrowAsc.address).toMatch(/^0x[\da-fA-F]{40}$/);
    expect(V2_POLICY_MANIFEST.source.address).not.toBe(V2_POLICY_MANIFEST.escrowAsc.address);
    expect(V2_POLICY_MANIFEST.source.runtimeCodeHash).toMatch(/^0x[\da-f]{64}$/i);
    expect(V2_POLICY_MANIFEST.escrowAsc.runtimeCodeHash).toMatch(/^0x[\da-f]{64}$/i);
  });

  it("binds policy hash and per-order commitment fields in both V2 contracts", () => {
    expect(source).toContain("bytes32 public immutable policyHash");
    expect(source).toContain("OrderAcceptedV2");
    expect(escrow).toContain("bytes32 public immutable policyHash");
    expect(escrow).toContain("bytes32 termsCommitment");
    expect(escrow).toContain("receiptPolicyHash != policyHash");
    expect(escrow).toContain("escrow.acceptanceExpiresAt != acceptanceExpiresAt");
  });

  it("independently checks public code and immutable constructor bindings", () => {
    expect(verifier).toContain("getCode");
    expect(verifier).toContain("runtimeCodeHash");
    expect(verifier).toContain("policyHash");
    expect(verifier).toContain("sourceContract");
  });
});
