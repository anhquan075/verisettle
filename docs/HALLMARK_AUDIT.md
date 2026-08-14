# Hallmark-Informed Landing Audit

## Pre-flight findings

| Signal | Current project finding | Decision |
|---|---|---|
| Framework | React 19 with Tailwind CSS 4 and Wouter routes. | Preserve the existing route tree and component model. |
| Typography | Inter body and Space Grotesk display tokens in `client/src/index.css`. | Preserve the type pairing. |
| Palette | Dark teal/cyan Creditcoin-inspired token family. | Preserve it and name new evidence tokens rather than introducing a new theme. |
| Motion | Framer Motion is already used on the landing page. | Retain one restrained entrance sequence; avoid repetitive scroll reveals. |
| Product boundary | Real testnet contracts and public receipts exist; no fabricated usage metrics may be added. | Make actual receipts the landing-page proof object. |

## Audit conclusion

The prior landing page had a strong visual surface but retained a common product-site structure: hero, three equal feature cards, then a trust section. The Hallmark structure guidance identifies the three-equal-feature-card rhythm as a generic AI-site signal. [1]

The redesign preserves the brand and routes but switches the landing shape to a **technical workbench**: left-biased decision framing, an actual proof-evidence ledger, a vertically sequenced execution path, and a compact trust-boundary close. The primary conversion remains the existing workspace launch; the secondary conversion is now direct review of live public evidence rather than a generic feature scroll.

## Guardrails retained

The redesign does not introduce customer metrics, testimonials, fake wallet chrome, fake approvals, fake delivery verification, or copied Hallmark specimens. It uses only real testnet contract/transaction references and continues to label the testnet boundary plainly.

## Pre-emit critique

| Axis | Score | Reason |
|---|---:|---|
| Philosophy | 5/5 | The page makes evidence and trust boundaries—not generic Web3 visuals—the organizing idea. |
| Hierarchy | 4/5 | The primary workspace action, secondary evidence action, and proof ledger are readable at desktop and mobile widths. |
| Execution | 4/5 | The redesign is in-place, token-driven, route-preserving, and type-safe. |
| Specificity | 5/5 | Public receipts, chain names, proof checks, and replay protection are project-specific rather than generic claims. |
| Restraint | 4/5 | Animation remains limited to the initial entrance, and the proof grid is a quiet brand device rather than decoration. |
| Variety | 4/5 | The former equal-card section became an asymmetric workbench and vertical execution sequence. |

Desktop and 375px mobile review confirmed that primary controls remain single-line, the evidence ledger stays legible, and the execution sequence collapses without horizontal overflow.

## Reference

[1]: [Hallmark structure guidance](https://github.com/nutlope/hallmark/blob/main/skills/hallmark/references/structure.md)
