import { describe, expect, it } from "vitest";

describe("WalletConnect project configuration", () => {
  it("provides a project ID that can reach the WalletConnect Explorer endpoint", async () => {
    const projectId = process.env.VITE_WALLETCONNECT_PROJECT_ID;
    expect(projectId).toMatch(/^[A-Za-z0-9_-]{8,}$/);

    const response = await fetch(
      `https://explorer-api.walletconnect.com/v3/wallets?projectId=${encodeURIComponent(projectId ?? "")}`,
    );
    expect([200, 401, 403]).toContain(response.status);
  }, 15_000);
});
