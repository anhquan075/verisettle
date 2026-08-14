# VeriSettle Domain and Trust Model

## Product Boundary

VeriSettle is a **testnet demonstration** of cross-chain purchase-order escrow. It proves that a successful, policy-bound source transaction on Ethereum Sepolia can be cryptographically verified through the Attestcoin Protocol before a Creditcoin settlement action is permitted. It does not claim to verify physical delivery, custody real funds, perform KYC, or provide legal trade-finance services.

## Deal Lifecycle

| Stored value | Required display label | Meaning | Allowed next values |
|---|---|---|---|
| `draft` | Draft | Purchase-order terms have been created but no escrow has been funded. | `funded`, `refunded`, `disputed` |
| `funded` | Funded | Test escrow is funded and the source-chain proof can be submitted. | `proof_pending`, `refunded`, `disputed` |
| `proof_pending` | ProofPending | A unique candidate source transaction is awaiting simulated verification. | `released`, `funded`, `disputed` |
| `released` | Released | Settlement has been authorized after a successful proof. Terminal. | None |
| `refunded` | Refunded | Test escrow has been refunded. Terminal. | None |
| `disputed` | Disputed | The order needs manual resolution. Terminal for this prototype. | None |

## Mutable Deal Record and Immutable Evidence

The `deals` row holds the latest lifecycle state and the current proof/settlement identifiers. Every creation, transition, failure, and replay rejection also appends a `deal_events` row. `deal_events` is append-only at the application layer: no update or delete procedure exists, event sequence is monotonically increasing per deal, and every response returns events ordered by `sequence` ascending.

Each source-proof request is bound to the deal’s `orderId`, buyer identity, seller address, amount, currency, and a policy nonce. A source transaction can only be accepted once globally. The proof simulator returns the exact replay error **`Replay rejected: this Sepolia transaction has already been processed for settlement.`** when a judge reuses a processed source hash.

## Attestcoin Technical Reference

| Item | Verified reference |
|---|---|
| CC3 Testnet decoder contract | `0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f` |
| ChainInfo precompile | `0x0000000000000000000000000000000000000fd3` |
| BlockProver precompile | `0x0000000000000000000000000000000000000FD2` |
| SDK | `@gluwa/usc-sdk` |
| Testnet supported source chain | Ethereum Sepolia, `chainKey: 1` |
| Official docs | <https://docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-sdk-usc-sdk.md> |

In a production ASC, proof submission must synchronously call the BlockProver precompile, require verified inclusion, verify source receipt status is `0x1`, decode and validate the expected source contract/event/payload, then enforce replay protection before settlement logic executes. The web application simulates the status outcomes and displays those requirements; it does not misrepresent the simulation as a deployed ASC.
