import { Button } from "@/components/ui/button";
import { ArrowUpRight, Blocks, CheckCircle2, ChevronDown, Github, Network, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen overflow-hidden bg-[#061014] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(34,211,238,0.13),transparent_25%),radial-gradient(circle_at_15%_80%,rgba(45,212,191,0.1),transparent_28%)]" />
      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-300 to-cyan-300 text-slate-950"><Blocks className="h-5 w-5" /></span>
          <span className="font-display text-lg font-bold tracking-[-0.04em]">VeriSettle</span>
        </button>
        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <a href="#how-it-works" className="transition-colors hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Protocol flow</a>
          <a href="#security" className="transition-colors hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Security boundary</a>
          <a href="https://docs.creditcoin.org/attestcoin-protocol.md" target="_blank" rel="noreferrer" className="transition-colors hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Attestcoin docs</a>
        </nav>
        <Button onClick={() => setLocation("/app")} className="bg-white text-slate-950 hover:bg-cyan-50">Launch app <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:pt-24">
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-300" /> Powered by Attestcoin Protocol
            </div>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">Settle when proof, not promises, arrives.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              VeriSettle turns a verified Ethereum Sepolia acceptance event into a Creditcoin escrow decision. Every release is traceable to an Attestcoin proof policy—not an off-chain assertion.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => setLocation("/app")} className="bg-gradient-to-r from-teal-300 to-cyan-300 px-6 font-semibold text-slate-950 shadow-[0_0_32px_rgba(45,212,191,0.18)] hover:from-teal-200 hover:to-cyan-200">Create a testnet order <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="border-white/15 bg-white/[0.025] text-white hover:bg-white/[0.08]">See proof flow <ChevronDown className="ml-2 h-4 w-4" /></Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-300" /> Creditcoin CC3 Testnet</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-300" /> Ethereum Sepolia</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-300" /> Test assets only</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.12 }} className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-8 rounded-[2.5rem] bg-cyan-300/[0.06] blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-cyan-100/15 bg-[#0a1b21]/90 p-5 shadow-2xl backdrop-blur sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-teal-300" /><span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Settlement control plane</span></div>
                <span className="rounded-full bg-teal-300/10 px-2.5 py-1 text-xs font-semibold text-teal-100">Proof verified</span>
              </div>
              <div className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0">
                {[['1','Funded','Creditcoin escrow receives test assets'],['2','Attested','Sepolia event proof is verified by ASC'],['3','Released','Policy-authorized settlement executes']].map(([step, title, text], index) => (
                  <div key={title} className="contents">
                    <div className="relative flex w-8 justify-center"><span className="z-10 grid h-8 w-8 place-items-center rounded-full border border-cyan-200/30 bg-[#102a32] text-xs font-bold text-cyan-100">{step}</span>{index < 2 && <span className="absolute top-8 h-12 w-px bg-gradient-to-b from-cyan-200/35 to-teal-300/15" />}</div>
                    <div className="pb-7"><p className="font-display text-base font-semibold text-white">{title}</p><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-cyan-100/10 bg-[#071216] px-4 py-3 font-mono text-xs text-cyan-100/80">0x7aA1…e42B <span className="mx-2 text-slate-600">→</span> Attestcoin verified</div>
            </div>
          </motion.div>
        </section>

        <section id="how-it-works" className="mt-28 scroll-mt-8 grid gap-5 md:grid-cols-3">
          {[
            [Network, 'Anchor the order', 'Buyer and seller terms create a Creditcoin settlement policy with a unique order nonce.'],
            [ShieldCheck, 'Verify the source event', 'Attestcoin validates the successful Sepolia transaction and its expected event data on Creditcoin.'],
            [CheckCircle2, 'Settle transparently', 'The escrow lifecycle becomes Released, Refunded, or Disputed with immutable timeline evidence.'],
          ].map(([Icon, title, text], index) => {
            const FeatureIcon = Icon as typeof Network;
            return <article key={title as string} className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 transition-colors hover:border-cyan-200/20 hover:bg-cyan-200/[0.035]"><span className="mb-7 grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-100"><FeatureIcon className="h-5 w-5" /></span><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">0{index + 1}</p><h2 className="mt-3 font-display text-xl font-semibold text-white">{title as string}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{text as string}</p></article>;
          })}
        </section>

        <section id="security" className="mt-20 grid gap-8 rounded-[2rem] border border-teal-200/10 bg-gradient-to-br from-teal-300/[0.075] to-cyan-300/[0.025] p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-100">Clear trust boundary</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.045em] text-white">The protocol proves an on-chain acceptance event—not physical delivery.</h2></div>
          <div className="space-y-4 text-sm leading-7 text-slate-300"><p>VeriSettle checks source transaction inclusion, successful receipt status, expected event details, and one-time proof use before a settlement action is allowed.</p><p>For the hackathon prototype, every asset and contract interaction occurs on public testnet. The proof path is a real Attestcoin verification and settlement flow, not a decorative hash record.</p><a href="https://github.com/gluwa/usc-testnet-bridge-examples" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-cyan-100 hover:text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Review official bridge examples <Github className="h-4 w-4" /></a></div>
        </section>
      </main>
      <footer className="relative border-t border-white/8 px-5 py-7 text-center text-xs text-slate-500">VeriSettle is a Creditcoin testnet demonstration. It does not custody real funds or verify physical delivery.</footer>
    </div>
  );
}
