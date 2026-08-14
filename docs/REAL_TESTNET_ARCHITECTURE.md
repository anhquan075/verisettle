# VeriSettle Real-Testnet Architecture

VeriSettle will no longer generate synthetic transaction hashes or determine proof outcomes in the application. The authoritative state transitions will originate from contracts and proof receipts on the required testnets.

| Layer | Network | Component | Authority |
|---|---|---|---|
| Source evidence | Ethereum Sepolia | `VeriSettleSource` | Emits `OrderAccepted` only when the order buyer accepts the specific terms hash and seller address. |
| Proof | Attestcoin Protocol | Proof Builder + BlockProver | Attests the source transaction and validates its inclusion on Creditcoin CC3 Testnet. |
| Settlement | Creditcoin CC3 Testnet | `VeriSettleEscrowASC` | Holds native tCTC escrow, decodes the attested receipt, validates the trusted emitter/event/order policy, rejects replay, and releases escrow. |
| Product state | VeriSettle database | Deals and append-only events | Mirrors observed on-chain transaction/proof metadata. It does not authoritatively decide settlement status. |

## Required Policy Checks

`VeriSettleEscrowASC` must require all of the following before release:

1. The BlockProver precompile verifies a valid inclusion proof for the submitted source transaction.
2. The decoded receipt has status `0x1`.
3. The receipt contains the `OrderAccepted(bytes32,address,address,bytes32)` event.
4. The event emitter equals the registered Sepolia `VeriSettleSource` contract.
5. The decoded indexed order ID, buyer, seller, and terms hash match a currently funded escrow.
6. The proof query identifier has not been processed previously.
7. Native tCTC transfers to the seller only after all prior checks succeed.

An invalid source receipt, a wrong emitter, incorrect event payload, mismatched terms, failed receipt, or a duplicated proof must revert. Each rejected transaction remains independently inspectable through the relevant testnet explorer.

## Worker Model

The proof worker is a user-triggered server operation rather than a background poller. The user provides an actual Sepolia transaction hash after the source acceptance is mined; the backend waits for the Attestcoin proof builder, submits the proof to the ASC, waits for the Creditcoin receipt, and persists the observed transaction metadata. This makes the flow compatible with request-scoped hosting and avoids a long-lived simulated worker.
