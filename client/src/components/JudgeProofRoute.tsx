import { ArrowUpRight, CheckCircle2, Landmark, LockKeyhole, ShieldCheck, UserCheck, WalletCards } from "lucide-react";
import { V2_GOVERNED_POLICY_MANIFEST } from "@shared/v2PolicyManifest";

const checkpoints = [
  {
    step: "01",
    title: "Buyer funds exact terms",
    detail: "Native tCTC is locked on Creditcoin CC3 against the order, parties, and terms hash.",
    Icon: WalletCards,
    tone: "text-cyan-100 bg-cyan-300/[0.08] border-cyan-200/15",
  },
  {
    step: "02",
    title: "Buyer accepts delivery",
    detail: "The trusted Sepolia source emits the acceptance receipt bound to the same order terms.",
    Icon: UserCheck,
    tone: "text-teal-100 bg-teal-300/[0.08] border-teal-200/15",
  },
  {
    step: "03",
    title: "Proof releases once",
    detail: "Attestcoin verifies the receipt on CC3. A replayed query is rejected before escrow can move again.",
    Icon: LockKeyhole,
    tone: "text-violet-100 bg-violet-300/[0.08] border-violet-200/15",
  },
] as const;

const receipts = [
  {
    label: "CC3 escrow funded",
    hash: "0x6975…1d94",
    href: "https://creditcoin-testnet.blockscout.com/tx/0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94",
  },
  {
    label: "Sepolia acceptance emitted",
    hash: "0x4b6c…1d18",
    href: "https://sepolia.etherscan.io/tx/0x4b6c2c2645cea40926839e15b63c61e90d6539053a4cce3d3e68ce2f92de1d18",
  },
  {
    label: "CC3 Attestcoin release",
    hash: "0x0e8c…d6df",
    href: "https://creditcoin-testnet.blockscout.com/tx/0x0e8c31dc7d8d42066e4285d2362547a5f2cbcd1ca53a2a1662234d657b3dd6df",
  },
] as const;

export function JudgeProofRoute() {
  return (
    <section id="judge-route" tabIndex={-1} className="scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-cyan-200/15 bg-[#071216] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-labelledby="judge-route-heading">
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_84%_10%,rgba(45,212,191,0.14),transparent_34%),linear-gradient(110deg,rgba(6,28,34,0.96),rgba(7,18,22,0.96))] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="veri-kicker">Judge route / real testnet evidence</p>
            <h2 id="judge-route-heading" className="mt-3 font-veri-display text-3xl font-semibold leading-[0.96] tracking-[-0.06em] text-white">A delivery receipt becomes<br /><span className="text-cyan-200">a seller payment—once.</span></h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">This is the complete settlement claim in under ninety seconds: fund exact terms, accept delivery, verify the receipt, then release the escrow. The links below are completed public-testnet transactions, not illustrative states.</p>
          </div>
          <a href="/protocol" className="veri-action inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-200/25 bg-cyan-300/[0.08] px-4 py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Inspect live contracts <ArrowUpRight className="h-4 w-4" /></a>
        </div>
      </div>

      <div className="grid gap-px bg-white/10 md:grid-cols-3">
        {checkpoints.map(({ step, title, detail, Icon, tone }) => (
          <article key={step} className="bg-[#091216] p-5 sm:p-6">
            <div className="flex items-center justify-between"><span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-slate-500">{step} / 03</span><span className={`grid h-9 w-9 place-items-center rounded-xl border ${tone}`}><Icon className="h-4.5 w-4.5" /></span></div>
            <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_0.78fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Open the completed evidence</p>
          <div className="mt-3 grid gap-2">
            {receipts.map(receipt => <a key={receipt.label} href={receipt.href} target="_blank" rel="noreferrer" className="veri-action group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 transition-colors hover:border-cyan-200/25 hover:bg-cyan-300/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><span><span className="block text-sm font-semibold text-white">{receipt.label}</span><span className="mt-1 block font-mono text-[11px] text-cyan-100">{receipt.hash}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-100" /></a>)}
          </div>
        </div>
        <aside className="rounded-2xl border border-teal-200/15 bg-teal-300/[0.055] p-5">
          <div className="flex items-center gap-2 text-teal-100"><ShieldCheck className="h-5 w-5" /><p className="text-sm font-semibold">The proof boundary</p></div>
          <p className="mt-3 text-sm leading-6 text-slate-300">Release requires receipt success, expected emitter and event semantics, buyer and seller binding, the committed terms hash, and a previously unused query.</p>
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-teal-50"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />The verified proof cannot be replayed to release the same escrow twice.</p>
        </aside>
      </div>

      <div className="border-t border-fuchsia-200/15 bg-[linear-gradient(115deg,rgba(71,19,89,0.24),rgba(7,18,22,0.96)_58%)] p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-2xl items-start gap-3">
            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-fuchsia-200/20 bg-fuchsia-300/[0.09] text-fuchsia-100"><Landmark className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-fuchsia-100/80">Governed recovery / deployed V3 route</p>
              <h3 className="mt-2 text-lg font-semibold text-white">A disputed escrow needs 2 of 3 independent approvals.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">The governed successor separates dispute authority from the escrow contract. A single signer cannot release or refund funds; the bound action must reach the immutable two-of-three threshold.</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:w-[23rem]">
            <a href={`https://creditcoin-testnet.blockscout.com/tx/${V2_GOVERNED_POLICY_MANIFEST.governance.deploymentTxHash}`} target="_blank" rel="noreferrer" className="veri-action rounded-xl border border-fuchsia-200/20 bg-fuchsia-300/[0.08] px-4 py-3 text-left transition-colors hover:bg-fuchsia-300/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-200"><span className="block text-xs font-semibold text-fuchsia-50">2-of-3 multisig</span><span className="mt-1 block font-mono text-[10px] text-fuchsia-100/70">{V2_GOVERNED_POLICY_MANIFEST.governance.address.slice(0, 8)}…{V2_GOVERNED_POLICY_MANIFEST.governance.address.slice(-4)} <ArrowUpRight className="inline h-3 w-3" /></span></a>
            <a href={`https://creditcoin-testnet.blockscout.com/tx/${V2_GOVERNED_POLICY_MANIFEST.escrowAsc.deploymentTxHash}`} target="_blank" rel="noreferrer" className="veri-action rounded-xl border border-fuchsia-200/20 bg-fuchsia-300/[0.08] px-4 py-3 text-left transition-colors hover:bg-fuchsia-300/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-200"><span className="block text-xs font-semibold text-fuchsia-50">Governed escrow ASC</span><span className="mt-1 block font-mono text-[10px] text-fuchsia-100/70">{V2_GOVERNED_POLICY_MANIFEST.escrowAsc.address.slice(0, 8)}…{V2_GOVERNED_POLICY_MANIFEST.escrowAsc.address.slice(-4)} <ArrowUpRight className="inline h-3 w-3" /></span></a>
          </div>
        </div>
      </div>
    </section>
  );
}
