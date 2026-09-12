# Evidence runbook

Attestcoin verifies the **acceptance receipt**, not physical delivery. All flows below are Creditcoin CC3 + Ethereum Sepolia **testnet only**.

## One-command live runs

Requires `BUYER_PRIVATE_KEY` and `SELLER_PRIVATE_KEY` for **different** addresses, plus public RPCs (overridable with `SEPOLIA_RPC_URL` / `CC3_RPC_URL`).

```bash
# V1 two-wallet fund → accept → proof → release
pnpm evidence:two-wallet

# Same path against the live V2 policy ASC
pnpm evidence:two-wallet:v2

# V2 EscrowReleasedV2 positive + PolicyMismatch + expired acceptance
pnpm evidence:v2
```

Each command writes `contracts/test-runs/*.json` with `schemaVersion: 1` fields: `funding`, `acceptance`, `release`, and explorer links.

## If keys are absent

The scripts exit `2` and leave filled templates:

- `TEMPLATE-two-wallet.json`
- `TEMPLATE-v2-lifecycle-positive.json`
- `TEMPLATE-v2-lifecycle-policy-mismatch.json`
- `TEMPLATE-v2-lifecycle-expired-acceptance.json`
- `worker-relayer/TEMPLATE.json`

Replace `TEMPLATE_*` placeholders after a live run. Do not commit private keys.

## Existing committed two-wallet evidence

V1 buyer ≠ seller is already recorded:

| Step | File | Tx |
|---|---|---|
| Fund | `user-draft-escrow-funding.json` | `0xba525e8b…f494` |
| Accept | `user-draft-source-acceptance.json` | `0x46d774ed…ca7a` |
| Release | `user-draft-attestcoin-release.json` | `0x03e3d0f7…4f3c` |

Buyer `0xd0Af9b88…3620` · Seller `0x36Ab1BBd…DcAA`. The `/judge` page features this pack first.

## Worker

```bash
node worker/relayer.mjs --dry-run
RELAYER_PRIVATE_KEY=0x… pnpm worker:relayer
```

See `worker/README.md`.
