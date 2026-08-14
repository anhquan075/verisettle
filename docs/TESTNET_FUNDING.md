# VeriSettle Testnet Funding Evidence

The dedicated VeriSettle testnet deployment wallet is `0xc7774720D1C14B9dA1c656b796a2a092D0b9D1c9`. It is a testnet-only EVM account; no private-key material is stored in this document.

| Network | Asset | Amount | Evidence | Verification |
|---|---:|---:|---|---|
| Ethereum Sepolia | ETH | 0.05 | Public RPC balance check | Confirmed as `0.050000000000000000 ETH` on 2026-08-13. |
| Creditcoin CC3 Testnet | CTC | 10,000 | [Subscan extrinsic `0xc528…b60e`](https://creditcoin3-testnet.subscan.io/extrinsic/0xc528a90ad304391397f098f0a392e4f516cdbf2cb4eca672edba09716917b60e) | Successful `Balances.Transfer_keep_alive` transfer at 2026-08-13 10:57 UTC. The destination was the exact EVM address above, represented in the extrinsic as `Address20`. |

The EVM Blockscout address page may index a Substrate balance transfer after a delay. The successful Subscan extrinsic is the authoritative immediate evidence that the 10,000 CTC allocation was sent to the intended AccountId20 / EVM address. A direct EVM-provider query subsequently confirmed a **spendable balance of 10,000.0 tCTC** for this exact address on CC3 Testnet.
