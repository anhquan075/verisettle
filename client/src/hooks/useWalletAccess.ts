import { trpc } from "@/lib/trpc";
import { describeWalletError, type WalletErrorNotice } from "@/lib/walletError";
import { TESTNET_NETWORKS } from "@shared/contracts";
import { getAddress } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";

type WalletNetwork = keyof typeof TESTNET_NETWORKS;

type Eip1193Provider = {
  isMetaMask?: boolean;
  isRabby?: boolean;
  isSubWallet?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isBinance?: boolean;
  isBinanceChain?: boolean;
  isBinanceWallet?: boolean;
  request: (request: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void) => void;
};

export type WalletProviderId = "metamask" | "okx" | "binance" | "rabby" | "subwallet" | "injected";

export type DiscoveredWallet = {
  id: WalletProviderId;
  name: string;
  provider: Eip1193Provider;
};

type Eip6963ProviderDetail = {
  info?: { name?: string; rdns?: string };
  provider?: Eip1193Provider;
};

const supportedWalletLabel = "MetaMask, OKX Wallet, Binance Wallet, Rabby, or SubWallet";

function classifyProvider(provider: Eip1193Provider, detail?: Eip6963ProviderDetail): DiscoveredWallet {
  const identity = `${detail?.info?.name ?? ""} ${detail?.info?.rdns ?? ""}`.toLowerCase();
  if (provider.isSubWallet || identity.includes("subwallet")) return { id: "subwallet", name: "SubWallet", provider };
  if (provider.isRabby || identity.includes("rabby")) return { id: "rabby", name: "Rabby", provider };
  if (provider.isOkxWallet || provider.isOKExWallet || identity.includes("okx") || identity.includes("okex")) return { id: "okx", name: "OKX Wallet", provider };
  if (provider.isBinance || provider.isBinanceChain || provider.isBinanceWallet || identity.includes("binance")) return { id: "binance", name: "Binance Wallet", provider };
  if (provider.isMetaMask || identity.includes("metamask")) return { id: "metamask", name: "MetaMask", provider };
  return { id: "injected", name: detail?.info?.name || "Browser wallet", provider };
}

function dedupeWallets(wallets: DiscoveredWallet[]) {
  const providers = new Set<Eip1193Provider>();
  const ids = new Set<WalletProviderId>();
  return wallets.filter((wallet) => {
    if (providers.has(wallet.provider) || (wallet.id !== "injected" && ids.has(wallet.id))) return false;
    providers.add(wallet.provider);
    ids.add(wallet.id);
    return true;
  });
}

function getInjectedWallets() {
  const ethereum = (window as Window & { ethereum?: Eip1193Provider & { providers?: Eip1193Provider[] } }).ethereum;
  if (!ethereum) return [];
  return dedupeWallets([...(ethereum.providers ?? []), ethereum].map((provider) => classifyProvider(provider)));
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
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<WalletProviderId | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<WalletErrorNotice | null>(null);
  const requestNonce = trpc.auth.wallet.requestNonce.useMutation();
  const verify = trpc.auth.wallet.verify.useMutation();
  const utils = trpc.useUtils();
  const selectedWallet = useMemo(() => wallets.find((wallet) => wallet.id === selectedWalletId) ?? wallets[0] ?? null, [selectedWalletId, wallets]);
  const provider = selectedWallet?.provider ?? null;

  const refresh = useCallback(async (nextProvider: Eip1193Provider, requestAccounts = false) => {
    const accounts = (await nextProvider.request({ method: requestAccounts ? "eth_requestAccounts" : "eth_accounts" })) as string[];
    const nextAddress = accounts[0] ? getAddress(accounts[0]) : null;
    const nextChainId = (await nextProvider.request({ method: "eth_chainId" })) as string;
    setAddress(nextAddress);
    setChainId(nextChainId);
    return { address: nextAddress, chainId: nextChainId };
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!provider) return null;
    setBusy(true);
    setError(null);
    try {
      return await refresh(provider);
    } catch (cause) {
      setError(describeWalletError(cause, "Unlock the selected wallet account, then refresh its account state.", "retry"));
      return null;
    } finally {
      setBusy(false);
    }
  }, [provider, refresh]);

  useEffect(() => {
    const registerWallets = (nextWallets: DiscoveredWallet[]) => {
      if (!nextWallets.length) return;
      setWallets((current) => dedupeWallets([...current, ...nextWallets]));
    };
    registerWallets(getInjectedWallets());
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
      if (detail?.provider) registerWallets([classifyProvider(detail.provider, detail)]);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const retryDiscovery = window.setTimeout(() => registerWallets(getInjectedWallets()), 350);
    const lateRetryDiscovery = window.setTimeout(() => registerWallets(getInjectedWallets()), 1200);
    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
      window.clearTimeout(retryDiscovery);
      window.clearTimeout(lateRetryDiscovery);
    };
  }, []);

  useEffect(() => {
    if (!provider) return;
    void refresh(provider).catch(() => undefined);
    const onAccountsChanged = () => void refresh(provider).catch(() => undefined);
    const onChainChanged = () => void refresh(provider).catch(() => undefined);
    provider.on?.("accountsChanged", onAccountsChanged);
    provider.on?.("chainChanged", onChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [provider, refresh]);

  const connect = useCallback(async (walletId?: WalletProviderId) => {
    const targetWallet = walletId ? wallets.find((wallet) => wallet.id === walletId) : selectedWallet;
    if (!targetWallet) {
      setError({ kind: "extension", title: "Wallet extension unavailable", detail: `Install ${supportedWalletLabel}, then return to this testnet workspace.`, action: "connect" });
      return null;
    }
    setSelectedWalletId(targetWallet.id);
    setBusy(true);
    setError(null);
    try {
      return await refresh(targetWallet.provider, true);
    } catch (cause) {
      setError(describeWalletError(cause, "Unlock your wallet and choose a testnet account to continue.", "connect"));
      return null;
    } finally {
      setBusy(false);
    }
  }, [refresh, selectedWallet, wallets]);

  const switchNetwork = useCallback(async (network: WalletNetwork) => {
    if (!provider) {
      setError({ kind: "extension", title: "Wallet extension unavailable", detail: `Install ${supportedWalletLabel}, then return to this testnet workspace.`, action: "connect" });
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
      setError({ kind: "extension", title: "Wallet extension unavailable", detail: `Install ${supportedWalletLabel} before requesting a secure wallet sign-in.`, action: "connect" });
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      const connection = await refresh(provider, true);
      if (!connection.address || !connection.chainId) throw new Error("Connect a wallet account before signing in.");
      const challenge = await requestNonce.mutateAsync({ address: connection.address, chainId: Number.parseInt(connection.chainId, 16) });
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

  return { address, busy, chainId, error, extension: selectedWallet?.name ?? null, hasExtension: wallets.length > 0, readiness, wallets, selectedWallet, connect, refreshAccount, signIn, switchNetwork };
}
