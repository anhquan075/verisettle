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
    const dashboard = read("../client/src/components/DashboardLayout.tsx");
    const register = read("../client/src/pages/DealDashboard.tsx");
    const walletAccess = read("../client/src/hooks/useWalletAccess.ts");
    expect(launchpad).toContain("useWalletAccess");
    expect(launchpad).toContain('verifyNetwork("creditcoin")');
    expect(launchpad).toContain('verifyNetwork("sepolia")');
    expect(launchpad).toContain("Claim small test balance");
    expect(launchpad).toContain('funding?.status === "complete"');
    expect(launchpad).toContain("FundingReceiptEmbed");
    expect(launchpad).toContain('user?.openId.startsWith("wallet:")');
    expect(launchpad).toContain("const fundingWalletAddress = wallet.address ?? persistedWalletAddress");
    expect(launchpad).toContain("CC3 official faucet");
    expect(launchpad).not.toContain("VERISETTLE_TESTNET_FUNDER_PRIVATE_KEY");
    expect(launchpad).not.toContain("testnetFunderPrivateKey");
    expect(launchpad).toContain("ConnectButton.Custom");
    expect(launchpad).toContain("Choose wallet");
    expect(launchpad).toContain("Refresh wallet access");
    expect(launchpad).toContain("wallet.refreshAccount()");
    expect(launchpad).toContain("No signature or transaction.");
    expect(launchpad).toContain('user?.sessionKind === "siwe"');
    expect(launchpad).toContain("await refresh()");
    expect(dashboard).toContain("WorkspaceWalletControl");
    expect(dashboard).toContain("Connect wallet");
    expect(dashboard).not.toContain('id="workspace-sign-in"');
    expect(register).toContain('enabled: hasWalletSession');
    expect(register).toContain("Private orders appear after sign-in");
    expect(register).toContain("Connect & sign in to create");
    expect(walletAccess).toContain("useConnectors");
    expect(walletAccess).toContain("useAccount");
    expect(walletAccess).toContain("useReconnect");
    expect(walletAccess).toContain("useSignMessage");
    expect(walletAccess).toContain("useSwitchChain");
    expect(walletAccess).toContain("displayConnectorName");
    expect(walletAccess).toContain("MetaMask");
    expect(walletAccess).toContain("OKX Wallet");
    expect(walletAccess).toContain("Binance Wallet");
    expect(walletAccess).toContain("Rabby");
    expect(walletAccess).toContain("SubWallet");
    expect(walletAccess).toContain("refreshAccount");
    const readiness = read("../client/src/components/WalletReadinessPanel.tsx");
    expect(readiness).toContain("ConnectButton.Custom");
    expect(readiness).toContain("Choose wallet");
    expect(readiness).toContain("Install a supported EVM wallet.");
  });

  it("restores completed wallet-linked funding receipts as embedded CC3 and Sepolia evidence", () => {
    const receiptEmbed = read("../client/src/components/FundingReceiptEmbed.tsx");
    expect(receiptEmbed).toContain("Saved wallet state");
    expect(receiptEmbed).toContain("Creditcoin CC3");
    expect(receiptEmbed).toContain("Ethereum Sepolia");
    expect(receiptEmbed).toContain("https://creditcoin-testnet.blockscout.com/tx/");
    expect(receiptEmbed).toContain("https://sepolia.etherscan.io/tx/");
    expect(receiptEmbed).toContain("disallows third-party page frames");
  });
});
