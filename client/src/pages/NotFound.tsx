import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass, FileQuestion, Home, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <main className="veri-shell relative grid min-h-screen place-items-center overflow-hidden px-5 py-10 text-white">
      <div className="veri-aurora pointer-events-none fixed inset-0" />
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-cyan-100/15 bg-[#09161a]/85 p-7 text-center shadow-[0_28px_100px_rgba(0,0,0,0.42)] backdrop-blur sm:p-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.08] text-cyan-100"><FileQuestion className="h-7 w-7" aria-hidden="true" /></div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/80">Route unavailable</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.055em] text-white">This evidence path does not exist.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-slate-300">The URL may be incomplete, the order may belong to another workspace, or the page has moved. Return to a known settlement surface to continue safely.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-left"><Compass className="h-4 w-4 text-cyan-200" aria-hidden="true" /><p className="mt-2 text-xs font-semibold text-white">Safe recovery</p><p className="mt-1 text-xs leading-5 text-slate-400">No order state is changed by this route.</p></div><div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-left"><ShieldCheck className="h-4 w-4 text-teal-200" aria-hidden="true" /><p className="mt-2 text-xs font-semibold text-white">Evidence remains scoped</p><p className="mt-1 text-xs leading-5 text-slate-400">Deal access is bound to its recorded owner.</p></div></div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button onClick={() => setLocation("/app")} className="min-h-11 bg-gradient-to-r from-teal-300 to-cyan-300 font-semibold text-slate-950 hover:from-teal-200 hover:to-cyan-200"><Home className="mr-2 h-4 w-4" /> Open deal register</Button><Button onClick={() => setLocation("/")} variant="outline" className="min-h-11 border-white/15 bg-white/[0.025] text-white hover:bg-white/[0.08]"><ArrowLeft className="mr-2 h-4 w-4" /> Return to landing</Button></div>
      </motion.section>
    </main>
  );
}
