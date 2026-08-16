# VeriSettle Product Walkthrough — Production Plan

**Format:** 16:9 landscape, 1:50 total target duration, English narration, synchronized English subtitles.  
**Audience:** BUIDL CTC Fall 2026 judges and technically literate cross-chain operators.  
**Truth standard:** Every product claim, receipt, contract address, and security boundary shown must map to the live frontend, public testnet explorer records, or deployed V3 authority. No invented transactions, balances, or outcomes may appear.

## Global Direction

| Element | Approved definition |
|---|---|
| Visual language | Cinematic product documentary. Real VeriSettle interface footage is primary; a minimal animated receipt rail, hash fragments, and authority lines appear only as explanatory overlays. |
| Palette | Near-black blue-green surfaces, proof cyan for verified receipt progress, and restrained fuchsia for governed recovery only. |
| Type and captions | Large, high-contrast sentence-case captions in Inter/Space Grotesk; monospaced receipt IDs used sparingly. Captions never obscure key UI controls. |
| Narrator | **Sadaltager**, natural English (US), calm knowledgeable voice, quiet confidence, conversational pace, light pauses between proof boundaries. |
| TTS prompt pattern | `Speak in natural American English with a calm, knowledgeable product-documentary tone and a warm, restrained confidence:` followed by each narration span. |
| Background music | Separate, low-key ambient electronic bed: 82 BPM, D minor, muted analog pulse, airy texture, soft sub-bass, no vocals. Music drops in density during receipt and security statements. |
| Sound design | Short tactile UI click only for navigation, low receipt chime only for verified release, and no exaggerated blockchain effects. |

## Clip Plan

| Time | Purpose | Real frontend / evidence focus | Narration cue | Screen direction |
|---|---|---|---|---|
| 00:00–00:07 | Establish | Landing hero and route diagram | “VeriSettle is cross-chain escrow with one rule: proof first.” | Slow push across the landing proof rail; cyan route line resolves from source to settlement. |
| 00:07–00:15 | Develop | Buyer–seller route | “A buyer funds on Creditcoin. Acceptance happens on Sepolia.” | Clean handoff from the Buyer funds node to the Buyer accepts node. |
| 00:15–00:23 | Develop | Attestcoin verification | “Attestcoin verifies the receipt, terms, parties, and one-time proof.” | Zoom into the Verify node and a restrained overlay lists the four real checks. |
| 00:23–00:31 | Develop | Creditcoin settlement | “Only then can the CC3 escrow release the seller’s funds.” | The evidence rail reaches Settle; use the live receipt fragment, not a fabricated transaction. |
| 00:31–00:39 | Prove | Public Judge Evidence page | “Judges can inspect the entire path without connecting a wallet.” | Direct route into `/judge`, presenting the real receipt rail in a clean full-page frame. |
| 00:39–00:47 | Prove | R01–R03 public receipts | “Funding, acceptance, and release are three public testnet receipts.” | Progress through the three explorer-linked receipt cards, one deliberate beat each. |
| 00:47–00:55 | Prove | Replay boundary | “The same proof cannot release an escrow twice.” | Focus the replay boundary statement; a subtle one-time stamp locks in place. |
| 00:55–01:03 | Differentiate | V3 governed recovery | “If there is a dispute, one signer is not enough. Resolution needs two of three approvals.” | Cyan proof rail transitions to fuchsia authority line; show real multisig and governed ASC links. |
| 01:03–01:11 | Explain | Protocol reference | “The Protocol page separates normal proof-based release from governed recovery.” | Open progressive contract disclosure; the normal path and authority path remain visually distinct. |
| 01:11–01:19 | Demonstrate | App command bar | “The workspace stays focused: page context, one wallet action, and live testnet state.” | Pan across the cleaned command bar and proof-first desk. |
| 01:19–01:27 | Demonstrate | Wallet onboarding | “Connect a supported wallet, sign one session message, then verify both testnets.” | Walk through the three onboarding states; explicitly show the non-transactional boundary label. |
| 01:27–01:35 | Demonstrate | Receipt restoration | “Returning users recover their verified receipts before the wallet reconnects.” | Show the restored receipt evidence cards in the authenticated workspace. |
| 01:35–01:43 | Resolve | Judge link + evidence PDF | “The proof is public, readable, and ready for review.” | Copy the canonical Judge Evidence link, then briefly show the public evidence PDF cover. |
| 01:43–01:50 | Close | Landing closing frame | “VeriSettle: receipts move value. Promises do not.” | Return to the landing route diagram; proof cyan line settles and the wordmark holds. |

## Transition Requirements

Each product transition preserves the same dark material surface, cyan proof channel, and fuchsia authority channel. The receipt rail is always present either as the actual interface component or as a thin overlay; it does not pop in unexpectedly. Navigation moves along realistic UI focus trajectories—landing to Judge Evidence, Judge Evidence to Protocol, then Protocol to workspace—using brief dissolves or directional slides rather than generated scene changes.

## Reference Images Required Before Execution

| Reference | Used by | Requirement |
|---|---|---|
| `proof_rail_visual_anchor` | Opening, receipt, close clips | 16:9 abstract dark proof rail with cyan source–verify–settle line and restrained fuchsia recovery branch; no text or logos. |
| `ambient_authority_texture` | Governance and protocol clips | 16:9 dark architectural light texture, cyan and fuchsia boundary paths, no text or logos. |

## Music Arc

| Time | Mood | Arrangement |
|---|---|---|
| 00:00–00:31 | Focused, controlled anticipation | Soft analog pulse, airy pad, sparse percussion. |
| 00:31–00:55 | Verifiable confidence | Add a quiet rhythmic click and warm low pulse; keep narration clear. |
| 00:55–01:11 | Serious, governed restraint | Remove percussion; lower harmonic texture; introduce a muted fuchsia synth accent. |
| 01:11–01:35 | Clear operational momentum | Restore light pulse and a slightly brighter pad. |
| 01:35–01:50 | Resolved, credible close | Simplify to pad and soft resolved chord; no dramatic crescendo. |

## Subtitle Rules

Captions match narration exactly, appear in sentence case, use no more than two lines, and remain in the lower safe area. Receipt IDs and contract fragments may be shown in a small monospaced secondary label; narration captions remain human-readable.
