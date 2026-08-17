import { Accessibility, ArrowLeft, ArrowUpRight, CheckCircle2, Eye, Keyboard, LoaderCircle, ReceiptText, ShieldCheck, Waypoints } from "lucide-react";
import { useLocation } from "wouter";
import { AttestationOrbit } from "@/components/AttestationOrbit";
import { ProofFieldBackground } from "@/components/ProofFieldBackground";
import { VeriSettleBrand } from "@/components/VeriSettleBrand";
import { Button } from "@/components/ui/button";
import { useHighContrast } from "@/contexts/HighContrastContext";

const reviewAreas = [
  [Eye, "Contrast and focus", "Dark semantic surfaces, reinforced borders, clear keyboard focus, and an operating-system-aware high-contrast response."],
  [Keyboard, "Keyboard route", "Skip links, visible focus rings, semantic buttons, tooltips, and public evaluator navigation remain keyboard reachable."],
  [LoaderCircle, "Motion and loading", "System reduced-motion pauses decorative movement. Route skeletons and progress cues identify navigation only; they never signal chain activity."],
  [ShieldCheck, "Wallet boundary", "Public routes do not connect a wallet. The workspace opens wallet UI only on user action; no key, signature, transaction, or faucet claim is implied here."],
] as const;

const evaluatorLinks = [
  [ReceiptText, "Public evidence controls", "Open the Judge Evidence action rail, then tab through See proof, Contracts, and Contrast audit.", "/judge#judge-actions"],
  [Eye, "Receipt and replay boundary", "Jump directly to the public three-receipt proof rail and replay-protection evidence.", "/judge#judge-route"],
  [ShieldCheck, "Deployed contract reference", "Inspect the no-wallet protocol reference and V3 governed recovery surface.", "/protocol"],
  [Waypoints, "Workspace guidance", "Review the wallet-gated workspace guidance without initiating a wallet action.", "/app#judge-route"],
  [Keyboard, "Keyboard review start", "Return to this audit’s skip link and tab order for a keyboard-only check.", "/contrast-audit#audit-content"],
] as const;

