import { REPLAY_PROTECTION_ERROR } from "./deals";

export const EXPECTED_REPLAY_RESULT = "QueryAlreadyProcessed" as const;

/**
 * Ensures the on-chain replay probe returned the deployed ASC's expected result.
 * Any other result is an operational failure, not a successful judge demonstration.
 */
export function assertExpectedReplayResult(result: string): asserts result is typeof EXPECTED_REPLAY_RESULT {
  if (result !== EXPECTED_REPLAY_RESULT) {
    throw new Error("Unexpected replay result.");
  }
}

/**
 * The app records a verified replay attempt before the lifecycle procedure returns
 * the exact user-facing protection error. This identifies that expected branch.
 */
export function isExpectedReplayRejection(error: unknown): boolean {
  return error instanceof Error && error.message === REPLAY_PROTECTION_ERROR;
}
