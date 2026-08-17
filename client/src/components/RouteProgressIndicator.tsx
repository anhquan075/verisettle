import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { useMotionPreference } from "@/contexts/MotionPreferenceContext";

function routeName(location: string) {
  if (location === "/") return "Landing";
  if (location === "/judge") return "Judge Evidence";
  if (location === "/app") return "Workspace";
  if (location === "/protocol") return "Protocol";
  return "Workspace";
}

/** Short navigation-progress cue. It confirms the displayed route without representing network activity. */
export function RouteProgressIndicator() {
  const [location] = useLocation();
  const { systemPrefersReducedMotion } = useMotionPreference();

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div key={location} className="veri-route-progress" role="status" aria-live="polite">
        <motion.div
          className="veri-route-progress__bar"
          aria-hidden="true"
          initial={{ scaleX: 0, opacity: 0.55 }}
          animate={systemPrefersReducedMotion ? { scaleX: 1, opacity: 0.72 } : { scaleX: [0, 0.76, 1], opacity: [0.55, 1, 0] }}
          transition={systemPrefersReducedMotion ? { duration: 0.12 } : { duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
        />
        <span className="sr-only" role="status">Navigated to {routeName(location)}</span>
      </motion.div>
    </AnimatePresence>
  );
}
