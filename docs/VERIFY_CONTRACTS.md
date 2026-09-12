# Verify deployed contracts

Compiler: solc `0.8.23`, optimizer `200` runs.

`foundry.toml` defaults to EVM `paris`. Live V1/V2 artifacts were compiled with **shanghai** (PUSH0). Live V3 governed escrow and the dispute multisig match **paris**. Use `--evm-version` accordingly. Linked ASC bytecode also needs `--libraries` for `EvmV1Decoder` at `0x1aC5b6B47EFe751681A206Fa8A5C305250017425` on CC3.

Canonical explorers:

- Ethereum Sepolia: https://sepolia.etherscan.io
- Creditcoin CC3 Testnet: https://creditcoin-testnet.blockscout.com

## Addresses and explorer status (2026-09-12)

| Network | Contract | Address | Explorer |
|---|---|---|---|
| Sepolia | VeriSettleSource V1 | `0x1aC5b6B47EFe751681A206Fa8A5C305250017425` | [Etherscan](https://sepolia.etherscan.io/address/0x1aC5b6B47EFe751681A206Fa8A5C305250017425) — **TODO: Etherscan verify** (key not in this environment) |
| Sepolia | VeriSettleSourceV2 | `0x56e6d3E213141AA8285D0b12504bDa5dA260aa18` | [Etherscan](https://sepolia.etherscan.io/address/0x56e6d3E213141AA8285D0b12504bDa5dA260aa18) — **TODO: Etherscan verify** (key not in this environment) |
| CC3 | VeriSettleEscrowASC V1 | `0xe3565A1A1B947f363ab433889522267cE3D4736F` | [Verified on Blockscout](https://creditcoin-testnet.blockscout.com/address/0xe3565A1A1B947f363ab433889522267cE3D4736F?tab=contract) |
| CC3 | VeriSettleEscrowASCV2 | `0x185c81ED5a757d1e290BaBa55F051f3cE791D641` | [Verified on Blockscout](https://creditcoin-testnet.blockscout.com/address/0x185c81ED5a757d1e290BaBa55F051f3cE791D641?tab=contract) |
| CC3 | VeriSettleDisputeMultisig | `0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849` | [Verified on Blockscout](https://creditcoin-testnet.blockscout.com/address/0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849?tab=contract) |
| CC3 | VeriSettleEscrowASCV2Governed | `0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7` | [Verified on Blockscout](https://creditcoin-testnet.blockscout.com/address/0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7?tab=contract) |

Constructor arguments come from the original deploy scripts (`scripts/deploy-testnet-contracts.mjs`, `scripts/deploy-v2-policy-contracts.mjs`, `scripts/deploy-governed-v2-successor.mjs`). Encode them with `cast abi-encode` before `--constructor-args`.

## Sepolia (Etherscan) — TODO if `ETHERSCAN_API_KEY` is missing

Do not invent a key. When one is available:

```bash
export ETHERSCAN_API_KEY=…

forge verify-contract \
  --chain-id 11155111 \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  --evm-version shanghai \
  --watch \
  0x1aC5b6B47EFe751681A206Fa8A5C305250017425 \
  contracts/VeriSettleSource.sol:VeriSettleSource

forge verify-contract \
  --chain-id 11155111 \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  --evm-version shanghai \
  --constructor-args $(cast abi-encode "constructor(bytes32,uint64)" \
    0xf951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f28976 \
    604800) \
  --watch \
  0x56e6d3E213141AA8285D0b12504bDa5dA260aa18 \
  contracts/VeriSettleSourceV2.sol:VeriSettleSourceV2
```

## Creditcoin CC3 (Blockscout)

API key is optional on this instance.

```bash
LIB=node_modules/@gluwa/usc-contracts/contracts/decoding/EvmV1Decoder.sol:EvmV1Decoder:0x1aC5b6B47EFe751681A206Fa8A5C305250017425

forge verify-contract \
  --chain-id 102031 \
  --verifier blockscout \
  --verifier-url https://creditcoin-testnet.blockscout.com/api/ \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  --evm-version shanghai \
  --flatten \
  --constructor-args $(cast abi-encode "constructor(address,uint64)" \
    0x1aC5b6B47EFe751681A206Fa8A5C305250017425 1) \
  --libraries "$LIB" \
  --watch \
  0xe3565A1A1B947f363ab433889522267cE3D4736F \
  contracts/VeriSettleEscrowASC.sol:VeriSettleEscrowASC

forge verify-contract \
  --chain-id 102031 \
  --verifier blockscout \
  --verifier-url https://creditcoin-testnet.blockscout.com/api/ \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  --evm-version shanghai \
  --flatten \
  --constructor-args $(cast abi-encode "constructor(address,uint64,bytes32,uint64,uint64)" \
    0x56e6d3E213141AA8285D0b12504bDa5dA260aa18 \
    1 \
    0xf951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f28976 \
    604800 \
    2592000) \
  --libraries "$LIB" \
  --watch \
  0x185c81ED5a757d1e290BaBa55F051f3cE791D641 \
  contracts/VeriSettleEscrowASCV2.sol:VeriSettleEscrowASCV2

forge verify-contract \
  --chain-id 102031 \
  --verifier blockscout \
  --verifier-url https://creditcoin-testnet.blockscout.com/api/ \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  --evm-version paris \
  --constructor-args $(cast abi-encode "constructor(address[],uint8)" \
    "[0xc7774720D1C14B9dA1c656b796a2a092D0b9D1c9,0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620,0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA]" \
    2) \
  --watch \
  0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849 \
  contracts/VeriSettleDisputeMultisig.sol:VeriSettleDisputeMultisig

forge verify-contract \
  --chain-id 102031 \
  --verifier blockscout \
  --verifier-url https://creditcoin-testnet.blockscout.com/api/ \
  --compiler-version 0.8.23 \
  --optimizer-runs 200 \
  --evm-version paris \
  --constructor-args $(cast abi-encode "constructor(address,uint64,bytes32,uint64,uint64,address)" \
    0x56e6d3E213141AA8285D0b12504bDa5dA260aa18 \
    1 \
    0xf951dbde764db8baaba8699e6befea65ee98a145f12892594b7eae6ae1f28976 \
    604800 \
    2592000 \
    0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849) \
  --libraries "$LIB" \
  --watch \
  0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7 \
  contracts/VeriSettleEscrowASCV2Governed.sol:VeriSettleEscrowASCV2Governed
```

## Helper

```bash
pnpm verify:contracts
```

Probes explorers, runs `forge verify-contract` for unverified CC3 contracts without a Blockscout key, and writes `contracts/deployments/verification-attempt.json`. Skips Sepolia when `ETHERSCAN_API_KEY` is missing and records the exact TODO command. Never commit `.env` or keys.
