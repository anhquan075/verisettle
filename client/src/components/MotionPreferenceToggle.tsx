import { Pause, Play } from "lucide-react";
import { useMotionPreference } from "@/contexts/MotionPreferenceContext";

export function MotionPreferenceToggle() {
  const { decorativeMotionEnabled, preference, systemPrefersReducedMotion, toggleDecorativeMotion } = useMotionPreference();
  const label = decorativeMotionEnabled ? "Motion on" : "Motion off";
  const detail = systemPrefersReducedMotion
    ? "System reduced-motion preference is active"
    : decorativeMotionEnabled
      ? "Pause decorative motion"
      : "Resume decorative motion";

  return (
    <button
      type="button"
      onClick={toggleDecorativeMotion}
      aria-pressed={!decorativeMotionEnabled}
      aria-label={detail}
      title={detail}
      className="veri-motion-toggle"
      data-preference={preference}
    >
      {decorativeMotionEnabled ? <Pause aria-hidden="true" className="h-3.5 w-3.5" /> : <Play aria-hidden="true" className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only">{systemPrefersReducedMotion ? ". System preference reduces motion." : ""}</span>
    </button>
  );
}
