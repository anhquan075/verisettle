import { Button } from "@/components/ui/button";
import { useWalletAccess } from "@/hooks/useWalletAccess";
import { TESTNET_NETWORKS } from "@shared/contracts";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Check, CircleAlert, ExternalLink, Loader2, PlugZap, ShieldCheck, WalletCards } from "lucide-react";

type WalletNetwork = keyof typeof TESTNET_NETWORKS;

const networkLabel: Record<WalletNetwork, string> = {
  creditcoin: "Creditcoin CC3 Testnet",
  sepolia: "Ethereum Sepolia",
};

export function WalletReadinessPanel({
  requiredNetwork,
  signIn,
  onSignedIn,
  compact = false,
}: {
  requiredNetwork?: WalletNetwork;
  signIn?: boolean;
  onSignedIn?: () => void;
  compact?: boolean;
}) {
  const wallet = useWalletAccess();
  const ready = requiredNetwork ? wallet.readiness[requiredNetwork] : Boolean(wallet.address);
  const label = requiredNetwork ? networkLabel[requiredNetwork] : "Wallet";

  const handleSignIn = async () => {
    const signedIn = await wallet.signIn();
    if (signedIn) onSignedIn?.();
  };

  const recoverFromError = () => {
    if (!wallet.error) return;
    if (wallet.error.action === "connect") return void wallet.connect();
    if (wallet.error.action === "switch" && requiredNetwork) return void wallet.switchNetwork(requiredNetwork);
    return void handleSignIn();
  };

  if (!wallet.hasExtension) {
    return (
      <section aria-label="Wallet extension unavailable" className="rounded-2xl border border-amber-200/20 bg-amber-300/[0.045] p-4">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-amber-300/10 p-2 text-amber-100"><PlugZap className="h-4 w-4" /></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100">Wallet unavailable</p><h3 className="mt-1 text-sm font-semibold text-white">Install a supported EVM wallet.</h3><p className="mt-1 text-xs leading-5 text-slate-400">Use MetaMask, OKX Wallet, Binance Wallet, Rabby, or SubWallet with a testnet-only account. VeriSettle never requests keys or recovery phrases.</p><div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs font-semibold"><a className="veri-action inline-flex items-center gap-1 text-cyan-100 hover:text-cyan-50" href="https://metamask.io/download" target="_blank" rel="noreferrer">MetaMask <ExternalLink className="h-3 w-3" /></a><a className="veri-action inline-flex items-center gap-1 text-cyan-100 hover:text-cyan-50" href="https://www.okx.com/web3" target="_blank" rel="noreferrer">OKX Wallet <ExternalLink className="h-3 w-3" /></a><a className="veri-action inline-flex items-center gap-1 text-cyan-100 hover:text-cyan-50" href="https://www.binance.com/en/web3wallet" target="_blank" rel="noreferrer">Binance Wallet <ExternalLink className="h-3 w-3" /></a><a className="veri-action inline-flex items-center gap-1 text-cyan-100 hover:text-cyan-50" href="https://rabby.io" target="_blank" rel="noreferrer">Rabby <ExternalLink className="h-3 w-3" /></a><a className="veri-action inline-flex items-center gap-1 text-cyan-100 hover:text-cyan-50" href="https://www.subwallet.app" target="_blank" rel="noreferrer">SubWallet <ExternalLink className="h-3 w-3" /></a></div></div></div>
      </section>
    );
  }

  return (
    <section aria-live="polite" aria-label="Wallet and testnet readiness" className={`rounded-2xl border ${ready ? "border-cyan-200/18 bg-cyan-300/[0.045]" : "border-white/10 bg-white/[0.025]"} p-4`}>
      <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className={`rounded-xl p-2 ${ready ? "bg-cyan-300/10 text-cyan-100" : "bg-white/[0.06] text-slate-300"}`}>{ready ? <Check className="h-4 w-4" /> : <WalletCards className="h-4 w-4" />}</div><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100">{wallet.extension}</p><h3 className="mt-1 text-sm font-semibold text-white">{wallet.address ? (ready ? `${label} ready` : `${label} required`) : "Connect wallet"}</h3><p className="mt-1 font-mono text-xs text-slate-400">{wallet.address ? `${wallet.address.slice(0, 8)}…${wallet.address.slice(-6)}` : "No account connected"}</p></div></div>{ready && <ShieldCheck className="h-5 w-5 text-cyan-200" />}</div>
      {!compact && <p className="mt-3 text-xs leading-5 text-slate-400">{wallet.address ? (requiredNetwork && !ready ? `Switch before ${requiredNetwork === "creditcoin" ? "CC3 escrow" : "Sepolia acceptance"}.` : "Wallet actions require your own extension approval.") : "Connect a testnet account to check chain readiness. If the extension is already unlocked, refresh the account state below."}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {!wallet.address ? <ConnectButton.Custom>{({ mounted, openConnectModal }) => <Button type="button" size="sm" onClick={openConnectModal} disabled={!mounted || wallet.busy} className="veri-action bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"><WalletCards className="mr-2 h-3.5 w-3.5" />Choose wallet</Button>}</ConnectButton.Custom> : null}
        {wallet.address && requiredNetwork && !ready ? <Button type="button" size="sm" onClick={() => void wallet.switchNetwork(requiredNetwork)} disabled={wallet.busy} className="veri-action bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">{wallet.busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Switch to {requiredNetwork === "creditcoin" ? "CC3" : "Sepolia"}</Button> : null}
        {wallet.address && signIn ? <Button type="button" size="sm" onClick={() => void handleSignIn()} disabled={wallet.busy} className="veri-action bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">{wallet.busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Sign in with wallet</Button> : null}
      </div>
      {wallet.error && <div role="alert" aria-atomic="true" className="mt-3 rounded-xl border border-amber-200/15 bg-amber-300/[0.055] p-3 text-amber-50"><div className="flex items-start gap-2"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200" /><div><p className="text-xs font-semibold">{wallet.error.title}</p><p className="mt-1 text-xs leading-5 text-amber-100/80">{wallet.error.detail}</p></div></div>{wallet.error.kind !== "extension" && <Button type="button" size="sm" variant="outline" onClick={recoverFromError} disabled={wallet.busy} className="veri-action mt-3 border-amber-100/20 text-amber-50 hover:bg-amber-100/10">Try again</Button>}</div>}
    </section>
  );
}
