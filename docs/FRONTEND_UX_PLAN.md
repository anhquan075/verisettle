# VeriSettle Complete Frontend Enhancement Plan

## Design System

The application will remain a **dark evidence workbench**, not a generic exchange or marketing dashboard. The system uses a deliberate contrast between `Space Grotesk` display type and `Inter` operational copy, high-contrast teal/cyan proof signals, near-black substrate surfaces, one primary action per lifecycle state, and a fixed 4/8 spacing rhythm. The UI/UX Pro Max generated light-mode blue/orange palette is intentionally not adopted because it conflicts with VeriSettle’s established proof-boundary identity; its hierarchy, access, feedback, responsive, and motion guidance is adopted instead. [1]

| Product rule | Cross-page implementation |
|---|---|
| Make state legible before action | Every surface shows an explicit state, a single next action, and an evidence or recovery path. |
| Bind roles to outcomes | Buyer authority and seller entitlement appear in the landing explanation, draft form, terms panel, and released outcome. |
| Keep recovery contextual | Validation errors live next to their field; receipt recovery is co-located with funding; unavailable routes provide retry and escape actions. |
| Let motion explain change | Motion marks panel entry and lifecycle state changes; it never moves layout-critical information or bypasses reduced-motion preferences. |
| Treat mobile as an operating surface | No data table requires horizontal scroll; status labels, actions, and error recovery remain reachable at 375px. |

## Page-Level Refinement Map

| Surface | Current strength | Targeted enhancement |
|---|---|---|
| Public landing | Strong proof-first hero and real evidence ledger | Add a keyboard skip link, tighter role-aware conversion narrative, and clearer mobile navigation/access to evidence. |
| Signed-out workspace | Clear testnet context | Refine the sign-in card as a stateful entry screen with a concise assurance strip and consistent focus/pressed treatment. |
| Deal register | Real metrics, purchase-order form, mobile list | Add a form progress model, inline field errors and focusable summary, more intentional empty/loading/error states, and clearer row affordances. |
| Deal detail | Rich lifecycle and evidence | Clarify operation status, preserve action focus, and keep receipt recovery/source proof/replay controls visibly linked to their current state. |
| Navigation and failure states | Dark sidebar, unavailable-detail panel | Make active context resilient for detail routes and bring global 404/runtime recovery into the same visual language. |

## Quality Gates

The implementation will retain visible focus rings, semantic labels, `aria-live` error feedback, 44px minimum action targets where practical, reduced-motion behavior, and desktop/mobile verification. It will not alter wallet signing, contracts, tRPC procedures, or real-testnet evidence. [2]

## Implementation Record

The frontend pass added skip links for public and authenticated workspaces; synchronized dark semantic tokens with the evidence-workbench palette; improved route-aware navigation; added an authenticated context strip; turned the purchase-order creation experience into a staged, validation-led form; improved live action announcements and receipt-recovery guidance; and redesigned global unavailable-route/runtime recovery panels to explain safe exit behavior. The landing, signed-in register, released deal, unavailable detail state, and 375px mobile variants were visually reviewed after the changes.

## References

[1]: [UI/UX Pro Max × Hallmark Audit](UX_PRO_MAX_AUDIT.md)

[2]: [UI/UX Pro Max Skill — accessibility and interaction priorities](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md)
