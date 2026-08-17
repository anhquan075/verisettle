import { createContext, useContext, useEffect, useMemo, useState } from "react";

type HighContrastValue = {
  highContrast: boolean;
  toggleHighContrast: () => void;
};

const STORAGE_KEY = "verisettle-high-contrast";
const HighContrastContext = createContext<HighContrastValue | null>(null);

export function HighContrastProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.dataset.contrast = highContrast ? "high" : "normal";
    try {
      localStorage.setItem(STORAGE_KEY, highContrast ? "on" : "off");
    } catch {
      // Storage can be unavailable in privacy-focused browsing contexts.
    }
  }, [highContrast]);

  const value = useMemo(() => ({ highContrast, toggleHighContrast: () => setHighContrast(current => !current) }), [highContrast]);
  return <HighContrastContext.Provider value={value}>{children}</HighContrastContext.Provider>;
}

export function useHighContrast() {
  const context = useContext(HighContrastContext);
  if (!context) throw new Error("useHighContrast must be used within HighContrastProvider");
  return context;
}
