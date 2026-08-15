import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("Wagmi wallet integration contract", () => {
  it("configures injected multi-provider discovery for Creditcoin CC3 and Sepolia", () => {
    const config = read("../client/src/lib/wagmi.ts");
    expect(config).toContain('from "wagmi"');
    expect(config).toContain('from "wagmi/connectors"');
    expect(config).toContain("multiInjectedProviderDiscovery: true");
    expect(config).toContain("unstable_shimAsyncInject: 2_000");
    expect(config).toContain("Creditcoin CC3 Testnet");
    expect(config).toContain("TESTNET_NETWORKS.creditcoin.rpcUrl");
    expect(config).toContain("[sepolia.id]");
  });

  it("wraps the application in Wagmi context while retaining tRPC and React Query", () => {
    const main = read("../client/src/main.tsx");
    expect(main).toContain("WagmiProvider");
    expect(main).toContain("wagmiConfig");
    expect(main).toContain("trpc.Provider");
    expect(main).toContain("QueryClientProvider");
  });

  it("uses Wagmi connection, reconnect, signing, and switching hooks instead of manual provider calls", () => {
    const access = read("../client/src/hooks/useWalletAccess.ts");
    expect(access).toContain("useConnectors");
    expect(access).toContain("useConnection");
    expect(access).toContain("useReconnect");
    expect(access).toContain("useSignMessage");
    expect(access).toContain("useSwitchChain");
    expect(access).toContain("connectAsync");
    expect(access).toContain("reconnectAsync");
    expect(access).toContain("signMessageAsync");
    expect(access).toContain("switchChainAsync");
    expect(access).not.toContain('method: "personal_sign"');
    expect(access).not.toContain('method: "wallet_switchEthereumChain"');
  });
});
