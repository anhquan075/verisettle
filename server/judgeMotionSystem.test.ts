import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canvasEnter, enterTransition, heroEnter, staggerDelay, VERI_EASE } from "../client/src/lib/motion";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf-8");
}

describe("judge-facing motion and design-system polish", () => {
  const styles = source("../client/src/index.css");
  const home = source("../client/src/pages/Home.tsx");
  const judgePage = source("../client/src/pages/JudgeEvidence.tsx");
  const motionPreference = source("../client/src/contexts/MotionPreferenceContext.tsx");
  const packCard = source("../client/src/components/JudgeEvidencePackCard.tsx");

  it("tokenizes motion, surfaces, and proof-state accents", () => {
    expect(styles).toContain("--veri-ease");
    expect(styles).toContain("--veri-ease-enter");
    expect(styles).toContain("--veri-shadow-panel");
    expect(styles).toContain("--veri-glow-released");
    expect(styles).toContain("--veri-radius-panel");
    expect(styles).toContain("@keyframes veri-hero-rise");
    expect(styles).toContain("@keyframes veri-node-ignite");
    expect(styles).toContain("@keyframes veri-header-sheen");
    expect(styles).toContain("veri-proof-chip--released");
    expect(VERI_EASE).toEqual([0.23, 1, 0.32, 1]);
  });

  it("keeps Home and /judge on the shared cinematic entrance path", () => {
    expect(home).toContain("heroEnter");
    expect(home).toContain("shouldReduceMotion");
    expect(home).toContain("openJudgeRoute");
    expect(home).toContain("Proof first.");
    expect(judgePage).toContain("heroEnter");
    expect(judgePage).toContain("shouldReduceMotion");
    expect(judgePage).toContain("Inspect proof. Not promises.");
    expect(judgePage).toContain("Attestcoin verifies the acceptance receipt, NOT physical delivery.");
    expect(packCard).toContain("EscrowReleasedV2");
    expect(packCard).toContain('ready.policy === "v2_deployed"');
  });

  it("disables decorative motion when the system asks for reduced motion", () => {
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain('html[data-motion="reduced"]');
    expect(motionPreference).toContain('root.dataset.motion = systemPrefersReducedMotion ? "reduced" : intensity');
    expect(heroEnter(true)).toBe(false);
    expect(canvasEnter(true)).toBe(false);
    expect(staggerDelay(true, 3, 0.08, 0.1)).toBe(0);
    expect(enterTransition(true, 0.2, 0.5).duration).toBe(0);
    expect(enterTransition(false, 0.16, 0.5).delay).toBe(0.16);
  });
});
