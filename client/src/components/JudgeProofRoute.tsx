import * as React from "react";
import { ArrowUpRight, CheckCircle2, Landmark, LockKeyhole, ShieldCheck, UserCheck, WalletCards } from "lucide-react";
import { V2_GOVERNED_POLICY_MANIFEST } from "@shared/v2PolicyManifest";
import {
  CC3_VERIFIED_CONTRACTS,
  FEATURED_JUDGE_EVIDENCE,
  SECONDARY_JUDGE_EVIDENCE,
  TWO_WALLET_V2_EVIDENCE,
  cc3AddressHref,
  describeJudgeEvidenceView,
} from "@shared/judgeEvidence";
import { TESTNET_NETWORKS } from "@shared/contracts";
import { JudgeEvidencePackCard } from "@/components/JudgeEvidencePackCard";

const checkpoints = [
  {
    step: "01",
    title: "Buyer funds",
    detail: "tCTC locks to this order.",
    Icon: WalletCards,
  },
  {
    step: "02",
    title: "Buyer accepts",
    detail: "Sepolia receipt matches the terms.",
    Icon: UserCheck,
  },
  {
    step: "03",
    title: "Proof releases",
    detail: "CC3 releases once. Replays fail.",
    Icon: LockKeyhole,
  },
] as const;

const selfDealReceipts = SECONDARY_JUDGE_EVIDENCE.receipts;

export function JudgeProofRoute() {
  const featuredView = describeJudgeEvidenceView({ pack: FEATURED_JUDGE_EVIDENCE });
  const v2View = describeJudgeEvidenceView({ pack: TWO_WALLET_V2_EVIDENCE });

  return (
    <section id="judge-route" tabIndex={-1} className="veri-judge-cockpit scroll-mt-28 overflow-hidden rounded-[1.25rem] border border-cyan-200/15 bg-[#071216] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-labelledby="judge-route-heading">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="veri-kicker">Proof route / live testnet</p>
            <h2 id="judge-route-heading" className="mt-2 font-veri-display text-2xl font-semibold leading-[0.96] tracking-[-0.05em] text-white sm:text-3xl">
              Receipt in.<br />
              <span className="text-cyan-200">Payment out, once.</span>
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Attestcoin verifies the acceptance receipt, NOT physical delivery. Featured receipts use distinct buyer and seller wallets.</p>
          </div>
          <a href="/protocol" className="veri-action inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-cyan-200/25 bg-cyan-300/[0.08] px-3 py-2 text-sm font-semibold text-cyan-50 hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
            Contracts <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="veri-judge-rail grid gap-px bg-white/10 md:grid-cols-[0.9fr_0.9fr_1.2fr]" aria-label="Settlement proof rail">
        {checkpoints.map(({ step, title, detail, Icon }, index) => (
          <article key={step} className={`veri-judge-rail__stage bg-[#091216] px-4 py-3 ${index === 2 ? "veri-judge-rail__stage--settle" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                <i aria-hidden className="veri-judge-rail__node" />
                {step} / 03
              </span>
              <Icon className="h-4 w-4 text-cyan-100" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-white">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
        <JudgeEvidencePackCard view={featuredView} />
        <JudgeEvidencePackCard view={v2View} />
      </div>
      <p className="sr-only">Live JSON: {FEATURED_JUDGE_EVIDENCE.evidenceFile} {TWO_WALLET_V2_EVIDENCE.evidenceFile} EscrowReleasedV2 two-wallet</p>
      <p className="sr-only">
        <a href="https://github.com/anhquan075/verisettle">{FEATURED_JUDGE_EVIDENCE.evidenceFile}</a>
        <span>{TWO_WALLET_V2_EVIDENCE.evidenceFile}</span>
      </p>

      <div className="border-t border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Verified CC3 contracts</p>
          <a href={`${TESTNET_NETWORKS.creditcoin.explorerUrl}`} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-cyan-100 hover:text-white">
            Blockscout
          </a>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {CC3_VERIFIED_CONTRACTS.map((row) => (
            <li key={row.key}>
              <a
                href={cc3AddressHref(row.address)}
                target="_blank"
                rel="noreferrer"
                className="veri-action flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <span>
                  <span className="block text-xs font-semibold text-white">{row.label}</span>
                  <span className="mt-1 block break-all font-mono text-[11px] text-cyan-100">{row.address}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <aside className="border-t border-white/10 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2 text-teal-100">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-sm font-semibold">The proof boundary</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-300">Release needs a valid receipt, source, terms, parties, and unused query.</p>
        <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-teal-50">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          The same proof cannot release twice. Replays return QueryAlreadyProcessed.
        </p>
      </aside>

      <details className="border-t border-white/10 px-4 py-4 sm:px-5">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Secondary: self-deal historical run</summary>
        <p className="mt-2 text-xs leading-5 text-slate-400">Same-wallet Attestcoin path kept for the original 0xFD2 release. 0x6975…1d94 · 0x4b6c…1d18 · 0x0e8c…d6df</p>
        <div className="mt-3 grid gap-2">
          {selfDealReceipts.map((receipt) => (
            <a
              key={receipt.hash}
              href={receipt.href}
              target="_blank"
              rel="noreferrer"
              className="veri-action flex items-center justify-between gap-3 rounded-lg border border-white/8 px-3 py-2 text-xs text-slate-300 hover:border-cyan-200/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <span>{receipt.label}</span>
              <span className="font-mono text-cyan-100">{receipt.shortHash}</span>
            </a>
          ))}
        </div>
      </details>

      <div className="border-t border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-2xl items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-200/20 bg-cyan-300/[0.08] text-cyan-100">
              <Landmark className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-100/80">V3 governed recovery</p>
              <h3 className="mt-1 text-base font-semibold text-white">Disputes need 2 of 3 approvals.</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">V3 separates dispute authority from custody. One signer cannot release or refund.</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:w-[23rem]">
            <a href={`${TESTNET_NETWORKS.creditcoin.explorerUrl}/tx/${V2_GOVERNED_POLICY_MANIFEST.governance.deploymentTxHash}`} target="_blank" rel="noreferrer" className="veri-action rounded-lg border border-cyan-200/15 bg-cyan-300/[0.06] px-3 py-2.5 text-left hover:bg-cyan-300/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              <span className="block text-xs font-semibold text-cyan-50">2-of-3 multisig</span>
              <span className="mt-1 block font-mono text-[10px] text-cyan-100/80">
                {V2_GOVERNED_POLICY_MANIFEST.governance.address.slice(0, 8)}…{V2_GOVERNED_POLICY_MANIFEST.governance.address.slice(-4)} <ArrowUpRight className="inline h-3 w-3" />
              </span>
            </a>
            <a href={`${TESTNET_NETWORKS.creditcoin.explorerUrl}/tx/${V2_GOVERNED_POLICY_MANIFEST.escrowAsc.deploymentTxHash}`} target="_blank" rel="noreferrer" className="veri-action rounded-lg border border-cyan-200/15 bg-cyan-300/[0.06] px-3 py-2.5 text-left hover:bg-cyan-300/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              <span className="block text-xs font-semibold text-cyan-50">Governed escrow ASC</span>
              <span className="mt-1 block font-mono text-[10px] text-cyan-100/80">
                {V2_GOVERNED_POLICY_MANIFEST.escrowAsc.address.slice(0, 8)}…{V2_GOVERNED_POLICY_MANIFEST.escrowAsc.address.slice(-4)} <ArrowUpRight className="inline h-3 w-3" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
