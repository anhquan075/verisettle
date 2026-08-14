import { dealStatusLabels, type DealStatus } from "@shared/deals";

const statusClassNames: Record<DealStatus, string> = {
  draft: "border-slate-600/70 bg-slate-800/80 text-slate-200",
  funded: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  proof_pending: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  released: "border-teal-300/35 bg-teal-300/10 text-teal-100",
  refunded: "border-violet-300/35 bg-violet-300/10 text-violet-100",
  disputed: "border-rose-300/35 bg-rose-300/10 text-rose-100",
};

export function DealStatusBadge({ status, compact = false }: { status: DealStatus; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.01em] ${statusClassNames[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status === "released" ? "bg-teal-300" : status === "disputed" ? "bg-rose-300" : "bg-current"}`} />
      {!compact && dealStatusLabels[status]}
    </span>
  );
}
