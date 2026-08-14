import { ArrowUpRight, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";

type EvidenceRow = {
  label: string;
  network: string;
  value: string;
  href: string;
};

const evidence: EvidenceRow[] = [
  {
    label: "Source acceptance",
    network: "Ethereum Sepolia",
    value: "0x4b6c…1d18",
    href: "https://sepolia.etherscan.io/tx/0x4b6c2c2645cea40926839e15b63c61e90d6539053a4cce3d3e68ce2f92de1d18",
  },
  {
    label: "Escrow funding",
    network: "Creditcoin CC3",
    value: "0x6975…1d94",
    href: "https://creditcoin-testnet.blockscout.com/tx/0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94",
  },
  {
    label: "Attested release",
    network: "Creditcoin CC3",
    value: "0x0e8c…d6df",
    href: "https://creditcoin-testnet.blockscout.com/tx/0x0e8c31dc7d8d42066e4285d2362547a5f2cbcd1ca53a2a1662234d657b3dd6df",
  },
];

export function ProofEvidenceLedger() {
  return (
    <section id="evidence" className="veri-evidence-panel scroll-mt-8" aria-labelledby="evidence-heading">
      <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-5">
        <div>
          <p className="veri-kicker">Public testnet record</p>
          <h2 id="evidence-heading" className="mt-2 font-display text-2xl font-semibold tracking-[-0.045em] text-white">Evidence, not a mock flow.</h2>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-teal-200/15 bg-teal-300/[0.08] px-3 py-1.5 text-xs font-semibold text-teal-100">
          <CheckCircle2 className="h-3.5 w-3.5" /> Verified run
        </span>
      </div>

      <div className="divide-y divide-white/8">
        {evidence.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="group grid grid-cols-[1fr_auto] gap-x-4 py-4 transition-colors hover:text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span>
              <span className="block text-sm font-semibold text-white">{item.label}</span>
              <span className="mt-1 block text-xs text-slate-400">{item.network}</span>
            </span>
            <span className="flex items-center gap-2 self-center font-mono text-xs text-cyan-100">
              {item.value}<ExternalLink className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl border border-cyan-200/10 bg-[#071216]/80 p-4 text-sm leading-6 text-slate-300">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-200" />
        <p>VeriSettle checks receipt success, expected event semantics, terms binding, and one-time proof use before release.</p>
      </div>

      <a href="#execution" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
        See the execution path <ArrowUpRight className="h-4 w-4" />
      </a>
    </section>
  );
}
