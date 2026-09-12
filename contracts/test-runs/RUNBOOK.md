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

Featured live V1 run (buyer ≠ seller): `two-wallet-f0a16e83.json`.

| Step | Tx |
|---|---|
| Fund | `0x804d1c26…f372` |
| Accept | `0x71970aa7…b46a` (Sepolia 11689016) |
| Release | `0x100f44bf…8a97` (CC3 5475123) |

Buyer `0xABe59F75…523A3` · Seller `0x26321500…C6AD5`. The `/judge` page features this pack first.

Earlier sandbox two-wallet receipts remain in `user-draft-*.json` / `two-wallet-v1-2w8_iT1a.json`.

## Worker

```bash
node worker/relayer.mjs --dry-run
RELAYER_PRIVATE_KEY=0x… pnpm worker:relayer
```

See `worker/README.md`.
