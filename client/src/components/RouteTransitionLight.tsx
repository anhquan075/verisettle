import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { useMotionPreference } from "@/contexts/MotionPreferenceContext";
import { ambientPresetForPath } from "@/lib/ambientPresets";

function routeTone(location: string) {
  return ambientPresetForPath(location);
}

/** Decorative continuity cue for route changes. It never represents chain or wallet activity. */
export function RouteTransitionLight() {
  const [location] = useLocation();
  const { decorativeMotionEnabled, profile } = useMotionPreference();

  if (!decorativeMotionEnabled) return null;

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={location}
        aria-hidden="true"
        className={`veri-route-light veri-route-light--${routeTone(location)}`}
        initial={{ opacity: 0, scaleX: 0.28, filter: "blur(12px)" }}
        animate={{ opacity: [0, 0.82 * profile.opacity, 0], scaleX: [0.28, 1.12, 1.38], filter: ["blur(12px)", "blur(1px)", "blur(12px)"] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.56 * profile.duration, ease: [0.16, 1, 0.3, 1] }}
      />
    </AnimatePresence>
  );
}
