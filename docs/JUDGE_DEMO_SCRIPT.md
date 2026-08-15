# VeriSettle Judge Demo — Production Script

## Recording standard

Record the actual production workspace and public explorers. Do not imply that a wallet is connected if the extension has not approved the session. Show live data, verified receipts, and the immutable evidence timeline; use the voiceover below with the companion `verisettle_judge_demo_en.srt` subtitle file.

| Segment | Target length | Screen evidence | Narration objective |
|---|---:|---|---|
| Opening | 0:00–0:18 | Public landing page | State the settlement problem and real testnet boundary. |
| Wallet-first route | 0:18–0:42 | `/app` launchpad | Show supported-wallet choice, SIWE boundary, CC3/Sepolia readiness, and no-key policy. |
| Real V1 lifecycle | 0:42–1:20 | Real released deal `2w8_iT1aNogY1b` and public receipts | Explain policy-bound funding, Sepolia acceptance, Attestcoin proof, and CC3 release. |
| V2 integrity gate | 1:20–1:48 | V2 creation/detail surfaces | Explain public-RPC manifest verification before wallet actions. |
| Multisig governance | 1:48–2:15 | Governed policy evidence and approvals tracker | Explain two-of-three dispute resolution and real two-signer refund evidence. |
| Replay proof | 2:15–2:35 | Judge replay walkthrough | Explain the one-time query guard and exact failure reason. |
| Closing | 2:35–2:48 | Protocol reference / evidence export | State judge review links and the testnet-only scope. |

## Voiceover direction

Use a clear, confident English narration with a neutral US accent and informative pacing. Suggested TTS prompt prefix:

> Speak in English with a clear, confident, evidence-led product-demo tone and natural pauses:

## Spoken script

VeriSettle is a cross-chain purchase-order escrow built for evidence, not promises. It holds native tCTC on Creditcoin CC3 Testnet and releases only after an Attestcoin-verified acceptance receipt from Ethereum Sepolia matches the order’s committed policy and terms.

This is the wallet-first testnet route. A user chooses a supported EVM wallet, signs a SIWE session, and checks both CC3 and Sepolia. Connection and sign-in never move funds. The workspace guides the next permitted action and never asks for a private key or recovery phrase.

Here is a completed two-party V1 testnet order. The buyer funded CC3 escrow. The buyer then emitted the expected acceptance event on Sepolia. VeriSettle requested an Attestcoin proof, and the Creditcoin ASC verified receipt inclusion, source success, event semantics, counterparties, the order key, and the immutable terms hash before releasing escrow. Each receipt and lifecycle event is preserved in chronological order.

For the successor policy, VeriSettle pins the source, escrow, code hashes, chain IDs, and policy hash in a public deployment manifest. The browser independently checks that manifest against public RPC before it enables a V2 wallet action.

Governed disputes replace single-owner authority with a real two-of-three multisig. This tracker shows the bound outcome, individual approvals, threshold progress, and execution state. The evidence includes a real testnet dispute, two independent approvals, and an on-chain buyer refund.

Finally, the replay walkthrough shows why the settlement cannot be executed twice. Once the verified query is consumed, the contract rejects another submission with the exact `QueryAlreadyProcessed` reason.

VeriSettle is testnet-only, but its evidence model is real: public contracts, public receipts, policy-pinned verification, governed dispute resolution, and a judge-ready export for independent review.
