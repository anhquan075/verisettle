import { TESTNET_NETWORKS } from "@shared/contracts";
import { defineChain } from "viem";
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const creditcoinCc3 = defineChain({
  id: TESTNET_NETWORKS.creditcoin.chainId,
  name: "Creditcoin CC3 Testnet",
  nativeCurrency: {
    name: "Creditcoin Testnet",
    symbol: "tCTC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [TESTNET_NETWORKS.creditcoin.rpcUrl] },
  },
  blockExplorers: {
    default: {
      name: "Creditcoin Blockscout",
      url: TESTNET_NETWORKS.creditcoin.explorerUrl,
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [creditcoinCc3, sepolia],
  connectors: [
    injected({
      shimDisconnect: true,
      unstable_shimAsyncInject: 2_000,
    }),
  ],
  multiInjectedProviderDiscovery: true,
  transports: {
    [creditcoinCc3.id]: http(TESTNET_NETWORKS.creditcoin.rpcUrl),
    [sepolia.id]: http(TESTNET_NETWORKS.sepolia.rpcUrl),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
