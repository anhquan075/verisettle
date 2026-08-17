# VeriSettle — BUIDL CTC Fall 2026 Readiness Assessment

**Assessment date:** 16 August 2026.  
**Verdict:** **Submitted and technically on track.** VeriSettle meets the core product and technical direction of the Fall event, including its Attestcoin Protocol focus, Creditcoin deployment, and testnet requirement. Hacker registration, public repository review access, and the user-approved RWA submission are complete; the BUIDL is now under organizer review. The team remains responsible for the truthfulness of its originality attestation.

> **Recommended positioning:** submit VeriSettle primarily as an **RWA** project: an evidence-first cross-chain purchase-order settlement rail. It also has credible DeFi adjacency, but RWA makes the buyer-acceptance-to-seller-payment use case clearest.

## Official Requirement Matrix

The official Fall site describes five tracks—DeFi, RWA, DePIN, Gaming, and AI—and requires every submission to use the **Attestcoin Protocol**. The RWA track specifically asks teams to bridge off-chain value and on-chain transparency on Creditcoin.[1] The DoraHacks submission guide requires source code, a demo video, project information, team information, and a testnet deployment; projects must also be original work created during the event and must not infringe third-party IP.[2]

| Official criterion | VeriSettle evidence | Status | Assessment |
|---|---|---:|---|
| Attestcoin Protocol usage | Creditcoin ASC verifies the configured Sepolia acceptance receipt before settlement; proof, emitter, party, terms, and replay checks are documented and publicly demonstrated. | **Met** | This is a security-critical integration, not a decorative SDK call. |
| Creditcoin deployment | CC3 settlement ASC, V2 successor, V3 governed escrow, and V3 multisig are deployed with public addresses and creation transactions. | **Met** | The public Protocol page and `/judge` route make this inspection straightforward. |
| Testnet deployment | Live production interface, public `/judge` evidence route, Creditcoin CC3 and Sepolia receipts, and a verified wallet/onboarding flow are live. | **Met** | The testnet requirement is demonstrably satisfied. |
| Relevant Fall track | Cross-chain purchase-order escrow converts an off-chain delivery acceptance into transparent on-chain settlement. | **Met** | Strongest fit is **RWA**; describe DeFi as a secondary settlement primitive, not the primary sector. |
| Original work during hackathon | Project repository and development history exist. | **Team attestation required** | The team must truthfully attest that the submitted work satisfies the event’s originality period. |
| Repository with README | Public repository at `anhquan075/verisettle`, with documentation and deployment inventory. | **Ready** | Reviewers can inspect the source and documentation directly. |
| Prototype demo video URL | Public native Full HD interaction-led walkthrough: <https://files.manuscdn.com/user_upload_by_module/session_file/119889830/KogIzpIAXyJnCsjH.mp4>. Subtitle track: <https://files.manuscdn.com/user_upload_by_module/session_file/119889830/FNhOQLsGMsKPovCo.srt>. | **Ready** | Native 1920 × 1080 MP4 with actual public-route clicks replayed through a restrained cursor and ripple, deliberate receipt/protocol/wallet guidance, opaque-white subtitles, and a synchronized subtitle track. It fills the complete 16:9 composition and intentionally stops before any wallet-provider, signature, or transaction action. |
| Deck or whitepaper PDF URL | Public evidence deck: <https://files.manuscdn.com/user_upload_by_module/session_file/119889830/oFbvQGsZNumWBoJA.pdf>. | **Ready** | Public PDF, strict-compiled, verified, and visually reviewed. |
| Hacker/team profile | Quan Nguyen is registered as a solo hacker with user-supplied profile information. | **Ready** | Personal profile information was entered only in the authenticated DoraHacks session. |
| Final submission on DoraHacks | VeriSettle was user-approved and submitted in the RWA track. | **Under organizer review** | The public evidence links, repository, and testnet materials were provided in the completed form. |

## Verified Technical and Judge Evidence

