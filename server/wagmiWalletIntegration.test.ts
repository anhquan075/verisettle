import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("Wagmi wallet integration contract", () => {
  it("configures RainbowKit’s supported WalletConnect and injected-wallet stack for Creditcoin CC3 and Sepolia", () => {
    const config = read("../client/src/lib/wagmi.ts");
    expect(config).toContain('from "@rainbow-me/rainbowkit"');
    expect(config).toContain("getDefaultConfig");
    expect(config).toContain("VITE_WALLETCONNECT_PROJECT_ID");
    expect(config).toContain('appName: "VeriSettle"');
    expect(config).toContain("Creditcoin CC3 Testnet");
    expect(config).toContain("TESTNET_NETWORKS.creditcoin.rpcUrl");
    expect(config).toContain("[sepolia.id]");
  });

  it("wraps the application in Wagmi, RainbowKit, tRPC, and React Query context", () => {
    const main = read("../client/src/main.tsx");
    expect(main).toContain("WagmiProvider");
    expect(main).toContain("RainbowKitProvider");
    expect(main).toContain("wagmiConfig");
    expect(main).toContain("trpc.Provider");
    expect(main).toContain("QueryClientProvider");
  });

  it("uses Wagmi connection, reconnect, signing, and switching hooks instead of manual provider calls", () => {
    const access = read("../client/src/hooks/useWalletAccess.ts");
    expect(access).toContain("useConnectors");
    expect(access).toContain("useAccount");
    expect(access).toContain("useReconnect");
    expect(access).toContain("useSignMessage");
    expect(access).toContain("useSwitchChain");
    expect(access).toContain("connectAsync");
    expect(access).toContain("reconnectAsync");
    expect(access).toContain("signMessageAsync");
    expect(access).toContain("switchChainAsync");
    expect(access).toContain("TESTNET_NETWORKS[network].chainId");
    expect(access).toContain("Network switched");
    expect(access).toContain("No signature or transaction requested.");
    expect(access).not.toContain('method: "personal_sign"');
    expect(access).not.toContain('method: "wallet_switchEthereumChain"');
  });

  it("uses a safe disconnect-and-reselect path for connected-wallet changes", () => {
    const access = read("../client/src/hooks/useWalletAccess.ts");
    const readiness = read("../client/src/components/WalletReadinessPanel.tsx");
    const launchpad = read("../client/src/components/WalletFirstLaunchpad.tsx");
    expect(access).toContain("const changeWallet");
    expect(access).toContain("setSelectedWalletId(null)");
    expect(access).toContain("disconnect()");
    expect(readiness).toContain("onClick={wallet.changeWallet}");
    expect(readiness).toContain("Change wallet");
    expect(readiness).toContain("ConnectButton.Custom");
    expect(launchpad).toContain("onClick={wallet.changeWallet}");
    expect(launchpad).toContain(">Change</Button>");
  });

  it("keeps CC3 and Sepolia readiness switches explicit while preserving account recovery and the no-transaction boundary", () => {
    const access = read("../client/src/hooks/useWalletAccess.ts");
    const launchpad = read("../client/src/components/WalletFirstLaunchpad.tsx");
    expect(access).toContain('network === "creditcoin" ? "Creditcoin CC3 Testnet" : "Ethereum Sepolia"');
    expect(access).toContain("reconnectAsync");
    expect(access).toContain("return { address: connection.address ?? null, chainId: connection.chainId ?? null }");
    expect(launchpad).toContain('verifyNetwork("creditcoin")');
    expect(launchpad).toContain('verifyNetwork("sepolia")');
    expect(launchpad).toContain("No signature or transaction.");
    expect(launchpad).toContain("never a transaction");
  });

  it("shows a concise, accessible loading state while the wallet picker is opening or connecting", () => {
    const readiness = read("../client/src/components/WalletReadinessPanel.tsx");
    const launchpad = read("../client/src/components/WalletFirstLaunchpad.tsx");
    const dashboard = read("../client/src/components/DashboardLayout.tsx");
    for (const source of [readiness, launchpad, dashboard]) {
      expect(source).toContain("isOpeningWalletPicker");
      expect(source).toContain('aria-busy={connecting}');
      expect(source).toContain("Opening wallets…");
      expect(source).toContain("animate-spin");
    }
  });
});
