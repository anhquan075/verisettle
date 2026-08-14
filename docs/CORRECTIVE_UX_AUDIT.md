# Corrective UX Audit — Post-Hallmark Pass

**Author:** Manus AI  
**Reviewed:** 2026-08-14

## Reported problem and confirmed cause

The prior refinement made the product more orderly, but it over-indexed on thin rules, compact metadata, and repeated dark panels. This created a visually competent but **too quiet and uniform** experience. The most important work—creating a protected order and understanding the next safe settlement action—does not carry enough distinct visual weight compared with surrounding evidence panels.

The `Protocol reference` navigation item is also not usable from the register. It targets `/app#protocol`, while the deal register has no element with `id="protocol"`; that identifier exists only inside deal detail. The navigation therefore has no reliable reference destination.

| Surface | Confirmed weakness | Corrective direction |
| --- | --- | --- |
| Landing | Long vertical ledger rhythm, repeated hairlines, and low visual payoff after the hero. | Introduce a bolder evidence narrative: a large, tangible settlement moment with concise supporting proof and more expressive section transitions. |
| Deal register | The top block and register use similar panel/rule language, so the first task does not feel special. | Give “create order” a strong focal treatment and use more varied composition for active deal state and list navigation. |
| Deal detail | Dense information is accurate but visually flat; action, proof, and historical evidence compete for attention. | Establish a clear action lane, expandable evidence modules, and a more editorial timeline treatment while keeping every action in place. |
| Protocol reference | Link resolves to a nonexistent anchor from `/app`. | Create a real authenticated `/protocol` page using the shared deployed addresses, chain configuration, event contracts, and practical explorer/documentation links. |

## Design guardrails

The corrective pass will keep the dark Creditcoin palette, Inter and Space Grotesk, reduced-motion safety, exact status labels, real testnet claims, immutable timeline, and exact replay-protection reason. It will remove no lifecycle action, contract evidence, or accessibility affordance. The visual language will shift from “generic command ledger” to **evidence studio**: richer scale changes, deliberate offset composition, stronger action contrast, and fewer same-sized containers.

## Implementation map

| File | Planned correction |
| --- | --- |
| `client/src/pages/Home.tsx` | Replace the subdued evidence-index cadence with an asymmetric evidence studio: a stronger stage-specific hero, a more expressive proof artifact, and a compact execution story. |
| `client/src/pages/DealDashboard.tsx` | Make the primary order-creation action the visible focal point; use an offset active-work panel and a lighter-weight deal list instead of a stack of equally weighted boxes. |
| `client/src/pages/DealDetail.tsx` | Increase action-zone contrast and reduce visual competition around immutable evidence, while retaining every real transaction and recovery control. |
| `client/src/pages/ProtocolReference.tsx` | Add a real authenticated protocol reference route that presents deployed contracts, network IDs, event/function contracts, and official documentation/explorer actions. |
| `client/src/App.tsx` / `client/src/components/DashboardLayout.tsx` | Register `/protocol` and point desktop/mobile navigation to it. |
| `client/src/index.css` | Add only focused evidence-studio surfaces and responsive rules; retain existing focus, reduced-motion, and dark-theme foundations. |

## Validation record

Desktop and 375px reviews confirm the landing now has a stronger asymmetric focal point: the proof route leads into the actual receipt ledger, and the execution story uses a high-contrast task panel rather than a uniform sequence of dark boxes. The authenticated register now differentiates the primary job—creating an order—from the operational queue and persisted order list. The protocol reference route renders the real source emitter, deployed CC3 ASC, BlockProver precompile, chain identifiers, ABIs, explorer actions, copy controls, and official documentation links at both widths.

Direct navigation to `/protocol` also resolves correctly. In an unsigned sandbox browser it deliberately presents the existing workspace sign-in gate, because protocol deployment detail is authenticated workspace content; signed-in managed-preview captures confirm the full reference page beyond that gate. This is expected access behavior, not the former missing-anchor failure.
