import { motion, useReducedMotion } from "framer-motion";
import { useMotionPreference } from "@/contexts/MotionPreferenceContext";

type AttestationOrbitProps = {
  variant?: "landing" | "workspace";
};

/**
 * Decorative only: this is an abstract source → proof → settlement motif.
 * It never represents live chain telemetry or a wallet state.
 */
export function AttestationOrbit({ variant = "landing" }: AttestationOrbitProps) {
  const systemPrefersReducedMotion = useReducedMotion();
  const { decorativeMotionEnabled } = useMotionPreference();
  const shouldReduceMotion = systemPrefersReducedMotion || !decorativeMotionEnabled;
  const isWorkspace = variant === "workspace";

  return (
    <div aria-hidden="true" className={`veri-attestation-orbit veri-attestation-orbit--${variant}`}>
      <motion.div
        className="veri-orbit-ring"
        animate={shouldReduceMotion ? { opacity: 0.35 } : { rotate: 360 }}
        transition={shouldReduceMotion ? { duration: 0.2 } : { duration: isWorkspace ? 34 : 28, repeat: Infinity, ease: "linear" }}
      >
        <span className="veri-orbit-node veri-orbit-node--source" />
        <span className="veri-orbit-node veri-orbit-node--proof" />
        <span className="veri-orbit-node veri-orbit-node--settlement" />
      </motion.div>
      <motion.div
        className="veri-orbit-signal"
        animate={shouldReduceMotion ? { opacity: 0.22 } : { opacity: [0.16, 0.54, 0.16], scale: [0.94, 1.04, 0.94] }}
        transition={shouldReduceMotion ? { duration: 0.2 } : { duration: isWorkspace ? 7 : 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
