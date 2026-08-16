# BUIDL CTC Previous Winners: Competitive Analysis for VeriSettle

**Prepared:** 16 August 2026  
**Scope:** The completed predecessor, **BUIDL CTC Hackathon – BUIDL For The Real World** (submission period 1 February–8 March 2026), not unrelated Creditcoin community contests. DoraHacks lists 76 BUIDLs and 189 hackers, while Creditcoin described the inaugural event as a $15,000 program across DeFi, RWA, DePIN, and Gaming.[1] [2]

> **Bottom line.** VeriSettle is technically credible enough to compete above the prior winner benchmark because it pairs a narrowly defined real-world settlement problem with public, end-to-end testnet receipts, Attestcoin as the core release condition, policy pinning, replay rejection, and governed dispute resolution. It does **not** automatically win. The prior Grand Prize winner shows that a simple, socially legible user problem and polished product story can outrank raw protocol complexity; HashCredit shows judges value deep verification architecture and reproducible engineering; SnowBall shows that a broad, compelling ecosystem story can be persuasive. VeriSettle must demonstrate both its proof advantage and a fast, intuitive buyer–seller narrative.

## 1. Research method and evidence standard

The official DoraHacks winner-assignment API identifies exactly three overall winners: **CrediKye** (Grand Prize), **HashCredit** (2nd Prize), and **SnowBall** (3rd Prize).[3] Their public DoraHacks submissions, linked repositories, deployments, and demos were then reviewed. Statements below are tagged implicitly by evidence class: **verified** means supported by an official winner/project page, public repository, deployed site, or explorer receipt; **assessment** is a reasoned comparison, not a fact about judging.

| Project | Prize | Core proposition | Primary public evidence | Confidence in implementation evidence |
|---|---:|---|---|---|
| **CrediKye** | Grand Prize | On-chain ROSCA savings circles with reputation and game mechanics | DoraHacks project page and live web application | Medium |
| **HashCredit** | 2nd Prize | Bitcoin mining-payout evidence converted into revenue-based credit | DoraHacks page, GitHub repository, live demo, video | Medium–high |
| **SnowBall** | 3rd Prize | Full-stack Creditcoin DeFi suite: CDP, lending, DEX, vaults, USC yield, and AI agents | DoraHacks page, GitHub monorepo, live demo, video | Medium–high |
| **VeriSettle** | Current entrant | Attestcoin-gated cross-chain purchase-order escrow with policy-bound proof and governed disputes | Public GitHub, live testnet workspace, Explorer receipts, deployment inventory | High for documented V1 lifecycle; High for stated V2/V3 test evidence |

## 2. What the prior winners actually did

### 2.1 CrediKye — Grand Prize

CrediKye positioned a **familiar community-finance problem**—rotating savings circles—as a Creditcoin product. Its submission describes 3–10-member circles, contract-driven payout rotation, reputation penalties for missed deposits, ranks, XP, badges, referrals, and a Telegram Mini App distribution surface.[4] The project listed Next.js, wagmi, viem, Solidity/Foundry, EIP-1167 clones, and Grammy, alongside a visible hosted application.[4]

Its apparent winning strength was not maximal technical novelty. It was **immediate user comprehension**: judges can explain the problem, target user, recurring action, and engagement mechanism in one sentence. The product also converts a DeFi primitive into a community experience, giving the submission a memorable consumer hook.

The public evidence is comparatively thin. The official page does not link a repository, contract addresses, explorer transactions, or a demo video. Therefore, claims about payout automation, reputation, Telegram integration, and soulbound badges are best treated as submission claims rather than independently reproducible proof.[4]

| What judges likely rewarded | What VeriSettle should learn |
|---|---|
| A human problem understandable in seconds | Open the demo with “delivery accepted → seller is paid” rather than “Attestcoin ASC.” |
| Product personality and a clear user loop | Use the buyer, seller, and arbitrator roles visibly in the first 30 seconds. |
| Deliberate UX, not only contracts | Keep VeriSettle’s wallet launchpad and evidence timeline central in the submission video. |

### 2.2 HashCredit — 2nd Prize

HashCredit is the closest prior analogue to VeriSettle in **proof-led financial design**. Its DoraHacks submission frames Bitcoin mining-pool payouts as independently verifiable revenue evidence: a Bitcoin SPV proof is intended to update a borrower’s on-chain Creditcoin credit limit, with repayment withheld from subsequent payouts.[5] The submission publishes a Creditcoin testnet contract set and describes replay protection, Bitcoin-address ownership binding, header-chain proof-of-work checks, Merkle inclusion, output validation, and confirmation-depth checks.[5]

