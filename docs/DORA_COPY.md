# DoraHacks paste-ready copy

Canonical product URL: https://verisettle.vercel.app  
Judge evidence (no wallet): https://verisettle.vercel.app/judge  
Repository: https://github.com/anhquan075/verisettle

Attestcoin verifies the **acceptance receipt**, **NOT** physical delivery.

Do not list `verisettle-testnet.vercel.app`. That preview hostname is retired.

---

## Project Description

VeriSettle is receipt-bound cross-chain escrow for BUIDL CTC Fall 2026. A buyer funds exact purchase-order terms in native tCTC on Creditcoin CC3 Testnet. The seller is released only after the buyer accepts on Ethereum Sepolia and Attestcoin verifies that `OrderAccepted` / `OrderAcceptedV2` receipt through the BlockProver precompile (`0xFD2`) `verifyAndEmit`.

The deployed Attestcoin Smart Contract checks the expected source event, buyer, seller, order key, and immutable terms hash. It records the verified query identifier before settlement, so the same proof cannot release twice (`QueryAlreadyProcessed`).

**Attestcoin verifies the acceptance receipt, NOT physical delivery.** VeriSettle is testnet-only. It does not custody real customer funds, confirm goods in transit, or operate as a production settlement service.

What is live and reviewable:

- Real Sepolia source contracts and CC3 escrow ASCs, including V2 policy-pinned routing and a V3 2-of-3 governed successor.
- A completed live two-wallet V1 fund → accept → release lifecycle (buyer `0xABe59F75…` ≠ seller `0x26321500…`) plus the original self-deal Attestcoin run.
- Public `/judge` evidence with explorer links, replay protection, and governed-recovery explanation.
- ChainInfo (`0xFD3`) attestation-readiness checks before proof submit, and an optional thin relayer that can only submit proofs.
- Optional carrier `DeliveryConfirmed` and silence-timeout reclaim policies, covered by Foundry tests. Live V1/V2 buyer-accept routes stay unchanged.

Launch: https://verisettle.vercel.app  
Judge: https://verisettle.vercel.app/judge

---

## Attestcoin Integration Summary

VeriSettle uses `@gluwa/usc-sdk` `ProofBuilder` and `@gluwa/usc-contracts` `EvmV1Decoder` against Creditcoin CC3 Testnet.

1. **Source event.** Buyer calls `acceptOrder` on the pinned Sepolia source (`OrderAccepted` or `OrderAcceptedV2`).
2. **Attestation clock.** The server and optional worker read ChainInfo at `0xFD3` (`PrecompileChainInfoProvider`) and wait until the source height is attested. `chainKey` is resolved from ChainInfo when available; on-chain ASC immutables stay pinned.
3. **Proof.** `ProofBuilder.getProof(txHash)` talks to `https://prover.cc3-testnet.creditcoin.network/`.
4. **Verify and emit.** Anyone — buyer wallet or permissionless relayer — calls `submitAcceptanceProof`, which invokes BlockProver `verifyAndEmit` at `0xFD2`.
5. **ASC policy.** The escrow decodes the receipt, requires the trusted emitter, matching parties and terms, and burns the query id.
6. **Release once.** Native tCTC is sent to the recorded seller. Replays revert `QueryAlreadyProcessed`.

A relayer cannot steal escrow. It can only submit a proof the ASC already accepts. Manual submit remains available.
