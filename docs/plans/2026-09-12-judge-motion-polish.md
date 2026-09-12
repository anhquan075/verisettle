# Judge-facing motion + design-system polish

## Problem
Home and `/judge` already carry the PR #2 dark-tech, trust-first language, but first-load motion is conservative and the visual tokens are only partly shared. Technical judges need a cinematic, coherent demo that still reads as proof-before-release — not generic AI-purple motion.

## Direction
- DESIGN_VARIANCE 7 / MOTION_INTENSITY 7 / VISUAL_DENSITY 4
- Linear × Arc restraint: cyan/emerald on charcoal, Space Grotesk display, glass only on chrome
- Shared CSS variables + framer-motion helpers (already in deps)
- Finite entrance / scroll / hover motion; no new infinite content loops
- `prefers-reduced-motion` and existing `MotionPreferenceProvider` remain authoritative

## Units
1. Tokenize motion + surfaces in `client/src/index.css` (`--veri-ease`, radii, shadows, proof/released glows, one-shot keyframes).
2. Add `client/src/lib/motion.ts` (+ optional `Reveal`) for staggered hero / scroll reveals used by Home and `/judge`.
3. Polish Home, Judge Evidence, ledger, judge rail, and V2 pack surfaces without changing evidence data or wallet/API routes.
4. Contract tests: tokens exist, reduced-motion still gated, proof copy and receipt hashes unchanged.

## Non-goals
Wallet connect, API routes, evidence JSON, hashes, or replay semantics.
