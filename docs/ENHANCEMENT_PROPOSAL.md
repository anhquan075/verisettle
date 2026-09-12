# VeriSettle enhancement proposal — BUIDL CTC Fall 2026

This pull request implements the scout-depth lift for [BUIDL 48000](https://dorahacks.io/buidl/48000). Hypothesis: reuse `ProofBuilder` + ASC `submitAcceptanceProof`, do not invent a second verification path.

## P0 — Must-ship

| ID | Outcome |
|---|---|
| **P0-D** | Copy leads with “Attestcoin verifies the acceptance receipt, NOT physical delivery.” Canonical URL is https://verisettle.vercel.app (and `/judge`). `docs/DORA_COPY.md` is paste-ready. |
| **P0-A / P0-B** | `scripts/run-two-wallet-lifecycle.mjs` and `scripts/run-v2-lifecycle.mjs` produce schema-versioned JSON under `contracts/test-runs/`. Live two-wallet V1 evidence is committed as `two-wallet-f0a16e83.json` and featured on `/judge`. The self-deal run is secondary. V2 live `EscrowReleasedV2` still uses templates until keys run that path. |
| **P0-C** | `docs/VERIFY_CONTRACTS.md` and `scripts/verify-deployed-contracts.mjs` document / attempt forge verification for Sepolia sources and CC3 ASCs/multisig. |

## P1

| ID | Outcome |
|---|---|
| **P1-A** | `PrecompileChainInfoProvider` (`0xFD3`) is used for attestation readiness before proof submit. UI + tRPC surface waiting / attested / unavailable. |
| **P1-B** | `worker/relayer.mjs` watches Sepolia acceptances, waits on ChainInfo, builds a proof, submits on CC3. Relayer cannot steal escrow. Manual submit stays live. |
| **P1-C** | Unused Manus showcase (`AIChatBox`, `ComponentShowcase`) is quarantined. Public evidence markdown is regenerated without “Prepared by Manus AI.” |

## P2

| ID | Outcome |
|---|---|
| **P2-A** | Optional `VeriSettleCarrierSource` + `VeriSettleEscrowASCV2Optional` release on `DeliveryConfirmed` from a registered carrier, while buyer `OrderAcceptedV2` still works. Foundry tests included. Documented as optional policy; live V1/V2 routes unchanged. |
| **P2-B** | Buyer `refundIfAcceptanceSilent` and multisig `executeMultisigTimeoutRefund` use ChainInfo attested height as the source-chain clock after the acceptance deadline. Foundry tests included. Aligns with V3 multisig authority. |
| **P2-C** | `docs/CEIP_PO_PILOT.md` — purchase-order settlement one-pager. |

## What we did not invent

Proof construction is still `ProofBuilder`. On-chain verification is still `verifyAndEmit` + ASC receipt policy. ChainInfo is a readiness clock, not a second prover.
