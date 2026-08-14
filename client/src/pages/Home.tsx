import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight, Blocks, CheckCircle2, Github, LockKeyhole, Network, ShieldCheck, UserCheck, WalletCards } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ProofEvidenceLedger } from "@/components/ProofEvidenceLedger";
import { AttestationOrbit } from "@/components/AttestationOrbit";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="veri-shell min-h-screen overflow-x-clip text-white">
      <a href="#landing-content" className="sr-only z-50 rounded-md bg-cyan-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to settlement overview</a>
      <div className="veri-aurora pointer-events-none fixed inset-0" />
      <AttestationOrbit />
      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-300 to-cyan-300 text-slate-950"><Blocks className="h-5 w-5" /></span>
          <span className="font-display text-lg font-bold tracking-[-0.04em]">VeriSettle</span>
        </button>
        <nav aria-label="Landing navigation" className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <a href="#execution" className="transition-colors hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Execution path</a>
          <a href="#evidence" className="transition-colors hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Testnet evidence</a>
          <a href="#security" className="transition-colors hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Trust boundary</a>
          <a href="https://docs.creditcoin.org/attestcoin-protocol.md" target="_blank" rel="noreferrer" className="transition-colors hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Attestcoin docs</a>
        </nav>
        <Button onClick={() => setLocation("/app")} className="veri-action bg-white text-slate-950 hover:bg-cyan-50">Launch app <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
      </header>

      <main id="landing-content" className="relative mx-auto max-w-7xl px-5 pb-24 pt-12 sm:px-8 sm:pt-20 lg:pt-24">
        <section className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-300" /> Powered by Attestcoin Protocol
            </div>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">Release escrow only when the chain can explain why.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              A buyer accepts a purchase order on Ethereum Sepolia. Attestcoin proves that exact receipt to Creditcoin. Only then can the matching escrow release.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => setLocation("/app")} className="veri-action bg-gradient-to-r from-teal-300 to-cyan-300 px-6 font-semibold text-slate-950 shadow-[0_0_32px_rgba(45,212,191,0.18)] hover:from-teal-200 hover:to-cyan-200">Launch settlement workspace <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth" })} className="veri-action border-white/15 bg-white/[0.025] text-white hover:bg-white/[0.08]">Review real evidence <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-300" /> Creditcoin CC3 Testnet</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-300" /> Ethereum Sepolia</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-300" /> Test assets only</span>
            </div>
            <div aria-label="Settlement roles" className="mt-7 max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#061014]/60">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Two-party settlement model</p><span className="text-[11px] font-medium text-teal-100">Role-bound on-chain</span></div>
              <div className="grid gap-px bg-white/10 sm:grid-cols-2"><div className="bg-[#061014] p-3.5"><p className="flex items-center gap-2 text-xs font-semibold text-cyan-100"><UserCheck className="h-3.5 w-3.5" /> Buyer authority</p><p className="mt-2 text-xs leading-5 text-slate-400">Funds the matching CC3 escrow, then signs the exact Sepolia acceptance.</p></div><div className="bg-[#061014] p-3.5"><p className="flex items-center gap-2 text-xs font-semibold text-teal-100"><WalletCards className="h-3.5 w-3.5" /> Seller entitlement</p><p className="mt-2 text-xs leading-5 text-slate-400">Receives CC3 settlement only when the proof binds both roles and terms.</p></div></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.12 }} className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-8 rounded-[2.5rem] bg-cyan-300/[0.06] blur-3xl" />
            <ProofEvidenceLedger />
          </motion.div>
        </section>

        <section id="execution" className="mt-28 scroll-mt-8 border-y border-white/10 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="veri-kicker">Execution path</p>
              <h2 className="mt-3 max-w-md font-display text-4xl font-semibold tracking-[-0.055em] text-white">One commercial decision. Three independent checks.</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">The user sees a purchase order. The protocol sees a terms hash, a source receipt, and a proof query that can only settle once.</p>
            </div>
            <ol className="space-y-0">
              {[
                [Network, "Lock the two-party terms", "The buyer funds native tCTC escrow against a seller address, order ID, and exact shared terms hash."],
                [ShieldCheck, "Prove buyer acceptance", "The trusted Sepolia emitter records the buyer’s exact approval; Attestcoin verifies receipt status and event semantics on CC3."],
                [LockKeyhole, "Release to the seller exactly once", "The ASC consumes the proof query and releases only the matching seller escrow; replays are rejected on-chain."],
              ].map(([Icon, title, text], index) => {
                const StepIcon = Icon as typeof Network;
                return <li key={title as string} className="group grid grid-cols-[auto_1fr] gap-x-5 border-t border-white/10 py-6 first:border-t-0 first:pt-0">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-cyan-200/20 bg-cyan-200/[0.06] text-cyan-100"><StepIcon className="h-5 w-5" /></span>
                  <div><p className="font-display text-lg font-semibold text-white"><span className="mr-3 font-mono text-xs font-medium text-teal-200/70">0{index + 1}</span>{title as string}</p><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{text as string}</p></div>
                </li>;
              })}
            </ol>
          </div>
        </section>

        <section id="security" className="mt-20 grid gap-8 rounded-[2rem] border border-teal-200/10 bg-gradient-to-br from-teal-300/[0.075] to-cyan-300/[0.025] p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-100">Clear trust boundary</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.045em] text-white">The protocol proves an on-chain acceptance event—not physical delivery.</h2></div>
          <div className="space-y-4 text-sm leading-7 text-slate-300"><p>VeriSettle checks source transaction inclusion, successful receipt status, expected event details, terms binding, and one-time proof use before a settlement action is allowed.</p><p>Every asset and contract interaction in this prototype occurs on public testnet. The proof path is a real Attestcoin verification and settlement flow, not a decorative hash record.</p><a href="https://github.com/gluwa/usc-testnet-bridge-examples" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-cyan-100 hover:text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Review official bridge examples <Github className="h-4 w-4" /></a></div>
        </section>
      </main>
      <footer className="relative border-t border-white/8 px-5 py-7 text-center text-xs text-slate-500">VeriSettle is a Creditcoin testnet demonstration. It does not custody real funds or verify physical delivery.</footer>
    </div>
  );
}
