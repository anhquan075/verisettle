# VeriSettle Visual QA Record

**Reviewed:** 14 August 2026 (GMT+7)

The following independently confirmed views were inspected after the high-end command-center and deal-evidence refinements. No seeded deals or fabricated customer data were introduced for this review.

| View | Viewport | Authentication state | Verification outcome |
|---|---:|---|---|
| Public landing `/` | 1280 × 720 | Public | The asymmetric hero, Creditcoin/Attestcoin visual language, real-testnet boundary copy, navigation, proof-flow control plane, and footer were legible with no light-background regressions. |
| Public landing `/` | 375 × 812 | Public | Hero, calls to action, proof-flow panel, process cards, and trust-boundary section preserved a readable mobile hierarchy. |
| App entry `/app` | 1280 × 720 | Signed out | The dark sign-in workspace, network summary, and clear authentication CTA were visually verified. |
| App entry `/app` | 375 × 812 | Signed out | The mobile sign-in workspace preserved the dark visual system, readable network summary, and reachable authentication CTA. |
| Command center `/app` | 1280 × 720 | Authenticated managed preview | The live register showed the completed user order as `Released`, `0` active deals, `1` receipt-proven settlement, the counterpart address, and the motion-safe proof rail. |
| Command center `/app` | 375 × 812 | Authenticated managed preview | The released settlement metric, proof rail, counterpart address, and `Released` status stayed legible in the mobile register. |
| Real draft `/deals/2w8_iT1aNogY1b` | 1280 × 720 | Authenticated managed preview | The user-created `Draft` showed the staged lifecycle rail, guided execution panel, buyer/seller terms commitment, wallet readiness state, real tCTC funding control, proof-policy checks, immutable event, deployed contract configuration, and replay boundary. |
| Real draft `/deals/2w8_iT1aNogY1b` | 375 × 812 | Authenticated managed preview | The same user-created draft preserved legible stage cards, long terms-hash wrapping, wallet guidance, funding control, proof policy, timeline, and contract evidence without horizontal overflow. |
| Unavailable detail `/deals/not-a-real-order` | 1280 × 720 | Authenticated managed preview | After the bounded lookup period, the accessible `Deal unavailable` panel showed the `Deal not found.` reason plus both `Retry lookup` and `Return to register` recovery controls. |
| Unavailable detail `/deals/not-a-real-order` | 375 × 812 | Authenticated managed preview | The same error panel retained a readable reason and two reachable recovery controls without clipping or horizontal overflow. |

The standalone sandbox browser session remains signed out. The managed project-preview session is authenticated and was used only to verify the user-created draft’s layout and reachable controls. It did not perform a wallet-extension approval. The receipt-backed lifecycle remains covered by the automated suite and the separately recorded real-testnet evidence.

The unavailable-order visual test uses a deliberately non-existent route only; it does not create or seed a record. The server contract is separately covered by a regression test that returns `NOT_FOUND` for this lookup.

The final buyer/seller role-boundary landing refinement was also checked at desktop and mobile widths. The role cards, evidence ledger, and three-step role-specific execution path remained readable, with the buyer’s source approval and seller’s CC3 entitlement visible before app entry.
