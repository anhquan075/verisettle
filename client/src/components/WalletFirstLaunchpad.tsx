import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWalletAccess } from "@/hooks/useWalletAccess";
import { trpc } from "@/lib/trpc";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Check, CircleAlert, ExternalLink, Loader2, RefreshCw, Route, ShieldCheck, WalletCards } from "lucide-react";
import { useState } from "react";

const OFFICIAL_CC3_FAUCET = "https://discord.gg/creditcoin";
const OFFICIAL_SEPOLIA_FAUCET = "https://cloud.google.com/application/web3/faucet/ethereum/sepolia";

function RouteStep({ complete, number, title, detail }: { complete: boolean; number: string; title: string; detail: string }) {
  return (
    <li className="flex gap-3">
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${complete ? "border-teal-200/40 bg-teal-300 text-slate-950" : "border-white/12 bg-white/[0.04] text-slate-400"}`}>{complete ? <Check className="h-3.5 w-3.5" /> : number}</span>
      <div><p className="text-sm font-semibold text-white">{title}</p><p className="mt-0.5 text-xs leading-5 text-slate-400">{detail}</p></div>
    </li>
  );
}

export function WalletFirstLaunchpad({ onCreateOrder }: { onCreateOrder: () => void }) {
  const wallet = useWalletAccess();
  const { user, refresh } = useAuth();
  const utils = trpc.useUtils();
  const [cc3Checked, setCc3Checked] = useState(false);
  const [sepoliaChecked, setSepoliaChecked] = useState(false);
  const status = trpc.testnetFunding.status.useQuery(
    { walletAddress: wallet.address ?? "0x0000000000000000000000000000000000000000" },
    { enabled: Boolean(wallet.address && user?.sessionKind === "siwe"), retry: false },
  );
  const claim = trpc.testnetFunding.claim.useMutation({ onSuccess: () => void utils.testnetFunding.status.invalidate() });
  const signedIn = user?.sessionKind === "siwe";
  const funding = status.data?.request;
  const claimComplete = funding?.status === "complete";
  const networksReady = cc3Checked && sepoliaChecked;

  const signInWithWallet = async () => {
    if (await wallet.signIn()) await refresh();
  };
  const verifyNetwork = async (network: "creditcoin" | "sepolia") => {
    const switched = await wallet.switchNetwork(network);
    if (switched) network === "creditcoin" ? setCc3Checked(true) : setSepoliaChecked(true);
  };
  const requestFunding = async () => {
    if (wallet.address && signedIn) await claim.mutateAsync({ walletAddress: wallet.address });
  };

  return (
    <section id="wallet-launchpad" aria-label="Wallet sign-in" className="relative overflow-hidden rounded-[1.75rem] border border-cyan-100/15 bg-[#061116] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] sm:p-8">
      <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-cyan-300/[0.08] blur-3xl" />
      <div className="relative mx-auto max-w-4xl">
        <header className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-cyan-300/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100"><ShieldCheck className="h-3.5 w-3.5" /> Secure wallet sign-in</p>
          <h2 className="mt-4 font-veri-display text-3xl font-semibold tracking-[-0.065em] text-white sm:text-4xl">Connect once. <span className="text-cyan-200">Follow the proof.</span></h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Choose a wallet, sign a secure session message, then verify each testnet before you act. Sign-in never asks for a key, recovery phrase, or transaction approval.</p>
        </header>

        <div className="mt-7 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
            {!wallet.address ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100">Step 1 of 3 · Choose a wallet</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Start with your testnet wallet.</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">The secure wallet picker supports injected wallets and WalletConnect. Connecting shares only your public address.</p>
                <ConnectButton.Custom>{({ mounted, openConnectModal }) => <Button onClick={openConnectModal} disabled={!mounted} className="veri-action mt-5 bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"><WalletCards className="mr-2 h-4 w-4" />Choose wallet</Button>}</ConnectButton.Custom>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <Button type="button" size="sm" variant="ghost" onClick={() => void wallet.refreshAccount()} disabled={wallet.busy} className="veri-action px-0 text-xs font-semibold text-slate-300 hover:bg-transparent hover:text-cyan-100"><RefreshCw className={`mr-2 h-3.5 w-3.5 ${wallet.busy ? "animate-spin" : ""}`} />Refresh wallet access</Button>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Use this after unlocking your extension or approving VeriSettle in its Connected sites list. It does not request a signature or send a transaction.</p>
                </div>
              </div>
            ) : !signedIn ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100">Step 2 of 3 · Sign in</p>
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-cyan-100/12 bg-cyan-300/[0.045] p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-100"><WalletCards className="h-4 w-4" /></span>
                  <div className="min-w-0"><p className="text-sm font-semibold text-white">{wallet.extension ?? "Connected wallet"}</p><p className="truncate font-mono text-xs text-cyan-100">{wallet.address}</p></div>
                  <Button type="button" size="sm" variant="ghost" onClick={wallet.changeWallet} disabled={wallet.busy} className="veri-action ml-auto text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white">Change</Button>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">Prove you control this address.</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">Your wallet will show a VeriSettle sign-in message. It creates a 24-hour session and does not send a transaction.</p>
                <Button onClick={() => void signInWithWallet()} disabled={wallet.busy} className="veri-action mt-5 bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"><ShieldCheck className="mr-2 h-4 w-4" />{wallet.busy ? "Waiting for wallet…" : "Sign in with wallet"}</Button>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-100">Session verified</p>
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-teal-200/18 bg-teal-300/[0.055] p-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-300 text-slate-950"><Check className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-white">Wallet session ready</p><p className="font-mono text-xs text-teal-100">{wallet.address}</p></div></div>
                <h3 className="mt-4 text-lg font-semibold text-white">Check the two testnets.</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">Switch to CC3 for escrow, then Sepolia for acceptance. Only your wallet can approve each network switch.</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2"><Button size="sm" onClick={() => void verifyNetwork("creditcoin")} disabled={wallet.busy} variant="outline" className="veri-action justify-start border-white/10 text-slate-100 hover:bg-white/[0.05]">{cc3Checked && <Check className="mr-2 h-3.5 w-3.5 text-teal-200" />}Check CC3</Button><Button size="sm" onClick={() => void verifyNetwork("sepolia")} disabled={wallet.busy} variant="outline" className="veri-action justify-start border-white/10 text-slate-100 hover:bg-white/[0.05]">{sepoliaChecked && <Check className="mr-2 h-3.5 w-3.5 text-teal-200" />}Check Sepolia</Button></div>
                {networksReady && <div className="mt-4 rounded-xl border border-cyan-100/10 bg-cyan-300/[0.035] p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-cyan-50">One-time starter balance</p>{status.isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-100" />}</div><p className="mt-1 text-xs leading-5 text-slate-400">{status.data ? `${status.data.drip.cc3Tctc} tCTC + ${status.data.drip.sepoliaEth} Sepolia ETH. Sent once per verified wallet-linked account.` : "Checking your eligibility…"}</p>{!funding && <Button size="sm" onClick={() => void requestFunding()} disabled={claim.isPending || status.isLoading || status.isError} className="veri-action mt-3 w-full bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">{claim.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Claim small test balance</Button>}{funding?.cc3TxHash && <a className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-100 hover:text-cyan-50" href={`https://creditcoin-testnet.blockscout.com/tx/${funding.cc3TxHash}`} target="_blank" rel="noreferrer">View CC3 receipt <ExternalLink className="h-3 w-3" /></a>}{claim.error && <p role="alert" className="mt-2 text-xs leading-5 text-amber-100">{claim.error.message}</p>}</div>}
              </div>
            )}
            {wallet.error && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-amber-200/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-50"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" /><span><strong>{wallet.error.title}.</strong> {wallet.error.detail}</span></div>}
          </div>

          <aside className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Your route</p>
            <ol className="mt-4 space-y-5"><RouteStep complete={Boolean(wallet.address)} number="1" title="Connect" detail="Select a testnet wallet in the maintained connection modal." /><RouteStep complete={signedIn} number="2" title="Sign in" detail="Approve one Verisettle session message—never a transaction." /><RouteStep complete={networksReady} number="3" title="Verify readiness" detail="Check CC3 and Sepolia before funding or settlement actions." /></ol>
            <div className="mt-6 border-t border-white/10 pt-4"><Button onClick={onCreateOrder} variant="ghost" className="veri-action h-auto w-full justify-start px-0 text-sm font-semibold text-cyan-100 hover:bg-transparent hover:text-cyan-50">Explore the proof flow <Route className="ml-2 h-4 w-4" /></Button><div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs"><a className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-100" href={OFFICIAL_CC3_FAUCET} target="_blank" rel="noreferrer">CC3 official faucet <ExternalLink className="h-3 w-3" /></a><a className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-100" href={OFFICIAL_SEPOLIA_FAUCET} target="_blank" rel="noreferrer">Sepolia official faucet <ExternalLink className="h-3 w-3" /></a></div></div>
          </aside>
        </div>
      </div>
    </section>
  );
}
