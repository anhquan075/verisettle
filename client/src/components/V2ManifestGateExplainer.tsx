import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleHelp, Loader2, Route, ShieldCheck } from "lucide-react";

type V2ManifestGateExplainerProps = {
  checking?: boolean;
  verified?: boolean;
  compact?: boolean;
};

/** Explains the public-RPC integrity check that protects V2 policy-aware wallet routing. */
export function V2ManifestGateExplainer({ checking = false, verified = false, compact = false }: V2ManifestGateExplainerProps) {
  const status = checking ? "Checking public deployment" : verified ? "Verified routing" : "Routing locked";
  const tone = checking
    ? "border-amber-200/20 bg-amber-300/[0.05] text-amber-50"
    : verified
      ? "border-violet-200/20 bg-violet-300/[0.06] text-violet-50"
      : "border-amber-200/20 bg-amber-300/[0.05] text-amber-50";

  return (
    <div className={`mt-3 rounded-xl border p-3 ${tone}`} data-testid="v2-manifest-gate-explainer">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {checking ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : verified ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <Route className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">{status}</p>
            {!compact && <p className="mt-1 text-xs leading-5 opacity-80">V2 wallet actions use the pinned source and ASC only after this browser matches their public testnet state.</p>}
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="veri-action inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-white/10" aria-label="Explain V2 manifest-gated routing">
              <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" /> Why this is gated
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs border border-violet-200/20 bg-[#0b1720] p-3 text-xs leading-5 text-slate-100">
            Before V2 sends a wallet transaction, VeriSettle reads both public RPCs and compares the pinned policy hash, chain IDs, contract addresses, source/ASC runtime code hashes, and immutable cross-contract bindings. A mismatch prevents routing to an unverified contract.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
