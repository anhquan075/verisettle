import { AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

type JudgeReplayWalkthroughProps = {
  disabled: boolean;
  onRunReplay: () => void;
  replayVerified: boolean;
  replayError: string | null;
  onDismissReplayError: () => void;
  expectedError: string;
  settlementTxHash: string | null;
  explorerUrl: string;
};

export function JudgeReplayWalkthrough({ disabled, onRunReplay, replayVerified, replayError, onDismissReplayError, expectedError, settlementTxHash, explorerUrl }: JudgeReplayWalkthroughProps) {
  return (
    <section aria-label="Judge-mode replay walkthrough" className="overflow-hidden rounded-[1.5rem] border border-amber-200/20 bg-gradient-to-br from-amber-300/[0.08] to-rose-300/[0.025] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-amber-300/10 p-2.5 text-amber-100"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100/80">Judge mode · replay safety</p><h2 className="mt-1 font-display text-xl font-semibold text-white">Prove that the same settlement cannot happen twice.</h2></div></div>
        <span className="rounded-full border border-amber-200/20 bg-amber-300/[0.08] px-3 py-1 text-xs font-semibold text-amber-50">No new escrow value</span>
      </div>
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        <li className="rounded-xl border border-white/10 bg-[#0d1518]/70 p-4"><p className="text-xs font-semibold text-white">01 · Establish evidence</p><p className="mt-2 text-xs leading-5 text-slate-400">Open the existing release receipt to confirm the seller already received the one permitted settlement.</p></li>
        <li className="rounded-xl border border-white/10 bg-[#0d1518]/70 p-4"><p className="text-xs font-semibold text-white">02 · Repeat the query</p><p className="mt-2 text-xs leading-5 text-slate-400">Run a safe replay check against the already processed proof. It does not fund a new order or send value.</p></li>
        <li className="rounded-xl border border-white/10 bg-[#0d1518]/70 p-4"><p className="text-xs font-semibold text-white">03 · Read the boundary</p><p className="mt-2 text-xs leading-5 text-slate-400">The ASC must return its processed-query rejection. That is a security result, not a dispute outcome.</p></li>
      </ol>
      {settlementTxHash && <a href={`${explorerUrl}/tx/${settlementTxHash}`} target="_blank" rel="noreferrer" className="veri-action mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-50 hover:text-white">Open existing settlement receipt <ExternalLink className="h-4 w-4" /></a>}
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0d1518]/65 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-white">Expected result</p><p className="mt-1 break-all font-mono text-xs leading-5 text-amber-100">{expectedError}</p></div><Button disabled={disabled} onClick={onRunReplay} variant="outline" className="veri-action border-amber-200/30 text-amber-50 hover:bg-amber-300/10"><AlertTriangle className="mr-2 h-4 w-4" />Run safe replay check</Button></div>
      {replayVerified && <div role="status" className="mt-4 flex gap-3 rounded-xl border border-teal-200/20 bg-teal-300/[0.07] p-4 text-sm text-teal-50"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-100" /><p><span className="font-semibold">Expected replay rejection observed.</span> The released order remains final; no additional escrow value was moved.</p></div>}
      {replayError && <div role="alert" className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-300/25 bg-rose-400/[0.08] p-4 text-sm text-rose-50 sm:flex-row sm:items-center sm:justify-between"><p><span className="font-semibold">Replay check did not complete.</span> {replayError}</p><Button onClick={onDismissReplayError} variant="outline" className="veri-action shrink-0 border-rose-200/30 text-rose-50 hover:bg-rose-300/10">Review retry steps</Button></div>}
      <p className="mt-4 text-xs leading-5 text-slate-400"><span className="font-semibold text-slate-300">Dispute boundary:</span> replay prevention protects settlement finality. A real commercial dispute follows the separate on-chain dispute control only while an order remains funded.</p>
    </section>
  );
}
