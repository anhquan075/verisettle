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

## Two-Party Acceptance and Release

The same user draft completed its real cross-chain flow with **distinct** testnet buyer and seller addresses. The buyer emitted the matching source event on Ethereum Sepolia; after the official Attestcoin service returned an indexed proof, the buyer submitted it to the CC3 ASC. The escrow released to the seller only after the ASC decoded and accepted that proof.

| Stage | Public testnet evidence | Result |
|---|---|---|
| Buyer source acceptance | [Sepolia `0x46d7…ca7a`](https://sepolia.etherscan.io/tx/0x46d774edf8321e68020559751a03929176484749776ca419927277da9736ca7a) | Matching `OrderAccepted` for order `2w8_iT1aNogY1b`; the app persisted `proof_pending`. |
| Attestcoin proof and release | [CC3 `0x03e3…4f3c`](https://creditcoin-testnet.blockscout.com/tx/0x03e3d0f78a720eb6042e72a00f62f54fe35bbfebc6dbed9f5ad591f801f54f3c) | Valid proof released the `0.01 tCTC` escrow to seller `0x36Ab…DcAA`; app persisted `released`. |
| Replay guard | Same proof payload, CC3 `eth_call` | Rejected with the deployed ASC’s `QueryAlreadyProcessed` error. |

The initial polling responses (`404` / `422`) were returned before the source receipt was attested; the successful proof was returned without creating a duplicate acceptance or settlement transaction. Raw evidence is stored in `contracts/test-runs/user-draft-source-acceptance.json` and `contracts/test-runs/user-draft-attestcoin-release.json`.

## External Receipt Recovery Test

A separate user-owned two-party order, `qSC-w_9OKx5Sga`, was created expressly to test recovery from a real CC3 transaction that had already mined before the application recorded it. The buyer funded `0.001 tCTC` through the deployed ASC; its draft stayed `draft` until the receipt was attached through the verified `recordFunding` recovery path.

| Step | Evidence | Verified result |
|---|---|---|
| External CC3 funding | [CC3 `0x73ee…176a`](https://creditcoin-testnet.blockscout.com/tx/0x73eede180c8e667792214ee255ccc5c85aaa7504badf649af625b6202aef176a) | The real `EscrowFunded` receipt was mined for the fresh order’s exact buyer, seller, terms hash, and 0.001 tCTC amount. |
| Recovery attachment | `recordFunding(orderId, receiptHash)` | The receipt verifier decoded the external event, moved the persisted draft to `funded`, and appended immutable event sequence `2`: `Escrow funded on Creditcoin`. |

The unaffiliated transaction and recovery artifacts are stored in `contracts/test-runs/recovery-test-unattached-funding.json` and `contracts/test-runs/recovery-test-attached-receipt.json`. No synthetic hash or seeded purchase order was used.

## Browser Recovery-Control Evidence Draft

The final browser-oriented recovery draft, `iwqGQkR0fRxMhD`, began as `draft` with a deliberately unattached, real CC3 funding receipt. The project’s authenticated recovery procedure then verified [CC3 `0x2328…4463`](https://creditcoin-testnet.blockscout.com/tx/0x2328b75ba79a77c2158397f40f6128a3d6c643927c40c1cd4103db88acec4463) and rendered the result in the deal view: `Funded` badge, receipt link, completed Fund lifecycle stage, and immutable `Escrow funded on Creditcoin` event `#2`.

The visible **Verify existing receipt** control calls this same `recordFunding` procedure. In the sandbox, the control’s backend operation was invoked through the authenticated test harness because direct wallet/browser input automation is unavailable; the resulting persisted and rendered state was independently inspected in the managed preview. The fully real receipt and artifacts are saved as `contracts/test-runs/browser-recovery-unattached-funding.json` and `contracts/test-runs/browser-recovery-attached-receipt.json`.
