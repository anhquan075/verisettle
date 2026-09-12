import { describe, expect, it } from "vitest";
import {
  GOVERNED_CONSTRUCTOR_ARGS,
  MULTISIG_CONSTRUCTOR_ARGS,
  V1_ESCROW_CONSTRUCTOR_ARGS,
  V2_ESCROW_CONSTRUCTOR_ARGS,
  V2_SOURCE_CONSTRUCTOR_ARGS,
  VERIFY_TARGETS,
  documentedCommand,
} from "../scripts/verify-deployed-contracts.mjs";

describe("deployed-contract verification targets", () => {
  it("encodes V2 source policy hash and acceptance window", () => {
    expect(V2_SOURCE_CONSTRUCTOR_ARGS.startsWith("0xf951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f28976")).toBe(true);
    expect(V2_SOURCE_CONSTRUCTOR_ARGS.endsWith("00093a80")).toBe(true);
  });

  it("keeps CC3 constructor args and does not require a Blockscout key", () => {
    expect(V1_ESCROW_CONSTRUCTOR_ARGS).toContain("1ac5b6b47efe751681a206fa8a5c305250017425");
    expect(V2_ESCROW_CONSTRUCTOR_ARGS).toContain("56e6d3e213141aa8285d0b12504bda5da260aa18");
    expect(MULTISIG_CONSTRUCTOR_ARGS).toContain("c7774720d1c14b9da1c656b796a2a092d0b9d1c9");
    expect(GOVERNED_CONSTRUCTOR_ARGS).toContain("0c9b8ef45aa36922bb3dde9aeec1bb1bafce2849");
    const cc3 = VERIFY_TARGETS.filter((target) => target.chainId === 102031);
    expect(cc3).toHaveLength(4);
    for (const target of cc3) {
      expect(documentedCommand(target)).toContain("--verifier blockscout");
      expect(documentedCommand(target)).not.toContain("BLOCKSCOUT_API_KEY");
    }
  });

  it("documents Sepolia Etherscan commands without embedding a key", () => {
    const sepolia = VERIFY_TARGETS.filter((target) => target.chainId === 11155111);
    expect(sepolia).toHaveLength(2);
    for (const target of sepolia) {
      expect(documentedCommand(target)).toContain("$ETHERSCAN_API_KEY");
      expect(documentedCommand(target)).toContain("--evm-version shanghai");
    }
  });
});
