import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf-8");
}

describe("offchain relayer contract", () => {
  const worker = source("../worker/relayer.mjs");
  const readme = source("../worker/README.md");
  const onchain = source("./onchain.ts");

  it("only submits proofs and states it cannot steal escrow", () => {
    expect(worker).toContain("submitAcceptanceProof");
    expect(worker).toContain("waitUntilHeightAttested");
    expect(worker).toContain("PrecompileChainInfoProvider");
    expect(worker).not.toContain("fundEscrow");
    expect(worker).toContain("cannot steal escrow");
    expect(readme).toContain("cannot steal escrow");
    expect(readme).toContain("Manual");
  });

  it("reuses ProofBuilder after a ChainInfo readiness check", () => {
    expect(onchain).toContain("getSourceAttestationReadiness");
    expect(onchain).toContain("resolveSourceChainKey");
    expect(onchain).toContain("ProofBuilder");
  });
});
