# VeriSettle

**VeriSettle** is a dark, mobile-first purchase-order escrow application for the BUIDL CTC 2026 Fall hackathon. A successful, policy-bound Ethereum Sepolia event is attested by Attestcoin and releases a real native-tCTC testnet escrow on Creditcoin CC3 Testnet.

> **Testnet boundary:** Every wallet transaction, source event, proof, and settlement uses public testnet infrastructure. VeriSettle does not custody real assets or verify physical delivery. It does deploy and use a real Attestcoin Smart Contract, and its application records only receipts that match the protected on-chain purchase-order terms.

## Product Flow

| Step | Product action | Security control |
|---|---|---|
| 1 | Buyer creates a purchase order. | A nanoid `orderId` and unique proof-policy nonce bind the terms. |
| 2 | Buyer funds native tCTC escrow from a CC3 Testnet wallet. | The API records `funded` only after decoding a matching `EscrowFunded` receipt from the deployed ASC. |
| 3 | Buyer emits the exact `OrderAccepted` event from the deployed Sepolia source contract. | The receipt’s order key, buyer, seller, and terms hash must match the persisted deal. |
| 4 | The product requests a proof from the Attestcoin proof builder once the source block is attested. | The ASC’s BlockProver precompile verifies source inclusion and receipt success. |
| 5 | Buyer submits that proof to the deployed Creditcoin ASC. | The ASC decodes the trusted event and releases escrow in the same real testnet transaction. |
| 6 | A repeated proof is submitted again. | The ASC rejects the query with `QueryAlreadyProcessed`; the UI renders the exact replay-protection reason. |

## Architecture

```text
React landing page + authenticated dashboard + injected EVM wallet
	                │ tRPC receipt verification
Express lifecycle API ───── MySQL/TiDB deal + append-only event records
	                │ Attestcoin SDK
Ethereum Sepolia source event → proof builder → CC3 Testnet BlockProver → deployed escrow ASC
```

The implementation separates mutable `deals` state from chronological `deal_events`. There is no update or delete procedure for events; every lifecycle action appends the next per-deal sequence number. Authorization ensures only the order creator can view or mutate that order.

## Status Contract

| Stored value | UI label | Description |
|---|---|---|
| `draft` | Draft | Terms are recorded but test escrow is not funded. |
| `funded` | Funded | Escrow is funded and accepts a source transaction. |
| `proof_pending` | ProofPending | A source transaction awaits verification. |
| `released` | Released | Verified proof authorized settlement. |
| `refunded` | Refunded | Escrow was returned before verified release. |
| `disputed` | Disputed | The deal moved to manual review. |

## Local Development

```bash
pnpm install
pnpm drizzle-kit generate
pnpm test
pnpm check
pnpm dev
```

The schema migration files are in `drizzle/`. The application uses the managed database injected by the project environment.

## Quality Gate

```bash
pnpm test   # lifecycle, invalid proof, replay, unauthenticated, and cross-user access tests
pnpm check  # strict TypeScript validation
pnpm build  # production build
```

## Active Attestcoin Integration

The deployed ASC accepts the proof package from the Attestcoin SDK, calls the CC3 Testnet BlockProver precompile synchronously, requires a successful source receipt, decodes the expected source contract/event data, validates the order key, buyer, seller, and terms hash, applies replay protection, and only then releases native tCTC escrow.

| Reference | Value |
|---|---|
| Decoder contract | `0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f` |
| ChainInfo precompile | `0x0000000000000000000000000000000000000fd3` |
| BlockProver precompile | `0x0000000000000000000000000000000000000FD2` |
| SDK | `@gluwa/usc-sdk` |
| Testnet source chain | Ethereum Sepolia, `chainKey: 1` |

The references above come from the current [Attestcoin Protocol Chains and Environments documentation](https://docs.creditcoin.org/attestcoin-protocol/attestcoin-protocol-chains-environments.md) and the [Attestcoin SDK documentation](https://docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-sdk-usc-sdk.md). Consult the official [Attestcoin Smart Contract guidance](https://docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-smart-contracts.md) before a testnet deployment.

The complete contract-address and transaction inventory is in [`docs/DEPLOYMENT_INVENTORY.md`](docs/DEPLOYMENT_INVENTORY.md), and the testnet funding evidence is in [`docs/TESTNET_FUNDING.md`](docs/TESTNET_FUNDING.md).
