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
    <span className={cn("inline-flex min-w-0 items-start gap-2.5 text-left", className)}>
      <span className={cn("block shrink-0 text-cyan-300", compact ? "h-8 w-8" : "h-10 w-10")}>
        <svg viewBox="0 0 40 40" aria-hidden="true" className="block h-full w-full" fill="none">
          <path d="M20 3.5 33 11v15L20 33.5 7 26V11l13-7.5Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="2" />
          <path d="m13.5 16.2 6.5-3.8 6.5 3.8v7.6L20 27.6l-6.5-3.8v-7.6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="m13.5 16.2 6.5 3.8 6.5-3.8M20 20v7.6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="20" cy="8" r="1.65" fill="currentColor" />
          <circle cx="10.5" cy="29.2" r="1.65" fill="currentColor" />
          <circle cx="29.5" cy="29.2" r="1.65" fill="currentColor" />
          <path d="m18.8 8.8-4.2 5.2m6.6-5.2 4.2 5.2m-12.4 11.3 4.6 2.6m9.4-2.6-4.6 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="min-w-0 text-left">
        <span className={cn("block truncate font-display font-semibold tracking-[-0.05em] text-white", compact ? "text-base" : "text-lg")}>VeriSettle</span>
        {!compact && <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.13em] text-cyan-100/75">{subtitle}</span>}
      </span>
    </span>
  );
}
