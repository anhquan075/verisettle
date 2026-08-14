import { describe, expect, it } from "vitest";
import { describeWalletError } from "../client/src/lib/walletError";

describe("wallet sign-in error guidance", () => {
  it("turns wallet cancellation into a non-alarming retry", () => {
    expect(describeWalletError({ code: 4001 }, "fallback")).toMatchObject({
      kind: "signature_rejected",
      title: "Request cancelled",
      action: "retry",
    });
  });

  it("explains expired challenges without leaking challenge data", () => {
    const notice = describeWalletError(new Error("This wallet sign-in challenge is unavailable or expired."), "fallback");
    expect(notice).toMatchObject({ kind: "challenge", title: "Sign-in request expired", action: "retry" });
    expect(notice.detail).not.toContain("nonce");
  });

  it("maps origin, signature, network, and transport errors to distinct recovery guidance", () => {
    expect(describeWalletError(new Error("Wallet sign-in is not enabled for this origin."), "fallback").kind).toBe("origin");
    expect(describeWalletError(new Error("Wallet signature could not be verified."), "fallback").kind).toBe("signature");
    expect(describeWalletError(new Error("Unable to switch network"), "fallback").action).toBe("switch");
    expect(describeWalletError(new Error("Failed to fetch"), "fallback").kind).toBe("server");
  });
});
