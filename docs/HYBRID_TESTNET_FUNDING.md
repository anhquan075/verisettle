# Hybrid Testnet Funding Evidence

## Funding-wallet boundary

VeriSettle uses the dedicated **testnet-only** funding address `0x24ccA89a409dEe81c9be449E24f79F2433d08db3` for a small, wallet-linked hybrid drip. Its signing key is a sensitive server environment variable; it is not committed, rendered in the app, included in test fixtures, or exported in judge evidence.

## Verified initial reserves

| Network | Source | Verified result |
|---|---|---|
| Ethereum Sepolia | [Google Cloud faucet receipt](https://sepolia.etherscan.io/tx/0x41fbc76cc37e71c779dbea1fcc4b029e349905daee82fcf068f83e90b0662080) | Successful transfer of `0.05` Sepolia ETH to the dedicated funder on 2026-08-15. |
| Creditcoin CC3 Testnet | [Blockscout address API](https://creditcoin-testnet.blockscout.com/api/v2/addresses/0x24ccA89a409dEe81c9be449E24f79F2433d08db3) | Public API reported `10000` tCTC after the official Discord faucet request. |

## Official fallback paths

Creditcoin documents its CC3 faucet as the `token-faucet` Discord command `/faucet address:<EVM-address>`.[1] Google Cloud’s Sepolia faucet sends test ETH to a supplied wallet address and applies its own account/address rate controls.[2] These external paths remain available in the workspace when VeriSettle’s small reserve drip is unavailable, depleted, or previously claimed.

## Safety limits

The server permits at most one persisted claim per wallet address. Claims require the address to be linked through the existing wallet-signature authentication flow. Each request records actual CC3 and Sepolia transaction hashes; if only one transaction confirms, the record is `partial` and the interface must direct users to receipt evidence and official faucets rather than fabricate completion.

## References

[1]: https://docs.creditcoin.org/wallets/using-testnet-faucet "Creditcoin — Using Testnet Faucet"
[2]: https://cloud.google.com/application/web3/faucet/ethereum/sepolia "Google Cloud — Ethereum Sepolia Faucet"
