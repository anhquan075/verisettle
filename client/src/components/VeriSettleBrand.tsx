import { cn } from "@/lib/utils";

type BrandTone = "brand" | "monochrome";
type BrandSurface = "dark" | "light";
const INTERLOCKING_VERISSETTLE_MARK = "/manus-storage/verisettle-interlocking-alpha_0a013cf6.png";

export function VeriSettleBrand({
  className,
  compact = false,
  subtitle = "Cross-chain escrow · CC3 Testnet",
  tone = "brand",
  surface = "dark",
}: {
  className?: string;
  compact?: boolean;
  subtitle?: string;
  tone?: BrandTone;
  surface?: BrandSurface;
}) {
  const isLight = surface === "light";
  const markFilter = tone === "monochrome" ? (isLight ? "grayscale contrast-125 brightness-50" : "grayscale brightness-0 invert") : "";
  const titleColor = isLight ? "text-slate-950" : "text-white";
  const subtitleColor = isLight ? "text-slate-600" : "text-cyan-100/75";

  return (
    <span className={cn("inline-flex min-w-0 items-start gap-2.5 text-left", className)}>
      <span className={cn("block shrink-0", compact ? "h-8 w-8" : "h-10 w-10")}>
        <img src={INTERLOCKING_VERISSETTLE_MARK} alt="" aria-hidden="true" className={cn("block h-full w-full object-contain", markFilter)} />
      </span>
      <span className="min-w-0 text-left">
        <span className={cn("block truncate font-veri-display font-semibold tracking-[-0.06em]", titleColor, compact ? "text-[0.97rem]" : "text-lg")}>VeriSettle</span>
        {!compact && <span className={cn("mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.13em]", subtitleColor)}>{subtitle}</span>}
      </span>
    </span>
  );
}
