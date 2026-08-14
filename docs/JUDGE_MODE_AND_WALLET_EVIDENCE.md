# Wallet Approval Evidence and Judge Replay Mode

## User-Controlled Wallet Evidence

VeriSettle cannot and must not capture a browser extension’s private-key material, recovery phrase, password, or approval interface. The evidence workflow therefore guides the user to capture only public, non-sensitive proof after a real action: the connected public address, selected testnet, transaction hash, and resulting receipt-backed VeriSettle state.

| Step | User action | Safe evidence to capture | Never capture |
|---|---|---|---|
| 1 | Import the testnet-only buyer or seller keystore in Rabby/SubWallet. | The public `0x…` address, if desired. | Password, keystore JSON contents, private key, recovery phrase. |
| 2 | Select CC3 Testnet and connect through VeriSettle. | The connected public address and app network state. | Extension account-management screens. |
| 3 | Approve a real testnet transaction. | The transaction hash and the resulting app receipt/state. | Extension confirmation contents beyond its public transaction hash. |

The interface will present this as an evidence checklist, not an in-app claim that an approval occurred. The user checks the displayed points after completing their own extension action.

## Judge Replay Walkthrough

Judge Mode begins only on an order in `released` status. It separates three concepts:

1. **Threat:** a previous valid proof could be presented again after settlement.
2. **Safe demonstration:** the app requests a replay of the already processed proof query; the deployed ASC returns `QueryAlreadyProcessed`. No additional escrow value is funded or transferred.
3. **Resolution boundary:** an actual commercial disagreement uses the distinct on-chain dispute path while the order remains funded. A replay rejection is a security signal, not a dispute or a reversal.

The walkthrough will expose the settlement receipt, expected rejection text, and a clear next action. It will not invent a dispute, seed a review outcome, or imply that replay protection resolves off-chain delivery disagreements.

## Implemented Evidence Surfaces

The released deal view now contains a **Wallet approval evidence** checklist immediately beneath its connected-wallet area. It identifies the expected buyer address, explains which public state is appropriate to capture after a user-controlled extension action, and explicitly warns against capturing passwords, keystores, seed phrases, or private keys.

Released orders also render **Judge mode · replay safety**. The mode shows the existing settlement receipt, walks a reviewer through the one-time proof threat model, provides the safe replay-check action, displays the expected `QueryAlreadyProcessed` rejection, and explains that the separate dispute control is for funded commercial disagreements—not replay results.

The user-created released deal `2w8_iT1aNogY1b` and the authenticated command center were visually reviewed at desktop and 375px mobile widths. The wallet checklist, replay walkthrough, settlement receipt link, and dispute boundary remained legible with touch-sized controls and no horizontal overflow.

## Post-Change Validation

The post-change quality gate passed with **24 Vitest assertions**, strict TypeScript checking, and a production build. The production bundler reported only its existing large-chunk advisory; it did not report a build failure.

The wallet evidence and judge controls use the application’s `veri-action` focus-visible treatment, providing a 2px cyan focus ring and visible pressed feedback. The proof replay action is disabled during an active operation, exposes expected replay success through a `role="status"` panel, and sends unexpected failures through the page-level `role="alert"` recovery panel. The visible **Connect testnet wallet** action remains intentionally user-controlled; it is not marked as completed by the checklist itself.

## Explicit Interaction Contract Verification

The judge replay result classifier was tested with both branches: the deployed ASC’s expected `QueryAlreadyProcessed` result is accepted as a successful judge-mode outcome, while an unexpected result produces the explicit `Unexpected replay result.` recovery path. The expected lifecycle procedure rejection is separately classified before showing the success status, preventing it from being confused with an operational failure.

An automated accessibility-contract test verifies that the wallet evidence region has its accessible label and privacy copy; the wallet connection action uses the shared focus-visible `veri-action` class; the judge replay control is disabled while an operation is active; the successful branch exposes `role="status"`; and unexpected failures remain reachable through the page-level `role="alert"`. These contracts apply at desktop and mobile because the controls use the same responsive component markup.

A rendered React component test now exercises both visible judge outcomes: `replayVerified` produces the `role="status"` success panel, while a supplied `replayError` produces the local `role="alert"` retry panel. The render test also confirms that the wallet checklist shows only public-evidence guidance. The full suite now passes **24 assertions**, strict TypeScript checking, and a production build.

## Sandbox Self-Verification

The released real-testnet deal `2w8_iT1aNogY1b` was recaptured in the managed preview at **1280 × 720** and **375 × 812** after the final judge-mode update. Both views showed the wallet evidence checklist, released receipt evidence, one-time proof finality, judge replay briefing, expected rejection text, safe replay action, and distinct dispute boundary without clipping or horizontal overflow.

The sandbox can verify the visible responsive state, server-rendered status/alert markup, and shared focus-visible control classes. It cannot dispatch a literal `Tab` event into the managed Preview session; that browser-control interaction remains externally pending and is not represented as performed here.
