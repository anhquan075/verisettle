import { TESTNET_NETWORKS } from "@shared/contracts";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

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

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!walletConnectProjectId) {
  throw new Error("RainbowKit requires VITE_WALLETCONNECT_PROJECT_ID.");
}

export const wagmiConfig = getDefaultConfig({
  appName: "VeriSettle",
  projectId: walletConnectProjectId,
  chains: [creditcoinCc3, sepolia],
  transports: {
    [creditcoinCc3.id]: http(TESTNET_NETWORKS.creditcoin.rpcUrl),
    [sepolia.id]: http(TESTNET_NETWORKS.sepolia.rpcUrl),
  },
});
