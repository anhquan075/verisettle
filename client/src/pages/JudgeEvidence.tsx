import { ArrowLeft, ArrowUpRight, Check, CheckCircle2, Copy, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { AttestationOrbit } from "@/components/AttestationOrbit";
import { ProofFieldBackground } from "@/components/ProofFieldBackground";
import { JudgeProofRoute } from "@/components/JudgeProofRoute";
import { VeriSettleBrand } from "@/components/VeriSettleBrand";
import { Button } from "@/components/ui/button";

export default function JudgeEvidence() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const copyEvidenceLink = async () => {
    const canonicalLink = `${window.location.origin}/judge`;
    try {
      await navigator.clipboard.writeText(canonicalLink);
      setCopied(true);
      toast.success("Evidence link copied", { description: "No wallet needed." });
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      toast.error("Copy unavailable", { description: "Copy the Judge Evidence URL from your browser address bar." });
    }
  };

  return (
    <div className="veri-shell min-h-screen overflow-x-clip text-white">
      <a href="#judge-evidence" className="sr-only z-50 rounded-md bg-cyan-200 px-3 py-2 text-sm font-semibold text-[#062126] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to evidence</a>
      <div className="veri-aurora pointer-events-none fixed inset-0" />
      <ProofFieldBackground variant="judge" />
      <AttestationOrbit />
      <header className="sticky top-0 z-40 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-b border-white/[0.06] bg-[#061014]/88 px-5 py-4 shadow-[0_12px_34px_rgba(2,10,14,0.26)] backdrop-blur-xl sm:px-8">
        <button onClick={() => setLocation("/")} aria-label="Back to VeriSettle landing page" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><span className="sm:hidden"><VeriSettleBrand compact /></span><span className="hidden sm:inline-flex"><VeriSettleBrand /></span></button>
        <div className="flex items-center gap-2 sm:gap-3"><span className="hidden rounded-full border border-teal-200/15 bg-teal-300/[0.06] px-3 py-1.5 text-xs font-semibold text-teal-100 sm:inline">No wallet</span><Button size="sm" variant="outline" onClick={() => void copyEvidenceLink()} className="veri-action border-white/15 bg-white/[0.025] px-2.5 text-white hover:bg-white/[0.08] sm:px-3" aria-label="Copy public Judge Evidence link">{copied ? <Check className="h-3.5 w-3.5 text-teal-100" /> : <Copy className="h-3.5 w-3.5" />}<span className="hidden sm:ml-1.5 sm:inline">{copied ? "Link copied" : "Copy link"}</span></Button><Button size="sm" onClick={() => setLocation("/app")} className="veri-action bg-cyan-300 font-semibold text-[#06191f] hover:bg-cyan-200">Workspace <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" /></Button></div>
      </header>

      <main id="judge-evidence" className="relative mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8 sm:pt-18">
        <section className="mx-auto max-w-3xl text-center">
          <p className="veri-kicker">Judge evidence / CC3 testnet</p>
          <h1 className="mt-5 font-veri-display text-5xl font-semibold leading-[0.9] tracking-[-0.08em] text-white sm:text-6xl">Inspect proof.<br /><span className="text-cyan-200">Not promises.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300">Three real receipts show funding, acceptance, and release. V3 recovery is separate and 2-of-3.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3"><Button onClick={() => document.getElementById("judge-route")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="veri-action bg-cyan-300 font-semibold text-[#06191f] hover:bg-cyan-200">See proof <ArrowUpRight className="ml-2 h-4 w-4" /></Button><Button onClick={() => setLocation("/protocol")} variant="outline" className="veri-action border-white/15 bg-white/[0.025] text-white hover:bg-white/[0.08]">Contracts <ShieldCheck className="ml-2 h-4 w-4" /></Button></div>
        </section>

        <div className="mt-14"><JudgeProofRoute /></div>

        <section className="veri-boundary-statement mt-12 grid gap-6 rounded-[1.75rem] border border-teal-200/10 p-6 sm:grid-cols-[auto_1fr] sm:items-start sm:p-8">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-teal-200/15 bg-teal-300/[0.06] text-teal-100"><CheckCircle2 className="h-5 w-5" /></span>
          <div><p className="veri-kicker text-teal-100">Boundary</p><h2 className="mt-2 text-xl font-semibold text-white">Inspect freely. Act with a wallet.</h2><p className="mt-3 text-sm leading-6 text-slate-300">This page never connects a wallet or creates a transaction. Actions stay in the workspace.</p><button onClick={() => setLocation("/")} className="veri-action mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 hover:text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><ArrowLeft className="h-4 w-4" /> Settlement overview</button></div>
        </section>
      </main>
      <footer className="relative border-t border-white/8 bg-black/10 px-5 py-8"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-xs text-slate-500 sm:flex-row sm:text-left"><p>© 2026 VeriSettle. All rights reserved.</p><p>Public testnet evidence · No real-fund custody · No physical-delivery verification</p></div></footer>
    </div>
  );
}