Its repository is unusually substantial for a hackathon project: Foundry contracts and tests, an SPV verifier, worker and API services, frontend, deployment configuration, threat-model material, and an explicit operator-mediated proof flow.[6] This is a strong benchmark for **architectural explanation and engineering artifacts**.

There is also an important diligence lesson. The DoraHacks page claims a Creditcoin testnet deployment, whereas the public repository README currently describes HashKey Chain Testnet as the active deployment. That does not negate the project’s prize or architecture, but it demonstrates why final submissions must make their chain, addresses, and receipts unambiguous.[5] [6]

| What judges likely rewarded | What VeriSettle should learn |
|---|---|
| Proof is directly tied to a financial decision | State that an Ethereum acceptance receipt is the **sole release condition** for CC3 escrow. |
| Serious repository depth and threat-awareness | Put Foundry invariant count, policy manifest checks, and error/replay evidence in the README and deck. |
| Clear technical decomposition | Show source event, proof verification, policy matching, escrow state transition, and governance as five visual stages. |
| Explicit testnet-vs-mainnet disclosure | Keep “public testnet only” and all contract/network labels visible everywhere. |

### 2.3 SnowBall — 3rd Prize

SnowBall pursued **ecosystem breadth**: CTC-collateralized sbUSD, CDP borrowing, isolated lending, a concentrated-liquidity DEX, yield vaults, USC bridge infrastructure, and an AI position-management agent.[7] Its official submission includes a repository, live demo, prototype video, deck, and two named team members.[7] The public monorepo includes frontend, backend, agent server, USC worker, shared package configuration, and a Solidity package; its README names Creditcoin Testnet chain ID 102031.[8]

The project’s strongest judge-facing attribute is a broad “make Creditcoin productive” narrative. It does not ask judges to value a single contract in isolation; it shows an ecosystem in which collateral, stablecoin issuance, liquidity, yield, bridging, and automated risk management reinforce one another.[7] [8]

That breadth creates the opposing risk: **demo dilution and verification burden**. Public evidence supports a rich prototype and substantial codebase, but the many claimed components increase the number of contracts, assumptions, and interactions a judge must trust. The submission itself is strongest when it selects one concrete AI-agent redemption-risk scenario rather than attempting to demonstrate every primitive.[8]

| What judges likely rewarded | What VeriSettle should learn |
|---|---|
| A strategic ecosystem narrative | Frame VeriSettle as settlement infrastructure that makes tokenized commerce and RWA financing safer, not as “only escrow.” |
| Multiple public artifacts: repo, demo, deck, video | Publish each required artifact with a stable URL before form submission. |
| A memorable scenario | Use one buyer–seller purchase order and one dispute path, rather than three policy versions in the opening. |
| Team and product credibility | Present a clear owner, implementation responsibility, and post-hackathon roadmap. |

## 3. VeriSettle versus the prior benchmark

The following assessment is deliberately **not a claimed judging score**. It rates public, reproducible evidence and the likely clarity of a live review on a five-point scale, where five means the current materials provide an unusually strong demonstrable advantage.

| Dimension | CrediKye | HashCredit | SnowBall | VeriSettle | Why VeriSettle is positioned this way |
|---|---:|---:|---:|---:|---|
| Human problem clarity | 5 | 4 | 3 | 4 | Purchase-order settlement is concrete, but must be narrated in user terms before protocol terms. |
| Attestcoin/verified cross-chain fit for Fall 2026 | 1 | 3 | 3 | **5** | Fall requires meaningful Attestcoin integration; VeriSettle makes verification the release gate, not a feature add-on.[9] |
| Reproducible on-chain proof | 2 | 4 | 3 | **5** | Public deployment inventory lists source, escrow, funding, acceptance, release, corrupted-proof rejection, and replay-defense evidence.[10] |
| Security and failure-mode evidence | 2 | 4 | 3 | **5** | Policy manifests, replay protection, expiry/refund invariants, and two-of-three governed dispute evidence create a coherent control story. |
| Product and UX polish | 5 | 4 | 4 | 4 | VeriSettle has a polished live workspace and guided wallet flow; its proof language must stay legible to non-technical judges. |
| Scope discipline | 4 | 4 | 2 | **5** | VeriSettle’s flow is intentionally bounded: terms → funding → proof → release/refund/dispute. |
| Strategic ecosystem narrative | 3 | 5 | 5 | 4 | VeriSettle should connect escrow to RWA trade finance and verified settlement, while avoiding unsupported market-size claims. |
| Submission completeness risk | 3 | 4 | 5 | 4 | Core technical evidence is strong; stable public deck and final video URLs must be confirmed before submission. |

