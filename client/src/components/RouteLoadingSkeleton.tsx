import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

type RouteKind = "landing" | "judge" | "workspace" | "protocol";

function routeKind(location: string): RouteKind {
  if (location === "/judge") return "judge";
  if (location === "/protocol") return "protocol";
  if (location === "/app" || location.startsWith("/deals/")) return "workspace";
  return "landing";
}

function SkeletonBlocks({ kind }: { kind: RouteKind }) {
  if (kind === "judge") {
    return <><Skeleton className="h-3 w-32" /><Skeleton className="mt-6 h-11 w-72 max-w-full" /><Skeleton className="mt-2 h-11 w-56 max-w-[78%]" /><Skeleton className="mt-7 h-4 w-full max-w-md" /><div className="mt-10 grid grid-cols-3 gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div></>;
  }
  if (kind === "workspace") {
    return <><div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]"><Skeleton className="h-64" /><Skeleton className="h-64" /></div><Skeleton className="mt-8 h-4 w-36" /><div className="mt-3 grid gap-3 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div></>;
  }
  if (kind === "protocol") {
    return <><div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><div><Skeleton className="h-3 w-36" /><Skeleton className="mt-6 h-11 w-72 max-w-full" /><Skeleton className="mt-2 h-11 w-60 max-w-[84%]" /><Skeleton className="mt-7 h-4 w-full max-w-sm" /></div><div className="grid grid-cols-3 gap-3"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div></div><div className="mt-8 grid gap-4 sm:grid-cols-2"><Skeleton className="h-44" /><Skeleton className="h-44" /></div></>;
  }
  return <><div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]"><div><Skeleton className="h-8 w-48" /><Skeleton className="mt-7 h-14 w-80 max-w-full" /><Skeleton className="mt-2 h-14 w-64 max-w-[84%]" /><Skeleton className="mt-8 h-4 w-full max-w-md" /><Skeleton className="mt-3 h-4 w-4/5 max-w-sm" /><div className="mt-8 flex gap-3"><Skeleton className="h-11 w-32" /><Skeleton className="h-11 w-32" /></div></div><Skeleton className="h-80" /></div></>;
}

/** Brief route-aware placeholder. It is navigation feedback, not blockchain or wallet state. */
export function RouteLoadingSkeleton() {
  const [location] = useLocation();
  const reducedMotion = useReducedMotion();
  const mounted = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), reducedMotion ? 110 : 260);
    return () => window.clearTimeout(timeout);
  }, [location, reducedMotion]);

  const kind = routeKind(location);
  return (
    <AnimatePresence>
      {visible && <motion.div className="veri-route-skeleton" role="status" aria-live="polite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0.01 : 0.14 }}>
        <div className={`veri-route-skeleton__surface veri-route-skeleton__surface--${kind}`}>
          <SkeletonBlocks kind={kind} />
        </div>
        <span className="sr-only">Loading {kind === "judge" ? "Judge Evidence" : kind} layout</span>
      </motion.div>}
    </AnimatePresence>
  );
}
