# Primary-Source Validation Notes

| Subject | Verified finding | Primary source |
|---|---|---|
| Creditcoin CC3 Testnet | EVM chain ID is `102031`; HTTP RPC is `https://rpc.cc3-testnet.creditcoin.network`; Blockscout is the EVM explorer. | [Creditcoin Endpoints](https://docs.creditcoin.org/smart-contract-guides/creditcoin-endpoints.md) |
| EVM account funding | Sending CTC to an EVM `Address20` / associated Substrate account makes it available to the EVM account without a separate withdrawal. | [Substrate & EVM Accounts](https://docs.creditcoin.org/wallets/advanced/substrate-and-evm-accounts.md) |
| Testnet faucet | The Creditcoin Discord `token-faucet` channel accepts an EVM address with `/faucet address:...`. | [Using Testnet Faucet](https://docs.creditcoin.org/wallets/using-testnet-faucet.md) |
| Attestcoin testnet support | CC3 Testnet provides the proof generator, BlockProver precompile, SDK, and official examples required for the proof flow. | [Creditcoin Testnet](https://docs.creditcoin.org/environments/testnet.md) |
| Proof model | The official example waits until the source block is attested, requests a proof using `@gluwa/usc-sdk`, then submits its chain key, header, transaction bytes, merkle proof, and continuity proof to the ASC. | [Official bridge examples](https://github.com/gluwa/usc-testnet-bridge-examples) |

The implementation in `contracts/` uses these documented interfaces and validates real testnet evidence in `contracts/test-runs/`. The no-mock product boundary is defined in `REAL_TESTNET_ARCHITECTURE.md`.
