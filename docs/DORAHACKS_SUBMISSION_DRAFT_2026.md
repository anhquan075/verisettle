# VeriSettle — DoraHacks Submission Draft

## Submission alignment

VeriSettle is prepared for the **BUIDL CTC 2026 Fall** event’s required Attestcoin Protocol integration, testnet deployment, technical documentation, repository, and prototype-demo fields. The event requires a meaningful functional Attestcoin integration, working code, testnet deployment, and the specified project and team information.[1]

> The public event page confirms the requirements. DoraHacks login, hacker registration, and any final submission must be completed only in the user’s authenticated session and only after the user has reviewed the final personal and project information.

| DoraHacks field | Prepared value |
|---|---|
| Project name | **VeriSettle** |
| Sector | **RWA / DeFi** |
| Short description | Cross-chain purchase-order escrow that releases Creditcoin CC3 testnet tCTC only after an Attestcoin-verified Ethereum Sepolia acceptance receipt matches immutable order terms. |
| Project logo | Use the existing transparent VeriSettle interlocking-mark PNG or SVG from the project brand assets. |
| GitHub repository | <https://github.com/anhquan075/verisettle> |
| Live prototype | <https://verisettle-testnet.vercel.app/app> |
| Public Judge Evidence | <https://verisettle-testnet.vercel.app/judge> |
| Technical documentation | <https://github.com/anhquan075/verisettle/blob/main/README.md> |
| Deployment evidence | <https://github.com/anhquan075/verisettle/blob/main/docs/DEPLOYMENT_INVENTORY.md> |
| Governance evidence | <https://github.com/anhquan075/verisettle/blob/main/docs/V2_MULTISIG_GOVERNANCE_MIGRATION.md> |
| Demo video | <https://files.manuscdn.com/user_upload_by_module/session_file/119889830/FUFyhIQFfvzmGeYG.mp4> |
| Demo subtitles | <https://files.manuscdn.com/user_upload_by_module/session_file/119889830/FNhOQLsGMsKPovCo.srt> |
| Deck / whitepaper PDF | <https://files.manuscdn.com/user_upload_by_module/session_file/119889830/oFbvQGsZNumWBoJA.pdf> |

## Project description

The current 1:50 demo is a **native 1920 × 1080 real-interface walkthrough**. It deliberately scrolls to the live receipt rail, proof boundary, V3 governance panel, and wallet route as each is narrated; thin video-only callouts identify the relevant component without fabricating a product state or hiding the underlying evidence.

**VeriSettle** is a testnet-only cross-chain purchase-order escrow for real-world settlement workflows. A buyer funds exact order terms in native tCTC on Creditcoin CC3. When that buyer accepts delivery on Ethereum Sepolia, VeriSettle uses the Attestcoin Protocol to verify the source receipt in a Creditcoin Attestcoin Smart Contract. The escrow releases to the seller only when the verified receipt proves the expected source event, buyer, seller, order key, and immutable terms hash. A repeated proof is rejected by the contract’s on-chain replay protection.

The project turns opaque cross-chain settlement into an evidence-first workflow. Its immutable timeline, public explorer receipts, and one-click judge evidence export make every release or refund auditable. The current workspace supports policy-pinned V2 routes, public-RPC deployment-manifest checks before V2 wallet actions, and a governed successor whose disputes execute only through a verified two-of-three multisig. VeriSettle also includes a wallet-first testnet onboarding path that recognizes supported EVM wallets, guides CC3/Sepolia readiness, and provides a strictly limited, auditable starter-funding route with official-faucet fallback.

## Recommended judge evidence sequence

> **Tell one settlement story before explaining the protocol.** A buyer funds terms on CC3, accepts delivery on Sepolia, and the seller receives the escrow only after Attestcoin verifies the receipt.

| Time | Show | Why it is persuasive |
|---:|---|---|
| 0:00–0:20 | Live workspace **Judge route** and the buyer → acceptance → seller path | Establishes the human and commercial outcome before contract vocabulary. |
| 0:20–0:45 | Completed CC3 funding, Sepolia acceptance, and CC3 release explorer links | Provides three publicly inspectable receipts, not a narrated claim. |
| 0:45–1:10 | Proof boundary: trusted emitter, party/terms binding, and one-time query use | Shows Attestcoin is the release condition, not a decorative integration. |
| 1:10–1:35 | Corrupted-proof rejection and exact `QueryAlreadyProcessed` replay defense | Turns security controls into a memorable observable result. |
| 1:35–1:55 | Judge route’s deployed V3 multisig and governed-ASC links, then the dispute timeline | Differentiates VeriSettle from simple two-party escrow with a public, inspectable authority boundary. |
| 1:55–2:10 | Repository, deployment inventory, tests, and submission links | Closes with reproducible engineering evidence and a bounded testnet claim. |

Use the stable workspace route: <https://verisettle-testnet.vercel.app/app#judge-route>. The page intentionally contains real public-testnet receipt links rather than an embedded third-party explorer frame, because explorer frame policies prevent reliable in-page rendering.

## Attestcoin Protocol integration summary

Attestcoin is the security-critical verification layer in VeriSettle. The application requests a proof for the specified Ethereum Sepolia acceptance receipt through the Attestcoin SDK. The deployed Creditcoin escrow ASC submits that package to the CC3 BlockProver precompile, requires proof of successful receipt inclusion, decodes the expected source event, and rejects any mismatch in source contract, event semantics, order key, counterparty addresses, or committed terms hash. The ASC records the verified query identifier before settlement, so a replay attempt fails with the contract’s exact `QueryAlreadyProcessed` protection rather than releasing funds twice.[2]

## Required team information

Complete these values directly in DoraHacks; do not invent or publish personal information in source control.

| Required field | Entry needed from team member |
|---|---|
| First and last name | User-supplied legal name |
| Email | User-supplied contact email |
| Short bio | User-approved two-to-three sentence bio |
| Role | For example: Product, smart contracts, full-stack engineering |
| Country of residence | User-supplied |
| Country of citizenship | User-supplied |
| Telegram, X, LinkedIn, resume | Optional user-approved links |

## Submission claims checklist

Use only the following substantiated claims. Do not describe simulated balances, fabricated approvals, or an audit that did not occur.

| Claim | Supporting evidence |
|---|---|
| Real V1 Sepolia-to-CC3 lifecycle | `docs/DEPLOYMENT_INVENTORY.md` and immutable deal timeline evidence |
| V2 policy-pinned deployment | `shared/v2PolicyManifest.ts` and public-RPC verifier script |
| V2 governed successor | `docs/V2_MULTISIG_GOVERNANCE_MIGRATION.md` and governed manifest verifier |
| Two-signer governed dispute refund | `contracts/test-runs/governed-dispute-resolution.json` and migration record |
| Replay protection | Solidity tests, Foundry invariants, and judge replay walkthrough |
| Wallet-first onboarding | Live workspace plus `server/hybridFundingOnboarding.test.ts` |

## References

[1]: https://dorahacks.io/hackathon/buidl-ctc-2026-fall/detail "BUIDL CTC 2026 Fall — Rules, requirements, and submission fields"
[2]: https://docs.creditcoin.org/creditcoin-usc "Creditcoin Attestcoin Protocol documentation"
