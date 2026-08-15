import { useWalletAccess } from "@/hooks/useWalletAccess";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Check, CircleAlert, ExternalLink, Loader2, Route, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { useState } from "react";

const OFFICIAL_CC3_FAUCET = "https://discord.gg/creditcoin";
const OFFICIAL_SEPOLIA_FAUCET = "https://cloud.google.com/application/web3/faucet/ethereum/sepolia";

function RailStep({ complete, label, detail }: { complete: boolean; label: string; detail: string }) {
  return (
    <li className={`rounded-xl border p-3 ${complete ? "border-teal-200/20 bg-teal-300/[0.06]" : "border-white/10 bg-black/10"}`}>
      <div className="flex items-center gap-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${complete ? "bg-teal-300 text-slate-950" : "bg-white/[0.07] text-slate-400"}`}>{complete ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span><p className="text-xs font-semibold text-white">{label}</p></div>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </li>
  );
}

export function WalletFirstLaunchpad({ onCreateOrder }: { onCreateOrder: () => void }) {
  const wallet = useWalletAccess();
  const utils = trpc.useUtils();
  const [cc3Checked, setCc3Checked] = useState(false);
  const [sepoliaChecked, setSepoliaChecked] = useState(false);
  const status = trpc.testnetFunding.status.useQuery({ walletAddress: wallet.address ?? "0x0000000000000000000000000000000000000000" }, { enabled: Boolean(wallet.address) });
  const claim = trpc.testnetFunding.claim.useMutation({ onSuccess: () => void utils.testnetFunding.status.invalidate() });
  const requestFunding = async () => {
    if (!wallet.address) return;
    await claim.mutateAsync({ walletAddress: wallet.address });
  };
  const signInWithWallet = async () => {
    if (await wallet.signIn()) await status.refetch();
  };
  const verifyNetwork = async (network: "creditcoin" | "sepolia") => {
    const switched = await wallet.switchNetwork(network);
    if (switched) network === "creditcoin" ? setCc3Checked(true) : setSepoliaChecked(true);
  };
  const funding = status.data?.request;
  const claimComplete = funding?.status === "complete";
  const linkedFundingReady = Boolean(wallet.address && cc3Checked && sepoliaChecked);

  return (
    <section id="wallet-launchpad" aria-label="Judge and first-time wallet launchpad" className="relative overflow-hidden rounded-[1.75rem] border border-cyan-100/15 bg-[linear-gradient(115deg,rgba(10,34,38,0.92),rgba(8,16,22,0.96)_55%,rgba(23,17,44,0.72))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />
      <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-cyan-300/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100"><Sparkles className="h-3.5 w-3.5" /> Judge-ready launchpad</div>
          <h2 className="mt-4 max-w-2xl font-veri-display text-3xl font-semibold leading-[0.96] tracking-[-0.065em] text-white sm:text-4xl">One wallet. One route.<br /><span className="text-cyan-200">Every action is real.</span></h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">Choose MetaMask, OKX Wallet, Binance Wallet, Rabby, or SubWallet, sign a wallet session, confirm each required testnet, then claim a small one-time starter balance or use the official faucet fallback. VeriSettle never asks for a key or recovery phrase.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {!wallet.address ? wallet.wallets.map((candidate) => <Button key={candidate.id} onClick={() => void wallet.connect(candidate.id)} disabled={wallet.busy} className={`veri-action font-semibold ${wallet.selectedWallet?.id === candidate.id ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200" : "border border-cyan-100/20 bg-black/10 text-cyan-50 hover:bg-cyan-300/10"}`}><WalletCards className="mr-2 h-4 w-4" />{wallet.busy && wallet.selectedWallet?.id === candidate.id ? "Connecting…" : `Connect ${candidate.name}`}</Button>) : <Button onClick={() => void signInWithWallet()} disabled={wallet.busy} className="veri-action bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"><ShieldCheck className="mr-2 h-4 w-4" />{wallet.busy ? "Signing…" : `Sign in with ${wallet.extension ?? "wallet"}`}</Button>}
            <Button onClick={onCreateOrder} variant="outline" className="veri-action border-cyan-100/20 bg-black/10 text-cyan-50 hover:bg-cyan-300/10">Explore order flow <Route className="ml-2 h-4 w-4" /></Button>
          </div>
          {wallet.address && <p className="mt-4 font-mono text-xs text-cyan-100">Connected wallet · {wallet.address}</p>}
          {wallet.error && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-amber-200/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-50"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" /><span><strong>{wallet.error.title}.</strong> {wallet.error.detail}</span></div>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#050d11]/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Guided testnet route</p><p className="mt-1 text-sm font-semibold text-white">Complete the next unlocked step.</p></div><span className="rounded-full border border-violet-200/20 bg-violet-300/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-100">No simulation</span></div>
          <ol className="mt-4 grid gap-2">
            <RailStep complete={Boolean(wallet.address)} label="1 · Connect" detail="Use a MetaMask, OKX Wallet, Binance Wallet, Rabby, or SubWallet EIP-1193 account." />
            <RailStep complete={cc3Checked && sepoliaChecked} label="2 · Check networks" detail="Switch to CC3 for escrow and Sepolia for source acceptance; only one chain is active in a wallet at a time." />
            <RailStep complete={claimComplete} label="3 · Fund test account" detail={claimComplete ? "Both real starter drips were confirmed on chain." : "Claim once when the secured reserve is available; external faucets remain available."} />
            <RailStep complete={false} label="4 · Run the proof path" detail="Create terms, fund CC3 escrow, accept on Sepolia, then inspect the verified settlement evidence." />
          </ol>
          {wallet.address && <div className="mt-4 grid gap-2 sm:grid-cols-2"><Button size="sm" onClick={() => void verifyNetwork("creditcoin")} disabled={wallet.busy} variant="outline" className={`veri-action justify-start border-white/10 ${cc3Checked ? "text-teal-100" : "text-slate-200"}`}>{cc3Checked ? <Check className="mr-2 h-3.5 w-3.5" /> : null} Check CC3</Button><Button size="sm" onClick={() => void verifyNetwork("sepolia")} disabled={wallet.busy} variant="outline" className={`veri-action justify-start border-white/10 ${sepoliaChecked ? "text-teal-100" : "text-slate-200"}`}>{sepoliaChecked ? <Check className="mr-2 h-3.5 w-3.5" /> : null} Check Sepolia</Button></div>}
          {wallet.address && <div className="mt-3 rounded-xl border border-cyan-100/10 bg-cyan-300/[0.035] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-cyan-50">One-time starter balance</p>{status.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-100" /> : funding ? <span className="rounded-full bg-teal-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-teal-100">{funding.status}</span> : <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Eligible once</span>}</div><p className="mt-1 text-xs leading-5 text-slate-400">{status.data ? `${status.data.drip.cc3Tctc} tCTC + ${status.data.drip.sepoliaEth} Sepolia ETH, sent once per verified wallet-linked account.` : "Sign in with the connected wallet to check eligibility."}</p>{status.data?.claimedByAnotherLinkedWallet && <p className="mt-2 text-xs leading-5 text-amber-100">This wallet-linked account already used its one-time starter balance on another verified wallet. Official faucet top-up remains available below.</p>}{funding?.cc3TxHash && <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-100 hover:text-cyan-50" href={`https://creditcoin-testnet.blockscout.com/tx/${funding.cc3TxHash}`} target="_blank" rel="noreferrer">View CC3 receipt <ExternalLink className="h-3 w-3" /></a>}{!funding && <Button size="sm" onClick={() => void requestFunding()} disabled={!linkedFundingReady || claim.isPending || status.isLoading || status.isError} className="veri-action mt-3 w-full bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">{claim.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}{linkedFundingReady ? "Claim small test balance" : "Check both networks first"}</Button>}{claim.error && <p role="alert" className="mt-2 text-xs leading-5 text-amber-100">{claim.error.message}</p>}</div>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs"><a className="inline-flex items-center gap-1 font-semibold text-slate-300 hover:text-cyan-100" href={OFFICIAL_CC3_FAUCET} target="_blank" rel="noreferrer">CC3 official faucet <ExternalLink className="h-3 w-3" /></a><a className="inline-flex items-center gap-1 font-semibold text-slate-300 hover:text-cyan-100" href={OFFICIAL_SEPOLIA_FAUCET} target="_blank" rel="noreferrer">Sepolia official faucet <ExternalLink className="h-3 w-3" /></a></div>
        </div>
      </div>
    </section>
  );
}
