import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { VeriSettleBrand } from "@/components/VeriSettleBrand";
import { Button } from "@/components/ui/button";

export function OfflineFallback() {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const showOffline = () => setOffline(true);
    const hideOffline = () => setOffline(false);
    window.addEventListener("offline", showOffline);
    window.addEventListener("online", hideOffline);
    return () => {
      window.removeEventListener("offline", showOffline);
      window.removeEventListener("online", hideOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <section className="veri-offline-fallback" role="status" aria-live="assertive" aria-label="Connection lost">
      <div className="veri-offline-fallback__current" aria-hidden="true" />
      <div className="veri-offline-fallback__panel">
        <VeriSettleBrand subtitle="Connection paused · no wallet action" />
        <span className="veri-offline-fallback__icon" aria-hidden="true"><WifiOff className="h-5 w-5" /></span>
        <p className="veri-kicker">Offline fallback</p>
        <h1 className="mt-3 font-veri-display text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">Your connection paused.<br /><span className="text-cyan-200">Your wallet did not.</span></h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">VeriSettle cannot refresh public evidence while you are offline. No wallet connection, signature, transaction, or claim has been initiated.</p>
        <Button onClick={() => window.location.reload()} className="veri-action mt-7 bg-cyan-300 font-semibold text-[#06191f] hover:bg-cyan-200">Try again <RefreshCw className="ml-2 h-4 w-4" /></Button>
        <p className="mt-4 text-xs leading-5 text-slate-400">This notice closes automatically when your connection returns.</p>
      </div>
    </section>
  );
}
