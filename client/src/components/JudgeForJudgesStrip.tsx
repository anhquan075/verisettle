import * as React from "react";
import { TESTNET_NETWORKS } from "@shared/contracts";

const links = [
  { href: "/app", label: "Live app", external: false },
  { href: "https://github.com/anhquan075/verisettle", label: "GitHub", external: true },
  { href: "#judge-route", label: "This evidence", external: false },
  { href: TESTNET_NETWORKS.creditcoin.explorerUrl, label: "CC3 explorer", external: true },
  { href: TESTNET_NETWORKS.sepolia.explorerUrl, label: "Sepolia explorer", external: true },
] as const;

export function JudgeForJudgesStrip() {
  return (
    <div id="judge-actions" className="veri-judge-strip sticky top-16 z-30">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-5 sm:px-8">
        <p className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_0.7rem_oklch(0.84_0.125_190/0.7)]" />
          For judges
        </p>
        <nav aria-label="Judge shortcuts" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-300">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="veri-action rounded-md px-1 py-1 text-slate-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
