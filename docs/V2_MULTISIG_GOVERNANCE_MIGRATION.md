# V2 Multisig Governance Migration

## Scope and immutability boundary

The deployed `VeriSettleEscrowASCV2` instance on Creditcoin CC3 remains a historical testnet contract. Its single-owner `resolveDispute` function is immutable and is **not** altered by this repository update. Existing V1 and V2 deals continue to resolve under their originally deployed policy and their evidence must not be reinterpreted.

`VeriSettleEscrowASCV2Governed` is the successor implementation. It removes `Ownable` and accepts dispute resolutions only from an immutable `VeriSettleDisputeMultisig` address. A fresh deployment manifest and policy hash are required before this successor is made actionable in the workspace.

## Threshold multisig model

The governance constructor receives a unique public-address signer set and a threshold. A resolution action commits to the following tuple before the final signer executes it:

| Bound field | Purpose |
|---|---|
| Domain separator | Prevents cross-feature action interpretation. |
| Chain ID and multisig address | Prevents cross-chain and cross-governance replay. |
| Escrow address and order ID | Prevents routing a decision to a different contract or deal. |
| Release/refund outcome | Prevents changing the funds recipient after approvals begin. |
| Strict nonce | Prevents replay after a completed resolution. |

Each unique signer may approve once. The threshold approval atomically calls `executeMultisigDisputeResolution`; an unsuccessful downstream call reverts the approval transaction, leaving no partially executed governance state.

## Testnet deployment prerequisites

Before deployment, provide the final threshold and public signer addresses. For the recommended two-of-three setup, the deployment process will record three public addresses, deploy `VeriSettleDisputeMultisig`, deploy the governed escrow with that immutable governance address, calculate the new policy hash, and publish a new public-RPC code-hash manifest. No private key appears in source control or this document.
