import { Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHighContrast } from "@/contexts/HighContrastContext";

export function HighContrastToggle({ className = "" }: { className?: string }) {
  const { highContrast, toggleHighContrast } = useHighContrast();
  const detail = highContrast ? "Turn off high contrast" : "Turn on high contrast";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={`veri-contrast-toggle ${className}`} data-active={highContrast} aria-pressed={highContrast} aria-label={detail} onClick={toggleHighContrast}>
          <Eye aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Contrast</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>Increase text, border, and focus visibility</TooltipContent>
    </Tooltip>
  );
}
