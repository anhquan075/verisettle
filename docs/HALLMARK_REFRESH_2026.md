# Hallmark Refresh — Research Notes and Implementation Boundary

**Author:** Manus AI  
**Reviewed:** 2026-08-14

## Official Hallmark findings

Hallmark’s current public guidance emphasizes **macrostructure before decoration**, a distinct navigation archetype matched to the page genre, asymmetric composition, a display/body/label type ladder, and a restrained single-accent palette. It explicitly rejects centered-everything hero layouts, uniform icon-tile grids, generic top navigation, gradient hero surfaces, and invented proof. [1]

The Tally worked example translates those principles into a useful product pattern: a left-weighted headline is paired with a **specific live product artifact**, rather than a decorative screenshot; an evidence rail connects the initial claim to a deeper operational workbench; and the page uses terse labels to establish an auditable, technical voice. [2]

| Design decision | VeriSettle application | Boundary |
| --- | --- | --- |
| Evidence-led hero artifact | Make the real public Sepolia/CC3 evidence panel the visible primary artifact, not a generic feature-card stack. | Preserve real contract/transaction references and never invent metrics, endorsements, or network state. |
| Intentional navigation | Evolve the landing navigation into an edge-aligned evidence index, then give the authenticated workspace its own operational navigation language. | Retain existing routes and accessible in-page escape paths. |
| Asymmetric workbench rhythm | Give the dashboard a durable left action/health rail and a wider deal register; tighten the detail page around primary action versus immutable evidence. | Do not alter lifecycle authorization, data shape, or receipt validation. |
| Type-forward hierarchy | Preserve Space Grotesk as the display voice and Inter as the body voice, while clarifying the display/body/label ladder. | Keep the existing dark palette, teal/cyan anchor, and contrast/focus treatment. |
| Restrained motion | Use directional, short transform/opacity transitions for rare state changes and preserve reduced-motion safety. | Do not animate high-frequency controls or validation feedback. |

## Proposed visual direction

The refinement will use a **proof ledger / operator console** visual language. The landing page becomes an evidence-led split workbench: a concise claim on the left and a public, receipt-linked outcome ledger on the right. The authenticated pages use the same visual vocabulary, but place action readiness and immutable verification records above secondary explanation. This is an original implementation informed by Hallmark’s structural principles, not a copy of the source pages.

## Additional example and live-product observations

The Hyperlane example demonstrates a second useful pattern: a sparse technical masthead, an oversized declaration, and a short row of concrete operating facts can establish context before a reader reaches the longer explanation. Its numbered sections act as wayfinding rather than decoration. [3] VeriSettle can adapt this as a compact **settlement context strip** that surfaces the applicable networks, roles, and evidence state before explanatory content.

The current VeriSettle landing already has strong evidence and a left-weighted claim, but the experience still reads as a conventional header → hero → three-step row → security panel rhythm. The refresh should therefore preserve the real evidence panel while replacing the equal-weight execution cards with a more legible proof sequence and a clearer hierarchy between public record, procedure, and trust boundary.

| Surface | Current strength | Refinement target |
| --- | --- | --- |
| Landing hero | Real receipt-linked evidence is present at first view. | Turn the proof panel into a more deliberate ledger with a small settlement-context strip and a stronger visual relationship to the claim. |
| Landing narrative | Clear plain-language explanation of Attestcoin. | Replace the generic three-card cadence with an uneven, receipt-to-finality sequence. |
| Dashboard | Existing filters and role-aware guidance explain operational state. | Establish a fixed action/readiness rail and a wider register so creating a deal and reading a deal are visibly different jobs. |
| Deal detail | Timeline, proof controls, wallet boundary, and judge flow are all available. | Use progressive disclosure and evidence grouping so the next permitted action is never visually equal to historical records. |

## Implemented refinement

The landing page now uses a compact settlement-context index, a ledger-style evidence artifact, an intentionally uneven execution sequence, and an explicit boundary close. The authenticated workspace now carries a small operational index, a register-first command surface, and an action/readiness meter. Deal detail now gives **the next permitted action** a distinct visual rail, groups receipt evidence as an index, and keeps the append-only timeline visually persistent alongside the operational work.

No lifecycle procedure, authorization rule, transaction path, contract address, explorer link, evidence record, or replay-protection behavior was changed in this pass.

## Automated verification

The Hallmark regression contract in `server/hallmarkRefreshUiContract.test.ts` checks that the public landing keeps the receipt-led and testnet-only boundary, the authenticated workspace preserves its real action/register hierarchy, and the deal detail retains the shared exact replay-protection reason. The complete quality gate passed on 2026-08-14: **7 Vitest files / 28 tests**, `pnpm check`, and `pnpm build`.

## Visual review

Desktop and 375px mobile captures were reviewed for `/`, `/app`, and `/deals/not-a-real-order`. The public landing retains its hierarchy at narrow widths: the settlement context collapses cleanly, receipt rows stay legible, the execution sequence has no horizontal overflow, and the boundary statement remains readable. The authenticated register preserves a distinct action surface, vertically stacks its operator meter at 375px, and keeps status-filter controls and deal rows readable. The unavailable-detail recovery card remains centered, concise, and reachable from the persistent workspace context.

The released real-testnet order at `/deals/2w8_iT1aNogY1b` was also reviewed at desktop and 375px widths. The next-permitted-action rail remains above the wallet evidence and release controls, receipt evidence stays distinct from the append-only timeline, and the judge replay walkthrough continues to show its expected-rejection path without crowding the active settlement evidence. The stacked mobile route remains free of horizontal overflow and retains its status, recovery, and explorer-link hierarchy.

## Sources

[1]: https://www.usehallmark.com/ "Hallmark — A design skill that refuses to look AI-generated"
[2]: https://www.usehallmark.com/examples/tally/ "Tally — Bill what your customers actually use"
[3]: https://www.usehallmark.com/examples/hyperlane/ "Hyperlane / 26 — A one-night developer summit"
