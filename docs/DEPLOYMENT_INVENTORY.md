# VeriSettle Real-Testnet Deployment Inventory

The following contracts were deployed with the dedicated **testnet-only** signer. Every item below has a public address and creation transaction; no private-key material is included.

| Role | Network | Contract address | Creation transaction |
|---|---|---|---|
| Policy-bound source event emitter | Ethereum Sepolia | [`0x1aC5…7425`](https://sepolia.etherscan.io/address/0x1aC5b6B47EFe751681A206Fa8A5C305250017425) | [`0x2fa8…747e`](https://sepolia.etherscan.io/tx/0x2fa878c8334fe3cd7e589f0e3f301b607f6f4e5e8be043571aa9ceedd903747e) |
| `EvmV1Decoder` linked library | Creditcoin CC3 Testnet | [`0x1aC5…7425`](https://creditcoin-testnet.blockscout.com/address/0x1aC5b6B47EFe751681A206Fa8A5C305250017425) | [`0x384d…46cb`](https://creditcoin-testnet.blockscout.com/tx/0x384d02a3393aff5bf3b1e6fc5b45b8c555f4238e29ddd9585ccbea2f06ee46cb) |
| Active Attestcoin settlement escrow ASC | Creditcoin CC3 Testnet | [`0xe356…736F`](https://creditcoin-testnet.blockscout.com/address/0xe3565A1A1B947f363ab433889522267cE3D4736F) | [`0x8bed…dc1a`](https://creditcoin-testnet.blockscout.com/tx/0x8bed11356577c9af97c452c9dab9a4cf9257d6863901aefc17c66baad73fdc1a) |

The active ASC uses Ethereum Sepolia `chainKey: 1`, the CC3 Testnet BlockProver precompile at `0x0000000000000000000000000000000000000FD2`, and the deployed source emitter as its only accepted event source.

## Live Validation Evidence

| Assertion | Testnet evidence |
|---|---|
| Native escrow was funded | [`0x6975…1d94`](https://creditcoin-testnet.blockscout.com/tx/0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94) funded 0.1 tCTC for the real test order. |
| Source acceptance event was emitted | [`0x4b6c…1d18`](https://sepolia.etherscan.io/tx/0x4b6c2c2645cea40926839e15b63c61e90d6539053a4cce3d3e68ce2f92de1d18) emitted `OrderAccepted` from the trusted source contract. |
| Attestcoin proof released escrow | [`0x0e8c…d6df`](https://creditcoin-testnet.blockscout.com/tx/0x0e8c31dc7d8d42066e4285d2362547a5f2cbcd1ca53a2a1662234d657b3dd6df) submitted a real proof and set the escrow to `Released`. |
| Corrupted proof was rejected | [`0x2182…10b3`](https://creditcoin-testnet.blockscout.com/tx/0x2182352296d1dece0a522460654aca509a50189e847c49ecccbf095d570110b3) reverted with receipt status `0` after one proof byte was mutated. |
| Replaying the valid proof was rejected | The active ASC returned its `QueryAlreadyProcessed` custom error when the exact same verified proof was invoked again. |
