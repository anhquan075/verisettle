import { cn } from "@/lib/utils";

export const VERISETTLE_LOGO_URL = "/manus-storage/verisettle-symbol-clean_9f63061e.png";

export function VeriSettleBrand({
  className,
  compact = false,
  subtitle = "Cross-chain escrow · CC3 Testnet",
}: {
  className?: string;
  compact?: boolean;
  subtitle?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-cyan-100/20 bg-cyan-300/10 shadow-[0_0_22px_rgba(34,211,238,0.14)]", compact ? "h-8 w-8" : "h-10 w-10")}>
        <img src={VERISETTLE_LOGO_URL} alt="" aria-hidden="true" className="h-full w-full object-contain p-1" />
      </span>
      <span className="min-w-0">
        <span className={cn("block truncate font-display font-semibold tracking-[-0.05em] text-white", compact ? "text-base" : "text-lg")}>VeriSettle</span>
        {!compact && <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.13em] text-cyan-100/75">{subtitle}</span>}
      </span>
    </span>
  );
}
