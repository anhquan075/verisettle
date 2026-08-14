import { describe, expect, it } from "vitest";
import { REPLAY_PROTECTION_ERROR } from "../shared/deals";
import { assertExpectedReplayResult, EXPECTED_REPLAY_RESULT, isExpectedReplayRejection } from "../shared/judgeMode";

describe("judge-mode replay verification", () => {
  it("accepts the deployed ASC's one expected replay result", () => {
    expect(() => assertExpectedReplayResult(EXPECTED_REPLAY_RESULT)).not.toThrow();
  });

  it("rejects an unexpected replay result so the UI uses its action-error recovery", () => {
    expect(() => assertExpectedReplayResult("ProofAcceptedAgain")).toThrow("Unexpected replay result.");
  });

  it("distinguishes the expected protection rejection from an operational error", () => {
    expect(isExpectedReplayRejection(new Error(REPLAY_PROTECTION_ERROR))).toBe(true);
    expect(isExpectedReplayRejection(new Error("RPC unavailable"))).toBe(false);
  });
});
