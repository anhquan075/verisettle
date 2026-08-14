# VeriSettle Visual QA Record

**Reviewed:** 14 August 2026 (GMT+7)

The following views were inspected after the high-end command-center and deal-evidence refinements. Screenshots were taken from the running authenticated project preview; no seeded deals or fabricated customer data were introduced for this review.

| View | Viewport | Authentication state | Verification outcome |
|---|---:|---|---|
| Public landing `/` | 1280 × 720 | Public | The asymmetric hero, Creditcoin/Attestcoin visual language, real-testnet boundary copy, navigation, proof-flow control plane, and footer were legible with no light-background regressions. |
| Public landing `/` | 375 × 812 | Public | Hero, calls to action, proof-flow panel, process cards, and trust-boundary section preserved a readable mobile hierarchy. |
| App entry `/app` | 1280 × 720 | Signed out | The dark sign-in workspace, network summary, and clear authentication CTA were visually verified. |
| App entry `/app` | 375 × 812 | Signed out | The mobile sign-in workspace preserved the dark visual system, readable network summary, and reachable authentication CTA. |

The signed-in command center and live deal-detail screen require a user-created purchase order and connected wallet. Their receipt-backed controls, lifecycle rail, provenance links, error alert, and responsive components are covered by strict type checks and the automated lifecycle test suite. The final live wallet run will add signed-in screenshot evidence and deal-specific transactions without altering this public baseline.

The sandbox browser session was confirmed signed out during the final check. The user’s management-preview session remains the appropriate place to complete the signed-in wallet verification, because it owns the imported testnet wallet and authentication state.
