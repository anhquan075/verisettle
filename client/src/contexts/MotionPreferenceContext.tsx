import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

export type MotionIntensity = "low" | "balanced" | "vivid";

type MotionProfile = {
  amplitude: number;
  duration: number;
  opacity: number;
};

const MOTION_PROFILES: Record<MotionIntensity, MotionProfile> = {
  low: { amplitude: 0.52, duration: 1.45, opacity: 0.54 },
  balanced: { amplitude: 1, duration: 1, opacity: 1 },
  vivid: { amplitude: 1.28, duration: 0.8, opacity: 1.18 },
};

type MotionPreferenceValue = {
  decorativeMotionEnabled: boolean;
  intensity: MotionIntensity;
  profile: MotionProfile;
  systemPrefersReducedMotion: boolean;
  setIntensity: (intensity: MotionIntensity) => void;
};

const STORAGE_KEY = "verisettle-motion-preference";

const MotionPreferenceContext = createContext<MotionPreferenceValue | null>(null);

export function MotionPreferenceProvider({ children }: { children: React.ReactNode }) {
  const systemPrefersReducedMotion = Boolean(useReducedMotion());
  const [intensity, setIntensity] = useState<MotionIntensity>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === "low" || saved === "vivid" ? saved : "balanced";
    } catch {
      return "balanced";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, intensity);
    } catch {
      // Storage can be unavailable in privacy-focused browsing contexts.
    }
  }, [intensity]);

  const value = useMemo<MotionPreferenceValue>(() => ({
    decorativeMotionEnabled: !systemPrefersReducedMotion,
    intensity,
    profile: MOTION_PROFILES[intensity],
    systemPrefersReducedMotion,
    setIntensity,
  }), [intensity, systemPrefersReducedMotion]);

  return <MotionPreferenceContext.Provider value={value}>{children}</MotionPreferenceContext.Provider>;
}

export function useMotionPreference() {
  const context = useContext(MotionPreferenceContext);
  if (!context) throw new Error("useMotionPreference must be used within MotionPreferenceProvider");
  return context;
}