export default function ContrastAudit() {
  const [, setLocation] = useLocation();
  const { highContrast, systemPrefersHighContrast } = useHighContrast();

  return <div className="veri-shell min-h-screen overflow-x-clip text-white">
    <a href="#audit-content" className="sr-only z-50 rounded-md bg-cyan-200 px-3 py-2 text-sm font-semibold text-[#062126] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to contrast audit</a>
    <div className="veri-aurora pointer-events-none fixed inset-0" />
    <ProofFieldBackground variant="judge" />
    <AttestationOrbit />
    <header className="sticky top-0 z-40 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-b border-white/[0.06] bg-[#061014]/88 px-5 py-4 shadow-[0_12px_34px_rgba(2,10,14,0.26)] backdrop-blur-xl sm:px-8">
      <button onClick={() => setLocation("/")} aria-label="Back to VeriSettle landing page" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><span className="sm:hidden"><VeriSettleBrand compact /></span><span className="hidden sm:inline-flex"><VeriSettleBrand /></span></button>
      <div className="flex items-center gap-2 sm:gap-3"><Button size="sm" variant="outline" onClick={() => setLocation("/judge")} className="veri-action border-white/15 bg-white/[0.025] text-white hover:bg-white/[0.08]">Judge evidence <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" /></Button><Button size="sm" onClick={() => setLocation("/app")} className="veri-action bg-cyan-300 font-semibold text-[#06191f] hover:bg-cyan-200">Workspace <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" /></Button></div>
    </header>

    <main id="audit-content" className="relative mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8 sm:pt-18">
      <section className="mx-auto max-w-3xl text-center"><p className="veri-kicker">Evaluator route / accessibility</p><h1 className="mt-5 font-veri-display text-5xl font-semibold leading-[0.9] tracking-[-0.08em] text-white sm:text-6xl">Inspect the interface.<br /><span className="text-cyan-200">Not an accessibility claim.</span></h1><p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300">This public route makes VeriSettle’s implemented contrast, keyboard, loading, motion, and wallet boundaries easy to inspect. It is an evaluator aid, not a substitute for an independent accessibility audit.</p></section>

      <section className="mt-12 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><div className="veri-boundary-statement rounded-[1.75rem] border border-teal-200/14 p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-200/18 bg-cyan-300/[0.08] text-cyan-100"><Accessibility className="h-5 w-5" /></span><div><p className="veri-kicker">Device contrast</p><h2 className="mt-1 text-lg font-semibold text-white">{highContrast ? "High contrast active" : "Standard contrast active"}</h2></div></div><p className="mt-5 text-sm leading-6 text-slate-300">{systemPrefersHighContrast ? "The device is requesting increased contrast, so VeriSettle has raised semantic border, text, focus, and surface separation." : "VeriSettle follows the device’s preferred contrast setting. Switch on your operating system’s high-contrast preference to inspect the alternate semantic palette."}</p></div><div className="veri-evidence-panel rounded-[1.75rem] p-6"><p className="veri-kicker">Evaluator checklist</p><h2 className="mt-2 text-2xl font-semibold text-white">Four inspectable boundaries.</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{reviewAreas.map(([Icon, title, body]) => <div key={title} className="rounded-2xl border border-cyan-100/10 bg-black/15 p-4"><Icon className="h-4 w-4 text-cyan-100" /><h3 className="mt-3 text-sm font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-300">{body}</p></div>)}</div></div></section>

      <section className="mt-8 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-cyan-100/10 bg-black/15 p-5"><p className="veri-kicker">01 / Navigate</p><p className="mt-3 text-sm leading-6 text-slate-200">Use Tab from the page start. Confirm skip links, focus rings, and the public Judge route remain reachable.</p></div><div className="rounded-2xl border border-cyan-100/10 bg-black/15 p-5"><p className="veri-kicker">02 / Reduce</p><p className="mt-3 text-sm leading-6 text-slate-200">Enable system reduced-motion. Decorative proof-field movement pauses while real route and wallet controls remain usable.</p></div><div className="rounded-2xl border border-cyan-100/10 bg-black/15 p-5"><p className="veri-kicker">03 / Verify</p><p className="mt-3 text-sm leading-6 text-slate-200">Visit Judge Evidence without a wallet. Inspect receipts and governance proof before any workspace action.</p></div></section>

      <section className="mt-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="veri-kicker">Evaluator deep links</p><h2 className="mt-2 text-2xl font-semibold text-white">Jump to the exact review surface.</h2></div><p className="max-w-md text-sm leading-6 text-slate-300">Every link below stays public until you intentionally open the workspace. They do not connect a wallet or create a transaction.</p></div><div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{evaluatorLinks.map(([Icon, title, body, href]) => <a key={title} href={href} className="veri-evaluator-link veri-action group rounded-2xl border border-cyan-100/14 bg-black/15 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><Icon className="h-4 w-4 text-cyan-100" /><h3 className="mt-3 flex items-center gap-2 text-sm font-semibold text-white">{title}<ArrowUpRight className="h-3.5 w-3.5 text-cyan-100 transition-transform duration-180 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></h3><p className="mt-2 text-xs leading-5 text-slate-300">{body}</p></a>)}</div></section>

      <section className="veri-boundary-statement mt-8 grid gap-5 rounded-[1.75rem] border border-teal-200/14 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-teal-200/15 bg-teal-300/[0.06] text-teal-100"><CheckCircle2 className="h-5 w-5" /></span><div><p className="veri-kicker text-teal-100">Truthful interaction boundary</p><h2 className="mt-2 text-lg font-semibold text-white">Accessibility review never opens a wallet.</h2><p className="mt-2 text-sm leading-6 text-slate-300">This audit route is public and non-transactional. Wallet controls stay in the workspace and act only after an evaluator chooses to use them.</p></div><Button onClick={() => setLocation("/judge")} className="veri-action bg-cyan-300 font-semibold text-[#06191f] hover:bg-cyan-200">Inspect evidence <ArrowUpRight className="ml-2 h-4 w-4" /></Button></section>
    </main>
    <footer className="relative border-t border-white/8 bg-black/10 px-5 py-8"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-xs text-slate-500 sm:flex-row sm:text-left"><p>© 2026 VeriSettle. All rights reserved.</p><p>Public evaluator route · No wallet needed · No transaction created</p></div></footer>
  </div>;
}
