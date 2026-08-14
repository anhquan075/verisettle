import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUpRight, Github, LockKeyhole, Network, ShieldCheck, Sparkles, UserCheck, WalletCards } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ProofEvidenceLedger } from "@/components/ProofEvidenceLedger";
import { AttestationOrbit } from "@/components/AttestationOrbit";
import { VeriSettleBrand } from "@/components/VeriSettleBrand";

const stages = [
  ["01", Network, "Fund the exact terms", "A buyer locks native tCTC against the order ID, seller, and committed commercial terms."],
  ["02", ShieldCheck, "Prove the acceptance", "The configured Sepolia event is checked for its receipt, emitter, buyer, seller, and terms binding."],
  ["03", LockKeyhole, "Release once", "The CC3 ASC releases only after Attestcoin accepts the proof. A replay is rejected on-chain."],
] as const;

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="veri-shell min-h-screen overflow-x-clip text-white">
      <a href="#landing-content" className="sr-only z-50 rounded-md bg-cyan-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to settlement overview</a>
      <div className="veri-aurora pointer-events-none fixed inset-0" />
      <AttestationOrbit />

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <button onClick={() => setLocation("/")} aria-label="VeriSettle home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          <span className="sm:hidden"><VeriSettleBrand compact /></span>
          <span className="hidden sm:inline-flex"><VeriSettleBrand /></span>
        </button>
        <nav aria-label="Landing navigation" className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 text-sm text-slate-300 md:flex">
          <a href="#execution" className="rounded-full px-3 py-2 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">How it works</a>
          <a href="#evidence" className="rounded-full px-3 py-2 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Proof record</a>
          <a href="#security" className="rounded-full px-3 py-2 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Boundary</a>
        </nav>
        <Button onClick={() => setLocation("/app")} className="veri-action shrink-0 bg-white text-slate-950 hover:bg-cyan-50">Open workspace <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
      </header>

      <main id="landing-content" className="relative mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8 sm:pt-16 lg:pt-20">
        <section className="grid gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/[0.09] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100"><Sparkles className="h-3.5 w-3.5" /> Attestcoin-governed escrow</div>
            <h1 className="mt-6 max-w-3xl font-veri-display text-[3.35rem] font-semibold leading-[0.9] tracking-[-0.08em] text-white sm:text-6xl lg:text-7xl">Proof first.<br /><span className="text-cyan-200">Release once.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Sepolia approval. Attestcoin proof. Creditcoin release.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" onClick={() => setLocation("/app")} className="veri-action bg-cyan-300 px-6 font-semibold text-slate-950 shadow-[0_0_32px_rgba(45,212,191,0.2)] hover:bg-cyan-200">Create a protected order <ArrowUpRight className="ml-2 h-4 w-4" /></Button><Button size="lg" variant="outline" onClick={() => document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth" })} className="veri-action border-white/15 bg-white/[0.025] text-white hover:bg-white/[0.08]">Inspect the proof <ArrowDown className="ml-2 h-4 w-4" /></Button></div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="Settlement roles">
              <div className="veri-role-card veri-role-card--buyer"><UserCheck className="h-5 w-5" /><div><p>Buyer accepts</p><span>Sepolia receipt authorizes the proof.</span></div></div>
              <div className="veri-role-card veri-role-card--seller"><WalletCards className="h-5 w-5" /><div><p>Seller receives</p><span>CC3 releases after proof.</span></div></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.1 }} className="relative mx-auto w-full max-w-xl">
            <div className="veri-proof-canvas">
              <div className="veri-proof-canvas__top"><span>Live testnet route</span><span className="inline-flex items-center gap-1.5 text-teal-100"><span className="h-2 w-2 rounded-full bg-teal-300" /> Receipt-bound</span></div>
              <ol className="veri-live-route" aria-label="Live testnet source-to-settlement route"><li><span>01 · Source</span><strong>Ethereum Sepolia</strong><p>Buyer OrderAccepted receipt</p></li><li><span>02 · Verify</span><strong>Attestcoin ASC</strong><p>Receipt + terms + one-time proof</p></li><li><span>03 · Settle</span><strong>Creditcoin CC3</strong><p>Native tCTC escrow release</p></li></ol>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">No promise advances the order. Receipts do.</p>
            </div>
            <div className="relative -mt-3 ml-auto w-[92%] sm:-mt-5"><ProofEvidenceLedger /></div>
          </motion.div>
        </section>

        <section id="execution" className="mt-24 scroll-mt-8">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-16">
            <div className="veri-action-poster"><p className="veri-kicker">The controlled release</p><h2 className="mt-4 font-veri-display text-4xl font-semibold leading-[0.96] tracking-[-0.065em] text-white">One order.<br /><span className="text-teal-200">Three receipts.</span></h2><p className="mt-5 text-sm leading-7 text-slate-300">Every state change leaves a public trail.</p><Button onClick={() => setLocation("/app")} variant="outline" className="veri-action mt-7 border-cyan-200/25 text-cyan-100 hover:bg-cyan-300/10">Open workspace <ArrowUpRight className="ml-2 h-4 w-4" /></Button></div>
            <ol className="space-y-3">
              {stages.map(([number, Icon, title, body]) => <li key={number} className="veri-stage-card"><span className="veri-stage-card__number">{number}</span><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.06] text-cyan-100"><Icon className="h-5 w-5" /></span><div><h3 className="font-display text-xl font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></div></li>)}
            </ol>
          </div>
        </section>

        <section id="security" className="veri-boundary-statement mt-24 grid gap-8 rounded-[2rem] border border-teal-200/10 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-100">A deliberate boundary</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-white">A real receipt is not a claim of physical delivery.</h2></div>
          <div className="space-y-4 text-sm leading-7 text-slate-300"><p>VeriSettle checks source inclusion, receipt success, expected event semantics, terms binding, and one-time proof use before the settlement call is allowed.</p><p>Every contract interaction in this prototype uses public testnet assets. The evidence path is real; the physical-delivery claim is explicitly outside the protocol boundary.</p><a href="https://github.com/gluwa/usc-testnet-bridge-examples" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-cyan-100 hover:text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Review official bridge examples <Github className="h-4 w-4" /></a></div>
        </section>
      </main>
      <footer className="relative border-t border-white/8 px-5 py-7 text-center text-xs text-slate-500">VeriSettle / public testnet demonstration / no real-fund custody / no physical-delivery verification</footer>
    </div>
  );
}
