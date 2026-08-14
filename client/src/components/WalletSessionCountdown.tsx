import { describeSessionExpiry } from "@/lib/sessionExpiry";
import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

export function WalletSessionCountdown({ expiresAt }: { expiresAt: Date | string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const expiry = describeSessionExpiry(expiresAt, now);
  return (
    <span
      role="status"
      aria-live="polite"
      title={expiry.label}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${expiry.warning ? "border-amber-200/25 bg-amber-300/[0.08] text-amber-100" : "border-cyan-200/15 bg-cyan-300/[0.045] text-cyan-100"}`}
    >
      <Clock3 className="h-3 w-3" />
      <span className="hidden sm:inline">Wallet</span>
      <span>{expiry.shortLabel}</span>
    </span>
  );
}
