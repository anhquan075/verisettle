import { describe, expect, it } from "vitest";
import { describeSessionExpiry } from "../client/src/lib/sessionExpiry";

describe("wallet session expiry display", () => {
  const now = Date.UTC(2026, 7, 14, 12, 0, 0);

  it("shows a calm hours-and-minutes countdown for active wallet sessions", () => {
    expect(describeSessionExpiry(new Date(now + 90 * 60_000), now)).toMatchObject({
      expired: false,
      warning: false,
      shortLabel: "1h 30m",
    });
  });

  it("switches to renewal guidance shortly before expiry and at expiry", () => {
    expect(describeSessionExpiry(new Date(now + 10 * 60_000), now)).toMatchObject({
      warning: true,
      shortLabel: "Renew 10m",
    });
    expect(describeSessionExpiry(new Date(now), now)).toMatchObject({
      expired: true,
      shortLabel: "Renew",
    });
  });
});
