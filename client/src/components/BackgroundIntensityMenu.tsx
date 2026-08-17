import { Waves } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMotionPreference, type MotionIntensity } from "@/contexts/MotionPreferenceContext";
import { useHighContrast } from "@/contexts/HighContrastContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const labels: Record<MotionIntensity, string> = {
  low: "Low",
  balanced: "Balanced",
  vivid: "Vivid",
};

export function BackgroundIntensityMenu() {
  const { intensity, setIntensity, systemPrefersReducedMotion } = useMotionPreference();
  const { highContrast, toggleHighContrast } = useHighContrast();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button type="button" className="veri-intensity-control" data-intensity={intensity} aria-label={`Background intensity: ${labels[intensity]}`}>
              <Waves aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ambience</span>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>Tune the proof-field atmosphere</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="veri-intensity-menu w-52">
        <DropdownMenuLabel className="text-xs font-semibold tracking-wide text-cyan-50">Background intensity</DropdownMenuLabel>
        <p className="px-2 pb-2 text-[11px] leading-4 text-cyan-100/60">Tune decorative proof-field movement. Wallet and route feedback are unchanged.</p>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={intensity} onValueChange={value => setIntensity(value as MotionIntensity)}>
          {(Object.keys(labels) as MotionIntensity[]).map(option => (
            <DropdownMenuRadioItem key={option} value={option} className="text-sm text-cyan-50">
              {labels[option]}
              <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-cyan-100/45">{option === "low" ? "quiet" : option === "balanced" ? "default" : "bright"}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={highContrast} onCheckedChange={toggleHighContrast} className="text-sm text-cyan-50">High contrast <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-cyan-100/45">visibility</span></DropdownMenuCheckboxItem>
        {systemPrefersReducedMotion && <><DropdownMenuSeparator /><p className="px-2 py-1.5 text-[11px] leading-4 text-teal-100/70">System reduced-motion is active. Decorative movement is paused.</p></>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
