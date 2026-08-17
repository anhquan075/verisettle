import { motion, useReducedMotion } from "framer-motion";
import { useMotionPreference } from "@/contexts/MotionPreferenceContext";
import { AMBIENT_PRESETS, type AmbientPreset } from "@/lib/ambientPresets";

type AttestationOrbitProps = {
  variant?: AmbientPreset;
};

/**
 * Decorative only: this is an abstract source → proof → settlement motif.
 * It never represents live chain telemetry or a wallet state.
 */
export function AttestationOrbit({ variant = "landing" }: AttestationOrbitProps) {
  const systemPrefersReducedMotion = useReducedMotion();
  const { decorativeMotionEnabled, profile } = useMotionPreference();
  const shouldReduceMotion = systemPrefersReducedMotion || !decorativeMotionEnabled;
  const preset = AMBIENT_PRESETS[variant];

  return (
    <div aria-hidden="true" className={`veri-attestation-orbit veri-attestation-orbit--${variant}`} style={{ opacity: preset.orbitOpacity * (shouldReduceMotion ? 1 : profile.opacity) }}>
      <motion.div
        className="veri-orbit-ring"
        initial={false}
        animate={shouldReduceMotion ? { opacity: 0.35, rotate: 0 } : { rotate: 360 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: preset.orbitDuration * profile.duration, repeat: Infinity, ease: "linear" }}
      >
        <span className="veri-orbit-node veri-orbit-node--source" />
        <span className="veri-orbit-node veri-orbit-node--proof" />
        <span className="veri-orbit-node veri-orbit-node--settlement" />
      </motion.div>
      <motion.div
        className="veri-orbit-signal"
        initial={false}
        animate={shouldReduceMotion ? { opacity: 0.22, scale: 1 } : { opacity: [0.16, 0.54, 0.16], scale: [0.94, 1.04, 0.94] }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: (preset.orbitDuration / 5) * profile.duration, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
