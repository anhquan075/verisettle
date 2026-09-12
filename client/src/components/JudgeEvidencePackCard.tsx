import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import {
  describeJudgeEvidenceView,
  judgeActionLabel,
  judgeHashPreview,
  shortAddress,
  type JudgeEvidencePack,
  type JudgeEvidenceView,
} from "@shared/judgeEvidence";

export function JudgeEvidencePackCard({
  view,
  pack,
  fileMissing = false,
  loading = false,
}: {
  view?: JudgeEvidenceView;
  pack?: JudgeEvidencePack | null;
  fileMissing?: boolean;
  loading?: boolean;
}) {
  const resolved = view ?? describeJudgeEvidenceView({ pack, fileMissing, loading });

  if (resolved.status === "loading") {
    return (
      <article className="veri-judge-pack" aria-busy="true">
        <p role="status" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Loading evidence file
        </p>
        <div className="mt-4 space-y-2">
          <div className="h-8 rounded-lg bg-white/[0.04]" />
          <div className="h-8 rounded-lg bg-white/[0.04]" />
          <div className="h-8 rounded-lg bg-white/[0.04]" />
        </div>
      </article>
    );
  }

  if (resolved.status === "empty") {
    return (
      <article className="veri-judge-pack">
        <p role="status" className="text-sm leading-6 text-slate-300">
          {resolved.message}
        </p>
      </article>
    );
  }

  if (resolved.status === "error") {
    return (
      <article className="veri-judge-pack veri-judge-pack--error">
        <p role="alert" className="text-sm leading-6 text-rose-100">
          {resolved.message}
        </p>
      </article>
    );
  }

  const { pack: ready } = resolved;
  const buyer = shortAddress(ready.buyer);
  const seller = shortAddress(ready.seller);

  return (
    <article className="veri-judge-pack" data-policy={ready.policy} data-distinct={ready.distinctWallets ? "true" : "false"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/80">{ready.policy === "v2_deployed" ? "V2" : "V1"} · two-wallet</p>
          <h3 className="mt-1 text-base font-semibold text-white">{ready.title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ready.policy === "v2_deployed" ? <span className="veri-proof-chip veri-proof-chip--released">EscrowReleasedV2</span> : null}
          {ready.distinctWallets ? (
            <p className="rounded-md border border-teal-200/20 bg-teal-300/[0.08] px-2 py-1 font-mono text-[11px] font-semibold text-teal-100">Buyer ≠ seller</p>
          ) : (
            <p className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-semibold text-slate-400">Self-deal</p>
          )}
        </div>
      </div>

      <dl className="veri-judge-parties mt-4">
        <div>
          <dt>Buyer</dt>
          <dd className="font-mono">{buyer}</dd>
        </div>
        <div>
          <dt>Seller</dt>
          <dd className="font-mono">{seller}</dd>
        </div>
      </dl>

      <ol className="veri-receipt-rail mt-4 grid gap-1.5">
        {ready.receipts.map((receipt, index) => (
          <li key={receipt.hash} className="veri-receipt-rail__item">
            <a
              href={receipt.href}
              target="_blank"
              rel="noreferrer"
              className="veri-action group flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="veri-receipt-rail__sequence">R0{index + 1}</span>
                <span>
                  <span className="block text-sm font-semibold text-white">{judgeActionLabel(receipt.role)}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">{receipt.network}</span>
                </span>
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[12px] text-cyan-100">
                {judgeHashPreview(receipt.hash)}
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-100" />
              </span>
            </a>
          </li>
        ))}
      </ol>

      <p className="mt-4 rounded-lg border border-cyan-200/15 bg-cyan-300/[0.05] px-3 py-2 font-mono text-[11px] text-cyan-50">
        Replay {ready.replayRejection}
      </p>
      <p className="mt-2 font-mono text-[10px] leading-4 text-slate-500">{ready.evidenceFile}</p>
    </article>
  );
}
