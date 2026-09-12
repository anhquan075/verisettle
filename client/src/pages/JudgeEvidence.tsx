import { ArrowLeft, ArrowUpRight, Check, CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import { AttestationOrbit } from "@/components/AttestationOrbit";
import { ProofFieldBackground } from "@/components/ProofFieldBackground";
import { JudgeForJudgesStrip } from "@/components/JudgeForJudgesStrip";
import { JudgeProofRoute } from "@/components/JudgeProofRoute";
import { Reveal } from "@/components/Reveal";
import { VeriSettleBrand } from "@/components/VeriSettleBrand";
import { ConnectionQualityIndicator } from "@/components/ConnectionQualityIndicator";
import { Button } from "@/components/ui/button";
import { useMotionPreference } from "@/contexts/MotionPreferenceContext";
import { enterTransition, heroEnter, motionRest, pageFade, staggerDelay } from "@/lib/motion";

export default function JudgeEvidence() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const systemPrefersReducedMotion = useReducedMotion();
  const { decorativeMotionEnabled } = useMotionPreference();
  const shouldReduceMotion = systemPrefersReducedMotion || !decorativeMotionEnabled;
  const pageMotion = pageFade(isLeaving, shouldReduceMotion);

  const goHome = () => {
    if (shouldReduceMotion) {
      setLocation("/");
      return;
    }
    setIsLeaving(true);
    window.setTimeout(() => setLocation("/"), 220);
  };

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
    <motion.div initial={heroEnter(shouldReduceMotion)} animate={pageMotion.animate} transition={isLeaving ? pageMotion.transition : enterTransition(shouldReduceMotion, 0, 0.5)} className="veri-shell min-h-screen overflow-x-clip text-white">
      <a href="#judge-evidence" className="sr-only z-50 rounded-md bg-cyan-200 px-3 py-2 text-sm font-semibold text-[#062126] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to evidence</a>
      <div className="veri-aurora pointer-events-none fixed inset-0" />
      <ProofFieldBackground variant="judge" />
      <AttestationOrbit variant="judge" />
      <header className="veri-site-header sticky top-0 z-40 mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
        <button onClick={goHome} aria-label="Back to VeriSettle landing page" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          <VeriSettleBrand compact />
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-teal-200/15 bg-teal-300/[0.06] px-3 py-1 text-xs font-semibold text-teal-100 sm:inline">No wallet</span>
          <ConnectionQualityIndicator />
          <Button size="sm" variant="outline" onClick={() => void copyEvidenceLink()} className="veri-action border-white/15 bg-white/[0.025] px-2.5 text-white hover:bg-white/[0.08] sm:px-3" aria-label="Copy public Judge Evidence link">
            {copied ? <Check className="h-3.5 w-3.5 text-teal-100" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:ml-1.5 sm:inline">{copied ? "Link copied" : "Copy link"}</span>
          </Button>
          <Button size="sm" onClick={() => setLocation("/app")} className="veri-action bg-cyan-300 font-semibold text-[#06191f] hover:bg-cyan-200">
            Workspace <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </header>
      <JudgeForJudgesStrip />

      <main id="judge-evidence" className="relative mx-auto max-w-7xl px-5 pb-16 pt-5 sm:px-8">
        <section className="max-w-3xl">
          <motion.p initial={heroEnter(shouldReduceMotion)} animate={motionRest()} transition={enterTransition(shouldReduceMotion, 0.04, 0.46)} className="veri-kicker">Judge evidence / CC3 testnet</motion.p>
          <motion.h1 initial={heroEnter(shouldReduceMotion)} animate={motionRest()} transition={enterTransition(shouldReduceMotion, staggerDelay(shouldReduceMotion, 1, 0.08, 0.04), 0.58)} className="mt-3 font-veri-display text-3xl font-semibold leading-[0.95] tracking-[-0.06em] text-white sm:text-4xl">
            Inspect proof. Not promises.
          </motion.h1>
          <motion.p initial={heroEnter(shouldReduceMotion)} animate={motionRest()} transition={enterTransition(shouldReduceMotion, staggerDelay(shouldReduceMotion, 2, 0.08, 0.04), 0.5)} className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Attestcoin verifies the acceptance receipt, NOT physical delivery.
          </motion.p>
        </section>

        <Reveal reduce={shouldReduceMotion} className="mt-5" delay={0.12}>
          <JudgeProofRoute />
        </Reveal>

        <Reveal as="section" reduce={shouldReduceMotion} className="veri-boundary-statement mt-8 grid gap-4 rounded-[1.25rem] border border-teal-200/10 p-5 sm:grid-cols-[auto_1fr] sm:items-start" delay={0.16}>
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-teal-200/15 bg-teal-300/[0.06] text-teal-100">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Inspect freely. Act with a wallet.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">This page never connects a wallet or creates a transaction. Actions stay in the workspace.</p>
            <button onClick={goHome} className="veri-action mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 hover:text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              <ArrowLeft className="h-4 w-4" /> Settlement overview
            </button>
          </div>
        </Reveal>
      </main>
      <footer className="relative border-t border-white/8 bg-black/10 px-5 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
          <p>© 2026 VeriSettle. All rights reserved.</p>
          <p className="flex items-center gap-3">
            Public testnet evidence · No real-fund custody · No physical-delivery verification
            <button onClick={() => setLocation("/contrast-audit")} className="veri-action font-semibold text-cyan-100 hover:text-cyan-50">
              Contrast audit <ArrowUpRight className="ml-1 inline h-3 w-3" />
            </button>
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
