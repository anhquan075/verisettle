# VeriSettle public evidence

**Testnet only.** Attestcoin verifies the acceptance receipt, **NOT** physical delivery.  
Canonical URLs: https://verisettle.vercel.app · https://verisettle.vercel.app/judge

This document replaces earlier PDF-style writeups. It is not prepared by a third-party writing agent.

## Two-wallet V1 (featured, live)

Buyer `0xABe59F7557214907c9C8Ce1D5Ac25f302B7523A3`  
Seller `0x26321500F14eE013cBD9580120040014343C6AD5`  
Order `0xf0a16e834330693f346da92251a5b6abee36c0c9923c820f03f54419b7bdd0e5` · 0.1 tCTC  
ASC `0xe3565A1A1B947f363ab433889522267cE3D4736F` (unchanged live V1)

| Step | Network | Transaction |
|---|---|---|
| Fund | Creditcoin CC3 | https://creditcoin-testnet.blockscout.com/tx/0x804d1c2675a2ae747947961685b910db8276b1643df42bd9a299c5fdabbef372 |
| Accept | Ethereum Sepolia | https://sepolia.etherscan.io/tx/0x71970aa7dfd99754ceb2b4ce73b6a874072325f57c9af7aed9bdf24b1b31b46a |
| Release | Creditcoin CC3 | https://creditcoin-testnet.blockscout.com/tx/0x100f44bf75709e2395645cb6e348c101dde5f3c6cafde21c50bd5fb89a7a8a97 |

JSON: `contracts/test-runs/two-wallet-f0a16e83.json`. Final status `Released`. Seller received ≈ 0.1 tCTC. Replay rejection: `QueryAlreadyProcessed`. Buyer ≠ seller (non-self-deal).

## Self-deal V1 (secondary)

Same-wallet historical Attestcoin path. Useful as the original `0xFD2` release, not as a two-party demo.

| Step | Transaction |
|---|---|
| Fund | https://creditcoin-testnet.blockscout.com/tx/0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94 |
| Accept | https://sepolia.etherscan.io/tx/0x4b6c2c2645cea40926839e15b63c61e90d6539053a4cce3d3e68ce2f92de1d18 |
| Release | https://creditcoin-testnet.blockscout.com/tx/0x0e8c31dc7d8d42066e4285d2362547a5f2cbcd1ca53a2a1662234d657b3dd6df |

JSON: `contracts/test-runs/real-proof-f4376c97.json`.

## Two-wallet V2 EscrowReleasedV2 (live)

Buyer `0xABe59F7557214907c9C8Ce1D5Ac25f302B7523A3`  
Seller `0x26321500F14eE013cBD9580120040014343C6AD5`  
Order `0x38e0f2e26eb88f024c2ee087fb129e84ec2f9d2d280ec556e61200f4a990d582` · 0.1 tCTC  
Policy `0xf951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f28976`  
Source `0x56e6d3E213141AA8285D0b12504bDa5dA260aa18` · ASC `0x185c81ED5a757d1e290BaBa55F051f3cE791D641` (unchanged live V2)

| Step | Network | Transaction |
|---|---|---|
| Fund | Creditcoin CC3 | https://creditcoin-testnet.blockscout.com/tx/0xe104db9bb173c702662af216b58b7eaad93e1e6dacb2c582bb496533f753c512 |
| Accept | Ethereum Sepolia | https://sepolia.etherscan.io/tx/0x771d35f76ca3dba527c649f065ff63f84e6dc1f2eec80b26c320a15440ffb381 |
| Release | Creditcoin CC3 | https://creditcoin-testnet.blockscout.com/tx/0xd3b47603f9948352199f5532a3967fff0875e2daf6c8eb2f4e46a5e4f33cda62 |

JSON: `contracts/test-runs/v2-two-wallet-38e0f2e2.json`. Final status `Released` (`EscrowReleasedV2`). Seller 10000.1 → 10000.2 tCTC. Replay rejection: `QueryAlreadyProcessed`. Buyer ≠ seller.

## V3 governed recovery

2-of-3 multisig `0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849`  
Governed escrow `0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7`  
See `contracts/test-runs/governed-dispute-*.json`.

## Boundary

Release checks receipt success, trusted emitter, parties, terms, and one-time query use. Physical delivery, custody of real funds, and production SLA are outside this protocol.
