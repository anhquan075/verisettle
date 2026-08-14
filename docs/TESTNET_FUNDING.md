# VeriSettle Testnet Funding Evidence

The dedicated VeriSettle testnet deployment wallet is `0xc7774720D1C14B9dA1c656b796a2a092D0b9D1c9`. It is a testnet-only EVM account; no private-key material is stored in this document.

| Network | Asset | Amount | Evidence | Verification |
|---|---:|---:|---|---|
| Ethereum Sepolia | ETH | 0.05 | Public RPC balance check | Confirmed as `0.050000000000000000 ETH` on 2026-08-13. |
| Creditcoin CC3 Testnet | CTC | 10,000 | [Subscan extrinsic `0xc528…b60e`](https://creditcoin3-testnet.subscan.io/extrinsic/0xc528a90ad304391397f098f0a392e4f516cdbf2cb4eca672edba09716917b60e) | Successful `Balances.Transfer_keep_alive` transfer at 2026-08-13 10:57 UTC. The destination was the exact EVM address above, represented in the extrinsic as `Address20`. |

The EVM Blockscout address page may index a Substrate balance transfer after a delay. The successful Subscan extrinsic is the authoritative immediate evidence that the 10,000 CTC allocation was sent to the intended AccountId20 / EVM address. A direct EVM-provider query subsequently confirmed a **spendable balance of 10,000.0 tCTC** for this exact address on CC3 Testnet.

## Two-Party Buyer/Seller Role Wallets

The buyer and seller keystores are testnet-only accounts used to demonstrate a role-separated purchase-order flow. No private-key material is recorded here.

| Role | Address | Sepolia ETH | CC3 tCTC | Evidence |
|---|---|---:|---:|---|
| Buyer | `0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620` | 0.01 | 1.00 | [Sepolia funding](https://sepolia.etherscan.io/tx/0xa0cb914cfe30239fdabf1563d08bec31a1499f9713d67a0adbd8efd07616ee73), [CC3 funding](https://creditcoin-testnet.blockscout.com/tx/0xe7b855ba971dd060d8c3cf7faad2e9af98b07554d8853ae375f20a4dd4c447da) |
| Seller | `0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA` | 0 | 0 | Intentionally unfunded; it is a settlement recipient only. |

The balances above were independently confirmed through the corresponding public EVM RPC providers immediately after the transfers. The raw testnet evidence is stored in `contracts/test-runs/buyer-wallet-funding.json`.

The seller account’s CC3 recipient readiness was independently verified with a **0.001 tCTC** transfer: [transaction `0xbb77…177f`](https://creditcoin-testnet.blockscout.com/tx/0xbb7707d82ed8ee1aa03a628fe0f9f037d02c99e02d665c4fddbb4cc5bbde177f). Its public balance changed from `0.0` to `0.001 tCTC`; the raw evidence is stored in `contracts/test-runs/seller-recipient-readiness.json`.

## User Draft Escrow Funding

The user-created order `2w8_iT1aNogY1b` was funded from the separate buyer role wallet through a sandbox-only signer harness. The harness used the same terms hash and deployed `fundEscrow` call as the browser wallet flow, then passed the receipt through VeriSettle’s existing `recordFunding` procedure. The deal was persisted as `funded` only after receipt verification succeeded.

| Order | Buyer | Seller | Amount | CC3 receipt |
|---|---|---|---:|---|
| `2w8_iT1aNogY1b` | `0xd0Af…3620` | `0x36Ab…DcAA` | 0.01 tCTC | [0xba525e8b9c8e2416189826733a8fa26c457796beb1e10fec0a759e3acb6bf494](https://creditcoin-testnet.blockscout.com/tx/0xba525e8b9c8e2416189826733a8fa26c457796beb1e10fec0a759e3acb6bf494) |

The raw testnet evidence is stored in `contracts/test-runs/user-draft-escrow-funding.json`. The managed authenticated preview subsequently showed the `Funded` badge, the receipt link, and the append-only “Escrow funded on Creditcoin” event.
