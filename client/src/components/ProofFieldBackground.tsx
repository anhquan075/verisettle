import { motion, useReducedMotion } from "framer-motion";
import { useMotionPreference } from "@/contexts/MotionPreferenceContext";

type ProofFieldBackgroundProps = {
  variant?: "landing" | "judge" | "workspace";
};

/**
 * Decorative proof-field ambience. It represents the source → verification →
 * settlement path without claiming live chain telemetry or wallet activity.
 */
export function ProofFieldBackground({ variant = "landing" }: ProofFieldBackgroundProps) {
  const systemPrefersReducedMotion = useReducedMotion();
  const { decorativeMotionEnabled, profile } = useMotionPreference();
  const shouldReduceMotion = systemPrefersReducedMotion || !decorativeMotionEnabled;
  const isWorkspace = variant === "workspace";
  const travelDuration = (isWorkspace ? 24 : variant === "judge" ? 20 : 18) * profile.duration;
  const drift = 5 * profile.amplitude;

  return (
    <div aria-hidden="true" className={`veri-proof-field veri-proof-field--${variant}`} style={{ opacity: shouldReduceMotion ? 1 : profile.opacity }}>
      <motion.div
        className="veri-proof-field__halo veri-proof-field__halo--one"
        animate={shouldReduceMotion ? { opacity: 0.42 } : { x: [`-${drift * 0.8}%`, `${drift}%`, `-${drift * 0.8}%`], y: [`${drift * 0.4}%`, `-${drift * 0.6}%`, `${drift * 0.4}%`], scale: [0.96, 1.06, 0.96] }}
        transition={{ duration: travelDuration, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform" }}
      />
      <motion.div
        className="veri-proof-field__halo veri-proof-field__halo--two"
        animate={shouldReduceMotion ? { opacity: 0.3 } : { x: [`${drift}%`, `-${drift * 1.2}%`, `${drift}%`], y: [`-${drift * 0.6}%`, `${drift * 0.8}%`, `-${drift * 0.6}%`], scale: [1.04, 0.94, 1.04] }}
        transition={{ duration: travelDuration + (7 * profile.duration), repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform" }}
      />
      <motion.div
        className="veri-proof-field__beam veri-proof-field__beam--primary"
        animate={shouldReduceMotion ? { opacity: 0.28 } : { x: ["-14%", "20%"], opacity: [0, 0.62, 0] }}
        transition={{ duration: (isWorkspace ? 12 : 10) * profile.duration, repeat: Infinity, ease: "easeInOut", repeatDelay: (isWorkspace ? 5 : 3) * profile.duration }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform, opacity" }}
      />
      <motion.div
        className="veri-proof-field__beam veri-proof-field__beam--secondary"
        animate={shouldReduceMotion ? { opacity: 0.2 } : { x: ["18%", "-18%"], opacity: [0, 0.45, 0] }}
        transition={{ duration: (isWorkspace ? 14 : 12) * profile.duration, repeat: Infinity, ease: "easeInOut", repeatDelay: (isWorkspace ? 7 : 5) * profile.duration }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform, opacity" }}
      />
      <div className="veri-proof-field__vignette" />
    </div>
  );
}
