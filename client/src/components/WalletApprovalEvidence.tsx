import { CheckCircle2, Eye, ShieldCheck, WalletCards } from "lucide-react";
import * as React from "react";

type WalletApprovalEvidenceProps = {
  buyerAddress: string;
  connectedAddress: string | null;
};

function shortAddress(address: string) {
  return `${address.slice(0, 10)}…${address.slice(-8)}`;
}

export function WalletApprovalEvidence({ buyerAddress, connectedAddress }: WalletApprovalEvidenceProps) {
  const hasConnection = Boolean(connectedAddress);
  const matchesBuyer = connectedAddress?.toLowerCase() === buyerAddress.toLowerCase();

  return (
    <section aria-label="Wallet approval evidence checklist" className="rounded-[1.25rem] border border-cyan-200/12 bg-cyan-300/[0.035] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-cyan-300/10 p-2 text-cyan-100"><WalletCards className="h-4 w-4" /></div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-100/80">Wallet approval evidence</p>
          <h3 className="mt-1 text-sm font-semibold text-white">Capture public proof after your own extension approval.</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">VeriSettle never reads private keys, keystore passwords, or recovery phrases.</p>
        </div>
      </div>

      <ol className="mt-4 space-y-2">
        <li className="flex gap-3 rounded-xl border border-white/8 bg-[#061014]/55 p-3">
          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${hasConnection ? "bg-teal-300/15 text-teal-100" : "bg-white/[0.06] text-slate-400"}`}>{hasConnection ? <CheckCircle2 className="h-3 w-3" /> : "1"}</span>
          <p className="text-xs leading-5 text-slate-300">Select the buyer wallet in Rabby/SubWallet and use the connection control above. Expected buyer: <span className="font-mono text-cyan-100">{shortAddress(buyerAddress)}</span>.</p>
        </li>
        <li className="flex gap-3 rounded-xl border border-white/8 bg-[#061014]/55 p-3">
          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${matchesBuyer ? "bg-teal-300/15 text-teal-100" : "bg-white/[0.06] text-slate-400"}`}>{matchesBuyer ? <CheckCircle2 className="h-3 w-3" /> : "2"}</span>
          <p className="text-xs leading-5 text-slate-300">Confirm the connected address and CC3 Testnet in the app. {hasConnection && !matchesBuyer ? <span className="text-amber-100"> The current address does not match this order’s recorded buyer.</span> : null}</p>
        </li>
        <li className="flex gap-3 rounded-xl border border-white/8 bg-[#061014]/55 p-3">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.06] text-slate-400"><Eye className="h-3 w-3" /></span>
          <p className="text-xs leading-5 text-slate-300">After approval, capture only the public address, selected testnet, transaction hash, and resulting receipt-backed state. Never capture passwords, seed phrases, or private key material.</p>
        </li>
      </ol>
      <p className="mt-3 flex items-center gap-2 text-[11px] text-teal-100/80"><ShieldCheck className="h-3.5 w-3.5" /> This checklist records user-controlled evidence; it does not claim an approval occurred.</p>
    </section>
  );
}
