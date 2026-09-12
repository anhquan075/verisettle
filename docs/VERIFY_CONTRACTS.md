# Verify deployed contracts

Compiler matches `foundry.toml`: solc `0.8.23`, optimizer on, `200` runs, EVM `paris`.

Canonical explorers:

- Ethereum Sepolia: https://sepolia.etherscan.io
- Creditcoin CC3 Testnet: https://creditcoin-testnet.blockscout.com

## Addresses

| Network | Contract | Address |
|---|---|---|
| Sepolia | VeriSettleSource V1 | `0x1aC5b6B47EFe751681A206Fa8A5C305250017425` |
| Sepolia | VeriSettleSourceV2 | `0x56e6d3E213141AA8285D0b12504bDa5dA260aa18` |
| CC3 | VeriSettleEscrowASC V1 | `0xe3565A1A1B947f363ab433889522267cE3D4736F` |
| CC3 | VeriSettleEscrowASCV2 | `0x185c81ED5a757d1e290BaBa55F051f3cE791D641` |
| CC3 | VeriSettleDisputeMultisig | `0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849` |
| CC3 | VeriSettleEscrowASCV2Governed | `0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7` |

Constructor arguments must match the original deploy scripts (`scripts/deploy-testnet-contracts.mjs`, `scripts/deploy-v2-policy-contracts.mjs`, `scripts/deploy-governed-v2-successor.mjs`). Encode them with `cast abi-encode` before `--constructor-args`.

## Sepolia (Etherscan)

```bash
export ETHERSCAN_API_KEY=…
forge verify-contract \
  --chain-id 11155111 \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  --watch \
  0x1aC5b6B47EFe751681A206Fa8A5C305250017425 \
  contracts/VeriSettleSource.sol:VeriSettleSource

forge verify-contract \
  --chain-id 11155111 \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  --constructor-args $(cast abi-encode "constructor(bytes32,uint64)" \
    0xf951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f28976 \
    604800) \
  0x56e6d3E213141AA8285D0b12504bDa5dA260aa18 \
  contracts/VeriSettleSourceV2.sol:VeriSettleSourceV2
```

## Creditcoin CC3 (Blockscout)

```bash
# API key optional on this Blockscout instance; pass BLOCKSCOUT_API_KEY if required.
forge verify-contract \
  --chain-id 102031 \
  --verifier blockscout \
  --verifier-url https://creditcoin-testnet.blockscout.com/api/ \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  0xe3565A1A1B947f363ab433889522267cE3D4736F \
  contracts/VeriSettleEscrowASC.sol:VeriSettleEscrowASC

forge verify-contract \
  --chain-id 102031 \
  --verifier blockscout \
  --verifier-url https://creditcoin-testnet.blockscout.com/api/ \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  0x185c81ED5a757d1e290BaBa55F051f3cE791D641 \
  contracts/VeriSettleEscrowASCV2.sol:VeriSettleEscrowASCV2

forge verify-contract \
  --chain-id 102031 \
  --verifier blockscout \
  --verifier-url https://creditcoin-testnet.blockscout.com/api/ \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849 \
  contracts/VeriSettleDisputeMultisig.sol:VeriSettleDisputeMultisig

forge verify-contract \
  --chain-id 102031 \
  --verifier blockscout \
  --verifier-url https://creditcoin-testnet.blockscout.com/api/ \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7 \
  contracts/VeriSettleEscrowASCV2Governed.sol:VeriSettleEscrowASCV2Governed
```

## Helper

```bash
pnpm verify:contracts
```

Writes `contracts/deployments/verification-attempt.json`. Skips networks whose API key is missing. Never commit `.env` or keys.

`foundry.toml` `[etherscan]` / `[rpc_endpoints]` entries are the same chain ids used above.
