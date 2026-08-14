import { readFileSync } from "node:fs";
import { getAddress, verifyMessage, Wallet } from "ethers";
import { describe, expect, it } from "vitest";
import { __walletAuthTestUtils } from "./routers/walletAuth";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf-8");
}

describe("SIWE wallet authentication security", () => {
  it("binds an exact expiring challenge to the signer address and origin", async () => {
    const wallet = Wallet.createRandom();
    const address = getAddress(wallet.address);
    const message = __walletAuthTestUtils.buildSiweMessage({
      address,
      origin: "https://verisettle.example",
      chainId: 102031,
      nonce: "nonce_for_a_real_wallet_signin_123",
      issuedAt: new Date("2026-08-14T00:00:00.000Z"),
      expiresAt: new Date("2026-08-14T00:05:00.000Z"),
    });
    const signature = await wallet.signMessage(message);

    expect(getAddress(verifyMessage(message, signature))).toBe(address);
    expect(message).toContain("verisettle.example wants you to sign in with your Ethereum account:");
    expect(message).toContain("This signature does not authorize a transaction.");
    expect(message).toContain("Chain ID: 102031");
    expect(message).toContain("Expiration Time: 2026-08-14T00:05:00.000Z");
  });

  it("uses a deterministic private wallet account identifier without storing a secret", () => {
    expect(__walletAuthTestUtils.walletOpenId("0xAbCdEf0000000000000000000000000000001234")).toBe("wallet:0xabcdef0000000000000000000000000000001234");
  });

  it("requires atomic nonce consumption, recovered signer verification, and the existing secure session cookie", () => {
    const routerSource = source("./routers/walletAuth.ts");
    expect(routerSource).toContain("getActiveSiweNonce");
    expect(routerSource).toContain("consumeSiweNonce");
    expect(routerSource).toContain("verifyMessage(challenge.message, input.signature)");
    expect(routerSource).toContain("ctx.res.cookie(COOKIE_NAME, token");
    expect(routerSource).toContain("This wallet sign-in challenge was already used.");
    expect(routerSource).toContain("This signature does not authorize a transaction.");
  });

  it("keeps extension detection and required CC3/Sepolia gates in front of wallet-backed actions", () => {
    const access = source("../client/src/hooks/useWalletAccess.ts");
    const panel = source("../client/src/components/WalletReadinessPanel.tsx");
    const detail = source("../client/src/pages/DealDetail.tsx");
    expect(access).toContain("Install Rabby or SubWallet");
    expect(access).toContain("wallet_switchEthereumChain");
    expect(access).toContain("wallet_addEthereumChain");
    expect(panel).toContain("Wallet unavailable");
    expect(panel).toContain("Switch to");
    expect(detail).toContain("creditcoinReady");
    expect(detail).toContain("sepoliaReady");
  });
});
