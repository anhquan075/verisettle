import { Gauge, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ConnectionQuality = "offline" | "limited" | "online";

type BrowserConnection = EventTarget & {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

function readConnection(): ConnectionQuality {
  if (typeof navigator === "undefined" || !navigator.onLine) return "offline";
  const connection = (navigator as Navigator & { connection?: BrowserConnection }).connection;
  if (!connection) return "online";
  const limitedType = connection.effectiveType === "slow-2g" || connection.effectiveType === "2g";
  const limitedBandwidth = typeof connection.downlink === "number" && connection.downlink < 1.5;
  const highLatency = typeof connection.rtt === "number" && connection.rtt > 450;
  return connection.saveData || limitedType || limitedBandwidth || highLatency ? "limited" : "online";
}

const copy: Record<ConnectionQuality, { label: string; detail: string; tone: string }> = {
  online: { label: "Online", detail: "Browser connection is available.", tone: "bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.76)]" },
  limited: { label: "Limited", detail: "Browser connection may be slow or data-saving.", tone: "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.68)]" },
  offline: { label: "Offline", detail: "Browser connection is unavailable.", tone: "bg-rose-300 shadow-[0_0_10px_rgba(253,164,175,0.64)]" },
};

export function ConnectionQualityIndicator({ className = "" }: { className?: string }) {
  const [quality, setQuality] = useState<ConnectionQuality>(readConnection);
  const current = copy[quality];
  const Icon = quality === "offline" ? WifiOff : quality === "limited" ? Gauge : Wifi;

  useEffect(() => {
    const update = () => setQuality(readConnection());
    const connection = (navigator as Navigator & { connection?: BrowserConnection }).connection;
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    connection?.addEventListener("change", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      connection?.removeEventListener("change", update);
    };
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span role="status" aria-live="polite" tabIndex={0} className={`veri-connection-signal inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-200 outline-none transition-colors hover:border-cyan-100/25 hover:bg-cyan-300/[0.07] focus-visible:ring-2 focus-visible:ring-cyan-300 ${className}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${current.tone}`} aria-hidden="true" />
          <Icon className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
          <span className="hidden lg:inline">{current.label}</span>
          <span className="sr-only">Browser connection {current.label}. This does not indicate wallet, chain, or transaction status.</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-56 text-center">{current.detail} Browser connection only; not wallet, chain, or transaction status.</TooltipContent>
    </Tooltip>
  );
}
