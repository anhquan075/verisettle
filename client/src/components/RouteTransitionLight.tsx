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
        initial={{ opacity: 0, scaleX: 0.34, filter: "blur(10px)" }}
        animate={{ opacity: [0, 0.72 * profile.opacity, 0], scaleX: [0.34, 1.08, 1.3], filter: ["blur(10px)", "blur(2px)", "blur(10px)"] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.46 * profile.duration, ease: [0.16, 1, 0.3, 1] }}
      />
    </AnimatePresence>
  );
}
