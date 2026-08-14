import { Button } from "@/components/ui/button";
import { TESTNET_NETWORKS, VERISETTLE_CONTRACTS, escrowAbi, sourceAbi } from "@shared/contracts";
import { ArrowLeft, ArrowUpRight, Check, Clipboard, FileCode2, GitBranch, Network, ShieldCheck, Waypoints } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

type ContractRow = {
  label: string;
  value: string;
  detail: string;
  href?: string;
};

const contractRows: ContractRow[] = [
  {
    label: "Sepolia source emitter",
    value: VERISETTLE_CONTRACTS.source,
    detail: "Records the buyer-bound OrderAccepted event.",
    href: `${TESTNET_NETWORKS.sepolia.explorerUrl}/address/${VERISETTLE_CONTRACTS.source}`,
  },
  {
    label: "Creditcoin escrow ASC",
    value: VERISETTLE_CONTRACTS.escrowAsc,
    detail: "Holds native tCTC and releases only after a valid proof.",
    href: `${TESTNET_NETWORKS.creditcoin.explorerUrl}/address/${VERISETTLE_CONTRACTS.escrowAsc}`,
  },
  {
    label: "BlockProver precompile",
    value: VERISETTLE_CONTRACTS.blockProverPrecompile,
    detail: "The CC3 verification primitive used by the deployed ASC.",
  },
];

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button onClick={copy} className="veri-action inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label={`Copy ${value}`}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ProtocolReference() {
  const [, setLocation] = useLocation();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button onClick={() => setLocation("/app")} className="veri-action inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><ArrowLeft className="h-4 w-4" /> Deal register</button>
        <span className="rounded-full border border-cyan-200/15 bg-cyan-300/[0.08] px-3 py-1.5 text-xs font-semibold text-cyan-100">Live testnet configuration</span>
      </div>

      <section className="veri-protocol-hero relative overflow-hidden rounded-[2rem] border border-cyan-100/15 p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="veri-kicker">Protocol reference / runnable testnet</p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-[0.97] tracking-[-0.06em] text-white sm:text-5xl">Every release has a public reason.</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">This is the actual deployment map used by VeriSettle: the source event originates on Sepolia, Attestcoin verifies it through the deployed ASC, and Creditcoin CC3 settles the matching escrow.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => setLocation("/app")} className="veri-action bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">Open deal register <ArrowUpRight className="ml-2 h-4 w-4" /></Button><a href="https://docs.creditcoin.org/attestcoin-protocol.md" target="_blank" rel="noreferrer" className="veri-action inline-flex items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Official docs <ArrowUpRight className="h-4 w-4" /></a></div>
          </div>

          <ol className="veri-protocol-map" aria-label="Cross-chain protocol path">
            <li><span className="veri-map-index">01</span><div><p>Source event</p><strong>Ethereum Sepolia</strong><span>OrderAccepted receipt</span></div><Network className="h-5 w-5" /></li>
            <li><span className="veri-map-index">02</span><div><p>Proof policy</p><strong>Attestcoin ASC</strong><span>Receipt + terms + one-time query</span></div><ShieldCheck className="h-5 w-5" /></li>
            <li><span className="veri-map-index">03</span><div><p>Settlement</p><strong>Creditcoin CC3</strong><span>Native tCTC escrow release</span></div><Waypoints className="h-5 w-5" /></li>
          </ol>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="veri-reference-surface rounded-[1.75rem] border border-white/10 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5"><div><p className="veri-kicker">Deployment index</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.045em] text-white">Contracts you can inspect.</h2></div><FileCode2 className="h-6 w-6 text-cyan-200" /></div>
          <dl className="divide-y divide-white/8">
            {contractRows.map((row, index) => <div key={row.label} className="grid gap-3 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"><span className="font-mono text-xs font-semibold text-slate-500">C0{index + 1}</span><div className="min-w-0"><dt className="text-sm font-semibold text-white">{row.label}</dt><dd className="mt-1 text-xs leading-5 text-slate-400">{row.detail}</dd><p className="mt-2 break-all font-mono text-xs text-cyan-100">{row.value}</p></div><div className="flex shrink-0 gap-2">{row.href && <a href={row.href} target="_blank" rel="noreferrer" className="veri-action inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2 text-[11px] font-semibold text-slate-200 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Explorer <ArrowUpRight className="h-3.5 w-3.5" /></a>}<CopyValue value={row.value} /></div></div>)}
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-teal-200/15 bg-teal-300/[0.045] p-5 sm:p-7"><div className="flex items-center gap-3"><GitBranch className="h-5 w-5 text-teal-100" /><div><p className="veri-kicker">Network requirements</p><h2 className="mt-1 font-display text-xl font-semibold text-white">Use the exact testnets.</h2></div></div><dl className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-[#071216]/60 p-4"><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Ethereum Sepolia</dt><dd className="mt-3 font-mono text-sm text-cyan-100">{TESTNET_NETWORKS.sepolia.chainId}</dd><p className="mt-1 text-xs text-slate-400">Source acceptance chain ID</p></div><div className="rounded-xl border border-white/10 bg-[#071216]/60 p-4"><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Creditcoin CC3</dt><dd className="mt-3 font-mono text-sm text-cyan-100">{TESTNET_NETWORKS.creditcoin.chainId}</dd><p className="mt-1 text-xs text-slate-400">Escrow settlement chain ID</p></div></dl></section>
          <section className="rounded-[1.75rem] border border-amber-200/15 bg-amber-300/[0.045] p-5 text-sm leading-6 text-amber-50/90"><p className="font-semibold text-amber-100">Protocol boundary</p><p className="mt-2">Attestcoin proves the configured on-chain acceptance receipt. It does not prove physical delivery or custody real funds; VeriSettle uses public test assets only.</p></section>
        </div>
      </div>

      <section className="veri-reference-surface rounded-[1.75rem] border border-white/10 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="veri-kicker">Interface contract</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.045em] text-white">What the deployed contracts expose.</h2></div><a href="https://docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-sdk-usc-sdk.md" target="_blank" rel="noreferrer" className="veri-action inline-flex items-center gap-2 rounded-md border border-cyan-200/20 px-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">SDK reference <ArrowUpRight className="h-4 w-4" /></a></div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Source emitter</p><ul className="mt-3 space-y-2">{sourceAbi.map(signature => <li key={signature} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 font-mono text-xs leading-5 text-slate-300">{signature}</li>)}</ul></div><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Escrow ASC</p><ul className="mt-3 space-y-2">{escrowAbi.map(signature => <li key={signature} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 font-mono text-xs leading-5 text-slate-300">{signature}</li>)}</ul></div></div>
      </section>
    </div>
  );
}
