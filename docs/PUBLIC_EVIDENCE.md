# VeriSettle public evidence

**Testnet only.** Attestcoin verifies the acceptance receipt, **NOT** physical delivery.  
Canonical URLs: https://verisettle.vercel.app · https://verisettle.vercel.app/judge

This document replaces earlier PDF-style writeups. It is not prepared by a third-party writing agent.

## Two-wallet V1 (featured)

Buyer `0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620`  
Seller `0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA`  
Order `2w8_iT1aNogY1b` · ASC `0xe3565A1A1B947f363ab433889522267cE3D4736F`

| Step | Network | Transaction |
|---|---|---|
| Fund | Creditcoin CC3 | https://creditcoin-testnet.blockscout.com/tx/0xba525e8b9c8e2416189826733a8fa26c457796beb1e10fec0a759e3acb6bf494 |
| Accept | Ethereum Sepolia | https://sepolia.etherscan.io/tx/0x46d774edf8321e68020559751a03929176484749776ca419927277da9736ca7a |
| Release | Creditcoin CC3 | https://creditcoin-testnet.blockscout.com/tx/0x03e3d0f78a720eb6042e72a00f62f54fe35bbfebc6dbed9f5ad591f801f54f3c |

JSON: `contracts/test-runs/user-draft-escrow-funding.json`, `user-draft-source-acceptance.json`, `user-draft-attestcoin-release.json`. Replay rejection: `QueryAlreadyProcessed`.

## Self-deal V1 (secondary)

Same-wallet historical Attestcoin path. Useful as the original `0xFD2` release, not as a two-party demo.

| Step | Transaction |
|---|---|
| Fund | https://creditcoin-testnet.blockscout.com/tx/0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94 |
| Accept | https://sepolia.etherscan.io/tx/0x4b6c2c2645cea40926839e15b63c61e90d6539053a4cce3d3e68ce2f92de1d18 |
| Release | https://creditcoin-testnet.blockscout.com/tx/0x0e8c31dc7d8d42066e4285d2362547a5f2cbcd1ca53a2a1662234d657b3dd6df |

JSON: `contracts/test-runs/real-proof-f4376c97.json`.

## V2 EscrowReleasedV2

No committed live `EscrowReleasedV2` receipt exists yet. Produce one with:

```bash
BUYER_PRIVATE_KEY=0x… SELLER_PRIVATE_KEY=0x… pnpm evidence:v2
```

Templates: `contracts/test-runs/TEMPLATE-v2-lifecycle-*.json`.

## V3 governed recovery

2-of-3 multisig `0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849`  
Governed escrow `0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7`  
See `contracts/test-runs/governed-dispute-*.json`.

## Boundary

Release checks receipt success, trusted emitter, parties, terms, and one-time query use. Physical delivery, custody of real funds, and production SLA are outside this protocol.
