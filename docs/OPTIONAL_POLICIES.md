# Optional settlement policies

These contracts are **not** the live V1/V2/V3 default. Buyer-accept `submitAcceptanceProof` on the deployed ASCs stays the production testnet path.

## Carrier delivery signal (P2-A)

`VeriSettleCarrierSource` lets a **registered carrier** emit `DeliveryConfirmed`. `VeriSettleEscrowASCV2Optional.submitDeliveryProof` accepts that event from the pinned carrier contract after the same BlockProver `verifyAndEmit` path used for buyer acceptance.

Buyer `OrderAcceptedV2` still releases through `submitAcceptanceProof`. First valid proof wins. A relayer that only submits proofs cannot change the seller.

Disable the carrier path by deploying with `carrierContract = address(0)`.

## Silence / timeout (P2-B)

If no proof arrives before `acceptanceExpiresAt`, the buyer may call `refundIfAcceptanceSilent`. The function also requires ChainInfo (`0xFD3`) to report an attested source height at or above the height snapshotted at fund (`silenceAfterSourceHeight`). That is an attested-height clock, not a second prover.

The optional escrow’s `disputeGovernance` (V3-style 2-of-3) may call `executeMultisigTimeoutRefund` under the same silence rules. Ordinary `refundExpiredEscrow` (timestamp `refundAfter`) remains.

## Tests

`forge test --match-contract V2OptionalPolicyTest`
