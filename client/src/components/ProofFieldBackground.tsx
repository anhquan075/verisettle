import { motion, useReducedMotion } from "framer-motion";

type ProofFieldBackgroundProps = {
  variant?: "landing" | "judge" | "workspace";
};

/**
 * Decorative proof-field ambience. It represents the source → verification →
 * settlement path without claiming live chain telemetry or wallet activity.
 */
export function ProofFieldBackground({ variant = "landing" }: ProofFieldBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();
  const isWorkspace = variant === "workspace";
  const travelDuration = isWorkspace ? 24 : variant === "judge" ? 20 : 18;

  return (
    <div aria-hidden="true" className={`veri-proof-field veri-proof-field--${variant}`}>
      <motion.div
        className="veri-proof-field__halo veri-proof-field__halo--one"
        animate={shouldReduceMotion ? { opacity: 0.42 } : { x: ["-4%", "5%", "-4%"], y: ["2%", "-3%", "2%"], scale: [0.96, 1.06, 0.96] }}
        transition={{ duration: travelDuration, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform" }}
      />
      <motion.div
        className="veri-proof-field__halo veri-proof-field__halo--two"
        animate={shouldReduceMotion ? { opacity: 0.3 } : { x: ["5%", "-6%", "5%"], y: ["-3%", "4%", "-3%"], scale: [1.04, 0.94, 1.04] }}
        transition={{ duration: travelDuration + 7, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform" }}
      />
      <motion.div
        className="veri-proof-field__beam veri-proof-field__beam--primary"
        animate={shouldReduceMotion ? { opacity: 0.28 } : { x: ["-14%", "20%"], opacity: [0, 0.62, 0] }}
        transition={{ duration: isWorkspace ? 12 : 10, repeat: Infinity, ease: "easeInOut", repeatDelay: isWorkspace ? 5 : 3 }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform, opacity" }}
      />
      <motion.div
        className="veri-proof-field__beam veri-proof-field__beam--secondary"
        animate={shouldReduceMotion ? { opacity: 0.2 } : { x: ["18%", "-18%"], opacity: [0, 0.45, 0] }}
        transition={{ duration: isWorkspace ? 14 : 12, repeat: Infinity, ease: "easeInOut", repeatDelay: isWorkspace ? 7 : 5 }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform, opacity" }}
      />
      <div className="veri-proof-field__vignette" />
    </div>
  );
}
