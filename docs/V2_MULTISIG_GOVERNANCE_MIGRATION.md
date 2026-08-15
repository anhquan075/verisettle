# V2 Multisig Governance Migration

## Scope and immutability boundary

The deployed `VeriSettleEscrowASCV2` instance on Creditcoin CC3 remains a historical testnet contract. Its single-owner `resolveDispute` function is immutable and is **not** altered by this repository update. Existing V1 and V2 deals continue to resolve under their originally deployed policy and their evidence must not be reinterpreted.

`VeriSettleEscrowASCV2Governed` is the successor implementation. It removes `Ownable` and accepts dispute resolutions only from an immutable `VeriSettleDisputeMultisig` address. A fresh deployment manifest and policy hash are required before this successor is made actionable in the workspace.

## Verified CC3 testnet deployment

The governed successor was deployed on Creditcoin CC3 Testnet on 2026-08-15. It retains the verified V2 policy hash and Sepolia source binding, while its dispute path is pinned to a separate threshold governance contract.

| Component | Public address | Deployment transaction |
|---|---|---|
| 2-of-3 dispute multisig | `0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849` | [`0x5547…ddbe`](https://creditcoin-testnet.blockscout.com/tx/0x5547fbd93d802522bc8c28509299c19c2a9b7ceaecfebea0973bd4593a7dddbe) |
| Governed V2 escrow ASC | `0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7` | [`0xf7d9…4c43`](https://creditcoin-testnet.blockscout.com/tx/0xf7d9e76c14da6577e910cc5cc9d7e5902d57c71cdd03907ba67003ac55734c43) |

The public-RPC verifier checks 15 bindings: both chain IDs, source/multisig/escrow runtime hashes, policy hashes, multisig threshold and signer set, escrow source/window parameters, and the escrow’s immutable governance address. The deployment manifest is recorded at `contracts/deployments/v2-governed-policy-cc3-testnet.json`.

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

## Governance configuration

The deployed configuration uses a two-of-three threshold across the dedicated deployment, buyer, and seller testnet addresses. The manifest records public addresses only; no private key, seed phrase, or keystore data appears in source control or this document.