The project is stronger than a conventional “smart contract + interface” prototype because the core claim can be independently inspected.

| Evidence layer | Verified artifact | Why it matters to a Fall judge |
|---|---|---|
| Settlement lifecycle | CC3 funding receipt, Sepolia acceptance receipt, and CC3 Attestcoin release receipt | Shows a complete cross-chain lifecycle instead of static interface states. |
| Integrity controls | Corrupted-proof rejection and on-chain `QueryAlreadyProcessed` replay defense | Shows that the protocol boundary is enforced under negative conditions. |
| Contract integrity | V2 policy manifest and V3 public deployment evidence | Lets a reviewer distinguish deployed, policy-pinned contracts from unverified addresses. |
| Governance | Public V3 two-of-three multisig and governed escrow deployments | Differentiates VeriSettle from a single-owner escrow and answers the dispute-authority question. |
| Evaluator UX | Public `/judge` route, receipt links, public copy-link control, protocol reference, and wallet-free access | Reduces judge setup time while keeping wallet actions explicitly gated. |
| Reproducibility | Foundry invariants, Vitest coverage, TypeScript/build gates, deployment inventory, repository docs | Supports a technical due-diligence conversation beyond the demo. |

## Readiness Scorecard

| Dimension | Current rating | Basis |
|---|---:|---|
| Track fit and problem clarity | **Strong** | RWA settlement framing is concrete: buyer acceptance controls seller payment. |
| Attestcoin integration depth | **Strong** | Proof verification is the actual settlement condition and includes replay protection. |
| Creditcoin implementation | **Strong** | Real CC3 contracts and public testnet receipts exist. |
| Security and authority story | **Strong** | V3 separates normal proof-based release from 2-of-3 governed recovery. |
| Judge demonstration | **Strong** | The public evidence page exposes the full receipt-to-governance story without wallet setup. |
| Submission packaging | **Ready** | Public video, subtitle track, and evidence PDF are available; team profile and final form remain unfinished. |
| Operational risk | **Moderate, manageable** | Wallet and extension flows are real but extension-dependent; `/judge` is designed so judges can inspect core evidence without an extension. |

## Remaining Go/No-Go Items

The public sources currently show the DoraHacks submission deadline as **6 September 2026, 04:59** on the Fall tracks page, while the Creditcoin builder site shows **6 September 2026, 23:59 ET**.[1] Submit materially before the earlier displayed deadline rather than relying on a timezone interpretation.

| Priority | Required action | Owner | Why it gates submission |
|---:|---|---|---|
| 1 | Complete DoraHacks hacker registration and team-profile fields. | User | Required personal data cannot be inferred or fabricated. |
| 2 | Decide repository-review access: make the repository reviewable or provide an approved access mechanism. | User / team | A code link is required; judges must be able to review it. |
| 3 | Review the final project description and evidence URLs, then explicitly approve the final DoraHacks submission. | User | Submission must not be posted without explicit approval. |

## Bottom Line

**Yes—VeriSettle remains on track to be a competitive Fall 2026 submission.** Its core requirements are already met with unusually strong technical proof: deployed Creditcoin/Attestcoin contracts, an end-to-end public testnet trail, replay defense, and a governed recovery model. The public walkthrough, subtitle track, and evidence PDF are ready. The project is not yet administratively ready to submit: complete registration, confirm code-review access, and submit the prepared evidence narrative before the earlier 6 September displayed deadline.

## References

[1]: https://buidl.creditcoin.org/ "BUIDL CTC 2026 Fall — official Creditcoin builder site"
[2]: https://dorahacks.io/hackathon/buidl-ctc/submission-guide "BUIDL CTC submission guide"
[3]: https://dorahacks.io/hackathon/buidl-ctc-2026-fall/tracks "BUIDL CTC 2026 Fall tracks and timing"
[4]: https://github.com/anhquan075/verisettle/blob/main/docs/DEPLOYMENT_INVENTORY.md "VeriSettle deployment inventory"
