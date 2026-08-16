# VeriSettle Judge Proof Sequence

## Purpose

This is the concise, judge-first run of show derived from the prior BUIDL CTC winner analysis. It uses only **public-testnet evidence already produced by VeriSettle** and avoids claims of mainnet operation, physical-delivery verification, production adoption, or an external audit.

## Opening statement

> **A buyer funds exact terms on Creditcoin CC3. The buyer accepts delivery on Ethereum Sepolia. Attestcoin verifies that receipt and releases the seller’s escrow once—never twice.**

## Live route

| Stage | On-screen destination | Evidence to point out | Judge takeaway |
|---:|---|---|---|
| 1 | `/app#judge-route` | CC3 escrow funding receipt `0x6975…1d94` | Value is locked against identified commercial terms. |
| 2 | `/app#judge-route` | Sepolia `OrderAccepted` receipt `0x4b6c…1d18` | Delivery acceptance is a verifiable source-chain event. |
| 3 | `/app#judge-route` | CC3 Attestcoin release `0x0e8c…d6df` | The proof authorizes a one-time release on the destination chain. |
| 4 | `/protocol` | Deployed source emitter, active ASC, BlockProver precompile, and network configuration | The cross-chain verification path is concrete and inspectable. |
| 5 | Deal evidence export / governed route | Corrupted-proof rejection, exact replay error, and 2-of-3 dispute path | Failure handling and governance are designed into the settlement rail. |

## What to say when challenged

| Likely question | Evidence-grounded answer |
|---|---|
| “Is Attestcoin really core?” | The CC3 ASC refuses settlement unless the proof verifies the expected source receipt and bound terms. Without it, escrow cannot release. |
| “How do you prevent duplicate payment?” | The ASC records the verified query identifier. Reusing the proof returns the explicit `QueryAlreadyProcessed` protection. |
| “What happens in a dispute?” | The governed successor delegates dispute authority to a separate threshold multisig; a refund needs two of three approvals. |
| “Is this real?” | It is a public-testnet implementation. Open the three completed explorer receipts, deployment inventory, contract repository, and test suites. |
| “Does a receipt prove physical delivery?” | No. VeriSettle explicitly verifies chain-level acceptance semantics, not the physical-world claim itself. |

## Submission artifact checklist

| Artifact | Required state before final DoraHacks submit |
|---|---|
| Live prototype | Stable URL loads `#judge-route` and `/protocol` without sign-in. |
| GitHub | README identifies testnet scope, deployed contracts, and real receipts. |
| Demo video | Opens with the settlement statement and follows the route above. |
| Deck or whitepaper | Uses the same buyer → receipt → proof → release structure. |
| Attestcoin summary | Names the source event, terms binding, source constraints, and replay defense. |
| Personal fields | Supplied and approved by the team member in DoraHacks; never invented in source control. |
