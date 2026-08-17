import { motion, useReducedMotion } from "framer-motion";
import { useMotionPreference } from "@/contexts/MotionPreferenceContext";
import { AMBIENT_PRESETS, type AmbientPreset } from "@/lib/ambientPresets";

type ProofFieldBackgroundProps = {
  variant?: AmbientPreset;
};

/**
 * Decorative proof-field ambience. It represents the source → verification →
 * settlement path without claiming live chain telemetry or wallet activity.
 */
export function ProofFieldBackground({ variant = "landing" }: ProofFieldBackgroundProps) {
  const systemPrefersReducedMotion = useReducedMotion();
  const { decorativeMotionEnabled, profile } = useMotionPreference();
  const shouldReduceMotion = systemPrefersReducedMotion || !decorativeMotionEnabled;
  const preset = AMBIENT_PRESETS[variant];
  const travelDuration = preset.haloDuration * profile.duration;
  const drift = preset.drift * profile.amplitude;

  return (
    <div aria-hidden="true" className={`veri-proof-field veri-proof-field--${variant}`} style={{ opacity: shouldReduceMotion ? 1 : Math.min(1, profile.opacity * preset.opacity) }}>
      <motion.div
        className="veri-proof-field__halo veri-proof-field__halo--one"
        initial={false}
        animate={shouldReduceMotion ? { opacity: 0.42, x: "0%", y: "0%", scale: 1 } : { x: [`-${drift * 0.8}%`, `${drift}%`, `-${drift * 0.8}%`], y: [`${drift * 0.4}%`, `-${drift * 0.6}%`, `${drift * 0.4}%`], scale: [0.96, 1.06, 0.96] }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: travelDuration, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform" }}
      />
      <motion.div
        className="veri-proof-field__halo veri-proof-field__halo--two"
        initial={false}
        animate={shouldReduceMotion ? { opacity: 0.3, x: "0%", y: "0%", scale: 1 } : { x: [`${drift}%`, `-${drift * 1.2}%`, `${drift}%`], y: [`-${drift * 0.6}%`, `${drift * 0.8}%`, `-${drift * 0.6}%`], scale: [1.04, 0.94, 1.04] }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: travelDuration + (7 * profile.duration), repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform" }}
      />
      <motion.div
        className="veri-proof-field__beam veri-proof-field__beam--primary"
        initial={false}
        animate={shouldReduceMotion ? { opacity: 0.28, x: "0%" } : { x: ["-14%", "20%"], opacity: [0, 0.62, 0] }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: preset.beamDuration * profile.duration, repeat: Infinity, ease: "easeInOut", repeatDelay: preset.beamDelay * profile.duration }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform, opacity" }}
      />
      <motion.div
        className="veri-proof-field__beam veri-proof-field__beam--secondary"
        initial={false}
        animate={shouldReduceMotion ? { opacity: 0.2, x: "0%" } : { x: ["18%", "-18%"], opacity: [0, 0.45, 0] }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: (preset.beamDuration + 2) * profile.duration, repeat: Infinity, ease: "easeInOut", repeatDelay: (preset.beamDelay + 2) * profile.duration }}
        style={{ willChange: shouldReduceMotion ? "auto" : "transform, opacity" }}
      />
      <div className="veri-proof-field__vignette" />
    </div>
  );
}
