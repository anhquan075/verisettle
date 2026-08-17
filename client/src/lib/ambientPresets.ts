export type AmbientPreset = "landing" | "judge" | "audit" | "workspace" | "protocol";

type AmbientPresetConfig = {
  haloDuration: number;
  beamDuration: number;
  beamDelay: number;
  drift: number;
  opacity: number;
  orbitDuration: number;
  orbitOpacity: number;
};

export const AMBIENT_PRESETS: Record<AmbientPreset, AmbientPresetConfig> = {
  landing: { haloDuration: 18, beamDuration: 10, beamDelay: 3, drift: 5, opacity: 1, orbitDuration: 28, orbitOpacity: 0.72 },
  judge: { haloDuration: 21, beamDuration: 12, beamDelay: 5, drift: 4.4, opacity: 0.92, orbitDuration: 32, orbitOpacity: 0.58 },
  audit: { haloDuration: 27, beamDuration: 18, beamDelay: 9, drift: 2.8, opacity: 0.72, orbitDuration: 42, orbitOpacity: 0.36 },
  workspace: { haloDuration: 24, beamDuration: 12, beamDelay: 5, drift: 4.1, opacity: 0.76, orbitDuration: 34, orbitOpacity: 0.48 },
  protocol: { haloDuration: 29, beamDuration: 17, beamDelay: 9, drift: 3.2, opacity: 0.68, orbitDuration: 40, orbitOpacity: 0.42 },
};

export function ambientPresetForPath(location: string): AmbientPreset {
  if (location === "/") return "landing";
  if (location === "/judge") return "judge";
  if (location === "/contrast-audit") return "audit";
  if (location === "/protocol") return "protocol";
  return "workspace";
}
