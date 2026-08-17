import { createContext, useContext, useEffect, useMemo, useState } from "react";

type HighContrastValue = {
  highContrast: boolean;
  systemPrefersHighContrast: boolean;
};

const HighContrastContext = createContext<HighContrastValue | null>(null);

export function HighContrastProvider({ children }: { children: React.ReactNode }) {
  const [systemPrefersHighContrast, setSystemPrefersHighContrast] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-contrast: more)");
    const update = () => setSystemPrefersHighContrast(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const highContrast = systemPrefersHighContrast;

  useEffect(() => {
    document.documentElement.dataset.contrast = highContrast ? "high" : "normal";
  }, [highContrast]);

  const value = useMemo(() => ({ highContrast, systemPrefersHighContrast }), [highContrast, systemPrefersHighContrast]);
  return <HighContrastContext.Provider value={value}>{children}</HighContrastContext.Provider>;
}

export function useHighContrast() {
  const context = useContext(HighContrastContext);
  if (!context) throw new Error("useHighContrast must be used within HighContrastProvider");
  return context;
}