### Assessment: can VeriSettle beat them?

**Yes, it has a credible path to first place**, particularly because the Fall 2026 rules elevate the depth of Attestcoin use from a theme to a core evaluation criterion.[9] CrediKye won with an excellent real-world product story, but it did not need to demonstrate Attestcoin. HashCredit is the highest technical benchmark: it proved that judges value a verification system linked to real finance. VeriSettle’s differentiator is stronger for the new rubric when it can show the verification result **actually releases a separately funded CC3 escrow** and cannot be replayed. SnowBall’s breadth is impressive, but its multi-product story creates more validation burden than VeriSettle’s deliberately focused settlement rail.

The decisive risk is **presentation, not a missing protocol idea**. A judge who sees only manifests, policy versions, and contract labels may perceive complexity. A judge who sees a buyer accept delivery on Sepolia, watches a CC3 proof authorize release, then opens the public receipts and replay-rejection evidence sees a complete and differentiated story within minutes.

## 4. Recommended submission positioning

### Positioning statement

> **VeriSettle is a proof-first cross-chain settlement rail for purchase orders: a seller receives CC3 escrow only when Attestcoin verifies the buyer’s Ethereum delivery-acceptance receipt against the order’s immutable terms.**

This sentence is more judge-friendly than leading with “ASC,” “decoder,” or “V2 policy manifest.” Those belong in the technical proof section immediately after the value proposition.

### Non-negotiable evidence sequence

| Priority | What a judge should see | Why it matters against prior winners |
|---:|---|---|
| 1 | A 20–30 second before/after: funded order, acceptance receipt, released escrow | Matches CrediKye’s clarity while proving a higher-stakes financial outcome. |
| 2 | Both explorer receipts plus the in-app receipt cards | Removes the public-evidence gap visible in CrediKye and resolves the chain-identity ambiguity seen in HashCredit’s materials. |
| 3 | One corrupted proof failure and one exact replay-protection error | Converts security from a claim to a memorable live control. |
| 4 | The V3 two-of-three dispute resolution rail and approval timeline | Differentiates VeriSettle from a simple two-party escrow and makes the governance story tangible. |
| 5 | Manifest gate and policy-aware routing only after the core lifecycle | Demonstrates engineering maturity without front-loading implementation jargon. |
| 6 | Public repo, README, deck/whitepaper, and video URLs verified from an incognito browser | Matches SnowBall’s submission-artifact completeness and prevents judge friction. |

### What not to do

Do not claim an audit, mainnet readiness, production commercial adoption, or wallet action that is not publicly evidenced. Do not lead with five variants of the protocol. Do not hide testnet status. Do not describe a starter faucet balance as liquidity, payment volume, or customer traction. The strongest competitive posture is **narrowly truthful and deeply provable**.

## 5. Submission-readiness verdict

VeriSettle is **technically ahead of the previous cohort on directly inspectable cross-chain settlement proof and adversarial failure evidence**, and it is especially well-aligned with Fall 2026’s explicit Attestcoin requirement. It is **not yet automatically ahead in public submission packaging** until the final deck/whitepaper URL and final demo-video URL are confirmed in the DoraHacks form. Treat the winning target as: *CrediKye’s simplicity + HashCredit’s verification rigor + SnowBall’s artifact completeness, with VeriSettle’s actual Attestcoin-gated release and governed dispute proof.*

## References

[1]: https://dorahacks.io/hackathon/buidl-ctc/buidl "BUIDL CTC Hackathon project index and participation record"

[2]: https://creditcoin.org/blog/buidl-ctc-hackathon/ "Creditcoin — Pre-Register for BUIDL CTC Hackathon"

[3]: https://dorahacks.io/api/v1/hub/hackathon-winner-assignments?hackathon=buidl-ctc "DoraHacks public winner-assignment endpoint"

[4]: https://dorahacks.io/buidl/40170 "CrediKye — official DoraHacks project submission"

[5]: https://dorahacks.io/buidl/40363 "HashCredit — official DoraHacks project submission"

[6]: https://github.com/inchyangv/hashcredit "HashCredit public repository"

[7]: https://dorahacks.io/buidl/39899 "SnowBall — official DoraHacks project submission"

[8]: https://github.com/hypurrquant/snowball "SnowBall public repository"

[9]: https://dorahacks.io/hackathon/buidl-ctc-2026-fall/detail "BUIDL CTC 2026 Fall requirements and Attestcoin integration criterion"

[10]: https://github.com/anhquan075/verisettle/blob/main/docs/DEPLOYMENT_INVENTORY.md "VeriSettle real-testnet deployment inventory"
