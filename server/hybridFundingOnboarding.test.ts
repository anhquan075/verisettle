import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("hybrid testnet funding and wallet-first onboarding contract", () => {
  it("persists a single auditable request per wallet and requires a linked wallet identity", () => {
    const schema = read("../drizzle/schema.ts");
    const router = read("./routers/testnetFunding.ts");
    expect(schema).toContain('walletAddress: varchar("walletAddress", { length: 42 }).notNull().unique()');
    expect(schema).toContain('userOpenId: varchar("userOpenId", { length: 64 }).notNull().unique()');
    expect(router).toContain("requireLinkedWallet");
    expect(router).toContain('sessionKind !== "siwe"');
    expect(router).toContain("Sign in with this wallet before requesting its one-time testnet funding.");
    expect(router).toContain("alreadyClaimed: true");
  });

  it("records actual receipt outcomes and keeps partial claims explicit", () => {
    const router = read("./routers/testnetFunding.ts");
    expect(router).toContain('status: "complete", cc3TxHash, sepoliaTxHash');
    expect(router).toContain('status: cc3TxHash || sepoliaTxHash ? "partial" : "failed"');
    expect(router).toContain("Use the official faucet links below");
  });

  it("keeps the launchpad wallet-first, route-aware, and free of key-handling UI", () => {
    const launchpad = read("../client/src/components/WalletFirstLaunchpad.tsx");
    const walletAccess = read("../client/src/hooks/useWalletAccess.ts");
    expect(launchpad).toContain("useWalletAccess");
    expect(launchpad).toContain('verifyNetwork("creditcoin")');
    expect(launchpad).toContain('verifyNetwork("sepolia")');
    expect(launchpad).toContain("Claim small test balance");
    expect(launchpad).toContain("CC3 official faucet");
    expect(launchpad).not.toContain("VERISETTLE_TESTNET_FUNDER_PRIVATE_KEY");
    expect(launchpad).not.toContain("testnetFunderPrivateKey");
    expect(walletAccess).toContain("eip6963:requestProvider");
    expect(walletAccess).toContain("eip6963:announceProvider");
    expect(walletAccess).toContain('type WalletProviderId = "metamask" | "okx" | "binance" | "rabby" | "subwallet" | "injected"');
    expect(walletAccess).toContain('name: "MetaMask"');
    expect(walletAccess).toContain('name: "OKX Wallet"');
    expect(walletAccess).toContain('name: "Binance Wallet"');
    expect(walletAccess).toContain('name: "Rabby"');
    expect(walletAccess).toContain('name: "SubWallet"');
    expect(walletAccess).toContain("dedupeWallets");
    expect(walletAccess).toContain("lateRetryDiscovery");
    const readiness = read("../client/src/components/WalletReadinessPanel.tsx");
    expect(readiness).toContain("Connect {candidate.name}");
    expect(readiness).toContain("Install a supported EVM wallet.");
  });
});
