import { trpc } from "@/lib/trpc";
import { describeWalletError, type WalletErrorNotice } from "@/lib/walletError";
import { TESTNET_NETWORKS } from "@shared/contracts";
import { useCallback, useMemo, useState } from "react";
import {
  useConnect,
  useConnection,
  useConnectors,
  useReconnect,
  useSignMessage,
  useSwitchChain,
  type Connector,
} from "wagmi";

type WalletNetwork = keyof typeof TESTNET_NETWORKS;

export type WalletProviderId = string;

export type DiscoveredWallet = {
  id: WalletProviderId;
  name: string;
  connector: Connector;
};

const supportedWalletLabel = "MetaMask, OKX Wallet, Binance Wallet, Rabby, or SubWallet";

function displayConnectorName(connector: Connector) {
  const identity = `${connector.id} ${connector.name}`.toLowerCase();
  if (identity.includes("subwallet")) return "SubWallet";
  if (identity.includes("rabby")) return "Rabby";
  if (identity.includes("okx") || identity.includes("okex")) return "OKX Wallet";
  if (identity.includes("binance")) return "Binance Wallet";
  if (identity.includes("metamask")) return "MetaMask";
  return connector.name || "Browser wallet";
}

export function useWalletAccess() {
  const connectors = useConnectors();
  const connection = useConnection();
  const { connectAsync, isPending: isConnecting } = useConnect();
  const { reconnectAsync, isPending: isReconnecting } = useReconnect();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const [selectedWalletId, setSelectedWalletId] = useState<WalletProviderId | null>(null);
  const [error, setError] = useState<WalletErrorNotice | null>(null);
  const requestNonce = trpc.auth.wallet.requestNonce.useMutation();
  const verify = trpc.auth.wallet.verify.useMutation();
  const utils = trpc.useUtils();

  const wallets = useMemo<DiscoveredWallet[]>(() => connectors.map((connector) => ({
    id: connector.uid,
    name: displayConnectorName(connector),
    connector,
  })), [connectors]);
  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === selectedWalletId)
      ?? wallets.find((wallet) => wallet.connector.uid === connection.connector?.uid)
      ?? wallets[0]
      ?? null,
    [connection.connector?.uid, selectedWalletId, wallets],
  );
  const address = connection.address ?? null;
  const chainId = connection.chainId ?? null;
  const busy = isConnecting || isReconnecting || isSigning || isSwitching || requestNonce.isPending || verify.isPending;

  const connect = useCallback(async (walletId?: WalletProviderId) => {
    const target = walletId ? wallets.find((wallet) => wallet.id === walletId) : selectedWallet;
    if (!target) {
      setError({ kind: "extension", title: "Wallet extension unavailable", detail: `Install ${supportedWalletLabel}, then return to this testnet workspace.`, action: "connect" });
      return null;
    }
    setSelectedWalletId(target.id);
    setError(null);
    try {
      const result = await connectAsync({ connector: target.connector });
      return { address: result.accounts[0] ?? null, chainId: result.chainId };
    } catch (cause) {
      setError(describeWalletError(cause, "Unlock your selected wallet account and approve this site connection to continue.", "connect"));
      return null;
    }
  }, [connectAsync, selectedWallet, wallets]);

  const refreshAccount = useCallback(async () => {
    setError(null);
    try {
      await reconnectAsync({ connectors: selectedWallet ? [selectedWallet.connector] : connectors });
      return { address: connection.address ?? null, chainId: connection.chainId ?? null };
    } catch (cause) {
      setError(describeWalletError(cause, "Unlock the selected wallet, approve this site in Connected sites, then refresh its account state.", "connect"));
      return null;
    }
  }, [connection.address, connection.chainId, connectors, reconnectAsync, selectedWallet]);

  const switchNetwork = useCallback(async (network: WalletNetwork) => {
    if (!address) {
      setError({ kind: "extension", title: "Connect wallet first", detail: "Connect an approved wallet account before changing its testnet network.", action: "connect" });
      return false;
    }
    setError(null);
    try {
      await switchChainAsync({ chainId: TESTNET_NETWORKS[network].chainId });
      return true;
    } catch (cause) {
      const label = network === "creditcoin" ? "Creditcoin CC3 Testnet" : "Ethereum Sepolia";
      setError(describeWalletError(cause, `Switch to ${label} and try again.`, "switch"));
      return false;
    }
  }, [address, switchChainAsync]);

  const signIn = useCallback(async () => {
    if (!address || !chainId) {
      setError({ kind: "extension", title: "Connect wallet first", detail: "Connect an approved wallet account before requesting a secure sign-in message.", action: "connect" });
      return false;
    }
    setError(null);
    try {
      const challenge = await requestNonce.mutateAsync({ address, chainId });
      const signature = await signMessageAsync({ message: challenge.message });
      await verify.mutateAsync({ address, nonce: challenge.nonce, signature });
      await utils.auth.me.invalidate();
      return true;
    } catch (cause) {
      setError(describeWalletError(cause, "Request a fresh sign-in message and approve it with the connected wallet.", "retry"));
      return false;
    }
  }, [address, chainId, requestNonce, signMessageAsync, utils.auth.me, verify]);

  const readiness = useMemo(() => ({
    creditcoin: chainId === TESTNET_NETWORKS.creditcoin.chainId,
    sepolia: chainId === TESTNET_NETWORKS.sepolia.chainId,
  }), [chainId]);

  return {
    address,
    busy,
    chainId,
    error,
    extension: connection.connector ? displayConnectorName(connection.connector) : selectedWallet?.name ?? null,
    hasExtension: wallets.length > 0,
    readiness,
    wallets,
    selectedWallet,
    connect,
    refreshAccount,
    signIn,
    switchNetwork,
  };
}
