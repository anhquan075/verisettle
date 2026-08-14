import { trpc } from "@/lib/trpc";
import { describeWalletError, type WalletErrorNotice } from "@/lib/walletError";
import { TESTNET_NETWORKS } from "@shared/contracts";
import { getAddress } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";

type WalletNetwork = keyof typeof TESTNET_NETWORKS;

type Eip1193Provider = {
  isRabby?: boolean;
  isSubWallet?: boolean;
  request: (request: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void) => void;
};

function getInjectedProvider() {
  return (window as Window & { ethereum?: Eip1193Provider }).ethereum;
}

function extensionName(provider: Eip1193Provider) {
  if (provider.isRabby) return "Rabby";
  if (provider.isSubWallet) return "SubWallet";
  return "EIP-1193 wallet";
}

function networkConfig(network: WalletNetwork) {
  const target = TESTNET_NETWORKS[network];
  return {
    chainId: target.chainIdHex,
    chainName: network === "creditcoin" ? "Creditcoin CC3 Testnet" : "Ethereum Sepolia",
    nativeCurrency: {
      name: network === "creditcoin" ? "Creditcoin Testnet" : "Sepolia Ether",
      symbol: network === "creditcoin" ? "tCTC" : "ETH",
      decimals: 18,
    },
    rpcUrls: [target.rpcUrl],
    blockExplorerUrls: [target.explorerUrl],
  };
}

export function useWalletAccess() {
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<WalletErrorNotice | null>(null);
  const requestNonce = trpc.auth.wallet.requestNonce.useMutation();
  const verify = trpc.auth.wallet.verify.useMutation();
  const utils = trpc.useUtils();

  const refresh = useCallback(async (nextProvider: Eip1193Provider, requestAccounts = false) => {
    const accounts = (await nextProvider.request({ method: requestAccounts ? "eth_requestAccounts" : "eth_accounts" })) as string[];
    const nextAddress = accounts[0] ? getAddress(accounts[0]) : null;
    const nextChainId = (await nextProvider.request({ method: "eth_chainId" })) as string;
    setAddress(nextAddress);
    setChainId(nextChainId);
    return { address: nextAddress, chainId: nextChainId };
  }, []);

  useEffect(() => {
    const nextProvider = getInjectedProvider() ?? null;
    setProvider(nextProvider);
    if (!nextProvider) return;
    void refresh(nextProvider).catch(() => undefined);
    const onAccountsChanged = () => void refresh(nextProvider).catch(() => undefined);
    const onChainChanged = () => void refresh(nextProvider).catch(() => undefined);
    nextProvider.on?.("accountsChanged", onAccountsChanged);
    nextProvider.on?.("chainChanged", onChainChanged);
    return () => {
      nextProvider.removeListener?.("accountsChanged", onAccountsChanged);
      nextProvider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!provider) {
      setError({ kind: "extension", title: "Wallet extension unavailable", detail: "Install Rabby or SubWallet, then return to this testnet workspace.", action: "connect" });
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      return await refresh(provider, true);
    } catch (cause) {
      setError(describeWalletError(cause, "Unlock your wallet and choose a testnet account to continue.", "connect"));
      return null;
    } finally {
      setBusy(false);
    }
  }, [provider, refresh]);

  const switchNetwork = useCallback(async (network: WalletNetwork) => {
    if (!provider) {
      setError({ kind: "extension", title: "Wallet extension unavailable", detail: "Install Rabby or SubWallet, then return to this testnet workspace.", action: "connect" });
      return false;
    }
    setBusy(true);
    setError(null);
    const config = networkConfig(network);
    try {
      try {
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: config.chainId }] });
      } catch (switchError) {
        const code = (switchError as { code?: number }).code;
        if (code !== 4902) throw switchError;
        await provider.request({ method: "wallet_addEthereumChain", params: [config] });
      }
      await refresh(provider);
      return true;
    } catch (cause) {
      setError(describeWalletError(cause, `Switch to ${config.chainName} and try again.`, "switch"));
      return false;
    } finally {
      setBusy(false);
    }
  }, [provider, refresh]);

  const signIn = useCallback(async () => {
    if (!provider) {
      setError({ kind: "extension", title: "Wallet extension unavailable", detail: "Install Rabby or SubWallet before requesting a secure wallet sign-in.", action: "connect" });
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      const connection = await refresh(provider, true);
      if (!connection.address || !connection.chainId) throw new Error("Connect a wallet account before signing in.");
      const challenge = await requestNonce.mutateAsync({
        address: connection.address,
        chainId: Number.parseInt(connection.chainId, 16),
      });
      const signature = (await provider.request({ method: "personal_sign", params: [challenge.message, connection.address] })) as string;
      await verify.mutateAsync({ address: connection.address, nonce: challenge.nonce, signature });
      await utils.auth.me.invalidate();
      return true;
    } catch (cause) {
      setError(describeWalletError(cause, "Request a fresh sign-in message and approve it with the connected wallet.", "retry"));
      return false;
    } finally {
      setBusy(false);
    }
  }, [provider, refresh, requestNonce, utils.auth.me, verify]);

  const readiness = useMemo(() => ({
    creditcoin: chainId === TESTNET_NETWORKS.creditcoin.chainIdHex,
    sepolia: chainId === TESTNET_NETWORKS.sepolia.chainIdHex,
  }), [chainId]);

  return {
    address,
    busy,
    chainId,
    error,
    extension: provider ? extensionName(provider) : null,
    hasExtension: Boolean(provider),
    readiness,
    connect,
    signIn,
    switchNetwork,
  };
}
