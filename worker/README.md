# VeriSettle offchain worker

Thin, optional relayer. It does **not** custody escrow and cannot choose the seller.

## What it does

1. Watch Ethereum Sepolia `OrderAccepted` (V1) and `OrderAcceptedV2` (V2).
2. Skip events whose CC3 escrow is not `Funded`.
3. Read Creditcoin ChainInfo (`0xFD3`) and `waitUntilHeightAttested`.
4. Build a proof with the existing `ProofBuilder`.
5. Call `submitAcceptanceProof` on the live ASC.

The ASC still checks source emitter, parties, terms, and replay. A compromised relayer can only submit a valid proof or fail. It cannot redirect tCTC.

Manual `prepareProof` + wallet submit remains the permissionless path.

## Run

```bash
RELAYER_PRIVATE_KEY=0x… pnpm worker:relayer
# or a single pass
RELAYER_PRIVATE_KEY=0x… node worker/relayer.mjs --once
# ChainInfo-only probe (no key)
node worker/relayer.mjs --dry-run
```

Optional: `SEPOLIA_RPC_URL`, `CC3_RPC_URL`, `POLL_INTERVAL_MS`, `LOOKBACK_BLOCKS`.

## Evidence

Successful submits write `contracts/test-runs/worker-relayer/<route>-<txprefix>.json`.
See `contracts/test-runs/worker-relayer/TEMPLATE.json` for the schema.
