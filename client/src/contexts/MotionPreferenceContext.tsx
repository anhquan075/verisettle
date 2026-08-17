import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

type MotionPreference = "on" | "off";

type MotionPreferenceValue = {
  decorativeMotionEnabled: boolean;
  preference: MotionPreference;
  systemPrefersReducedMotion: boolean;
  toggleDecorativeMotion: () => void;
};

const STORAGE_KEY = "verisettle-motion-preference";

const MotionPreferenceContext = createContext<MotionPreferenceValue | null>(null);

export function MotionPreferenceProvider({ children }: { children: React.ReactNode }) {
  const systemPrefersReducedMotion = Boolean(useReducedMotion());
  const [preference, setPreference] = useState<MotionPreference>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "off" ? "off" : "on";
    } catch {
      return "on";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Storage can be unavailable in privacy-focused browsing contexts.
    }
  }, [preference]);

  const value = useMemo<MotionPreferenceValue>(() => ({
    decorativeMotionEnabled: preference === "on" && !systemPrefersReducedMotion,
    preference,
    systemPrefersReducedMotion,
    toggleDecorativeMotion: () => setPreference(current => current === "on" ? "off" : "on"),
  }), [preference, systemPrefersReducedMotion]);

  return <MotionPreferenceContext.Provider value={value}>{children}</MotionPreferenceContext.Provider>;
}

export function useMotionPreference() {
  const context = useContext(MotionPreferenceContext);
  if (!context) throw new Error("useMotionPreference must be used within MotionPreferenceProvider");
  return context;
}
