# V2 Settlement Policy Schema

## Status boundary

The currently deployed Sepolia source contract and Creditcoin CC3 ASC enforce the **V1** `termsHash` policy. The V2 workspace feature creates **policy drafts** only. A V2 draft is immutable application evidence and is deliberately blocked from V1 funding, source acceptance, proof submission, refund, dispute, and settlement actions until a separately deployed V2 source contract and ASC publish the matching policy hash.

> A V2 draft hash is not an on-chain authorization. It is the exact policy proposal that a future V2 deployment must pin before it may accept a settlement.

## Canonical policy hash

`policyHash` uses `keccak256(abi.encode(...))`, never packed encoding. The fixed-width, ordered tuple is:

| Position | Solidity type | Field | Purpose |
|---:|---|---|---|
| 1 | `bytes32` | `domainSeparator` | `keccak256("VERISETTLE_SETTLEMENT_POLICY")` prevents cross-protocol reuse. |
| 2 | `uint16` | `policyVersion` | `2` for the M2 schema. |
| 3 | `uint64` | `sourceChainKey` | Attestcoin source-chain identity. |
| 4 | `address` | `sourceContract` | Pinned expected V2 source emitter. |
| 5 | `bytes32` | `expectedEventSignature` | The V2 `OrderAccepted` event topic. |
| 6 | `uint16` | `termsSchemaVersion` | Canonical commercial-terms schema version. |
| 7 | `uint8` | `finalityMode` | `1` = attested receipt plus configured source confirmations. |
| 8 | `uint32` | `minimumSourceConfirmations` | Worker readiness threshold. |
| 9 | `uint32` | `acceptanceWindowSeconds` | Maximum acceptance window measured from draft creation in this preview. |
| 10 | `uint32` | `refundWindowSeconds` | Maximum escrow refund window used by the future V2 contract. |

The policy hash deliberately excludes a source code hash in draft mode. A source code hash is only valid after a concrete V2 address exists. The deployed V2 manifest will add and pin that code hash, resulting in a separate **deployed policy hash** rather than silently promoting a draft.

## Per-order V2 terms commitment

`termsCommitmentHash` binds a specific order to one policy draft:

```solidity
keccak256(abi.encode(
  TERMS_DOMAIN_SEPARATOR,
  policyHash,
  keccak256(bytes(orderId)),
  buyer,
  seller,
  keccak256(bytes(assetKind)),
  amountWei,
  acceptanceExpiresAt,
  refundWindowSeconds,
  keccak256(bytes(commercialDescription))
))
```

The workspace stores both hashes, the acceptance timestamp, confirmation threshold, and policy state. Existing V1 deals retain their original semantics and do not receive a synthetic V2 hash.

## Compatibility rules

| Deal policy state | On-chain behavior | Workspace behavior |
|---|---|---|
| `v1_live` | Uses the current deployed source ABI and ASC. | Existing funding/proof/release flow remains available. |
| `v2_draft` | Cannot call V1 contracts. | Policy fields and hashes are visible, exportable, and immutable; settlement controls explain deployment is pending. |
| `v2_deployed` | Reserved for post-M2 V2 source/ASC addresses. | Not created until contract addresses, policy event, source code hash, and verification adapter are deployed and tested. |

## Required M2 deployment check

Before enabling `v2_deployed`, the deployment script must derive the candidate policy hash from the checked-in manifest, deploy source and ASC, verify their addresses/event/code hash, read the on-chain pinned hash, and fail on any mismatch.
