# VeriSettle Wallet Guide

## What the wallet does

VeriSettle uses a compatible EVM wallet for two distinct actions. **Sign in with wallet** proves control of an address to create a 24-hour app session. **Connect wallet for a deal** prepares that same or another connected account to sign a real public-testnet transaction. A sign-in message does not submit a transaction, spend funds, or reveal a private key.

> Keep your seed phrase and private key private. VeriSettle never asks for either. A legitimate wallet sign-in is a readable message that says it does not authorize a transaction.

| Step | What to do | What VeriSettle checks |
|---|---|---|
| 1. Install | Install Rabby or SubWallet, then reopen the workspace. | An EIP-1193 provider is injected into the browser. |
| 2. Connect | Select **Connect wallet** and approve account access in the extension. | The wallet returns an account and active chain. |
| 3. Sign in | Select **Sign in with wallet**, review the message, and sign it. | The app creates a five-minute challenge, verifies the EOA signature, consumes it once, and starts a 24-hour session. |
| 4. Get ready | Use the readiness panel before a deal action. | The wallet is on Creditcoin CC3 Testnet or Ethereum Sepolia, depending on the action. |
| 5. Sign action | Review the transaction in the wallet before approving it. | The network, contract call, sender, and on-chain contract policy determine whether it can execute. |

## Network readiness

The wallet panel is intentionally separate from the deal lifecycle. Connection proves only that the extension is available; readiness checks that the selected account is on the correct testnet before it is asked to sign.

| Deal action | Required network | Why |
|---|---|---|
| Buyer acceptance / `acceptOrder` | Ethereum Sepolia | Creates the canonical source-chain `OrderAccepted` receipt. |
| Escrow funding | Creditcoin CC3 Testnet | Deposits testnet tCTC into the escrow ASC. |
| Attestcoin proof submission | Creditcoin CC3 Testnet | Verifies the Sepolia receipt through the native verifier and releases matching escrow. |
| Refund, dispute, replay demonstration | Creditcoin CC3 Testnet | Operates on the deployed CC3 escrow state. |

If the panel says **Wallet unavailable**, install Rabby or SubWallet. If it says **Switch to CC3** or **Switch to Sepolia**, select that control and review the wallet’s network-switch request. The application can suggest the network, but the wallet remains the final signer and must show the request.

## Evidence sharing and discovery

On a loaded deal, **Export judge evidence** creates a portable Markdown bundle from the persisted order, chronological event sequence, public receipt links, deployment references, and replay-safety result. It excludes seed phrases, private keys, passwords, and extension screenshots. Use **Find deal** or `⌘K` / `Ctrl+K` in the workspace to search authenticated persisted orders by ID, description, party address, amount, currency, or status.

## Troubleshooting

| Message or state | Meaning | Safe next step |
|---|---|---|
| Wallet unavailable | No compatible extension was detected. | Install Rabby/SubWallet; never install an extension from an untrusted link. |
| Challenge unavailable or expired | The five-minute sign-in message was not verified in time or was already consumed. | Request a new sign-in message; do not reuse a prior signature. |
| Origin not enabled | The deployment host is not the configured wallet-sign-in origin. | For a managed deployment, set `VERISETTLE_APP_ORIGIN` to the canonical HTTPS application URL. |
| Wrong network | The connected chain cannot sign the selected action. | Use the readiness panel to switch to the required testnet. |
| Query already processed | The exact proof query was accepted previously. | Treat this as expected replay protection and review the immutable timeline. |

## Security notes

SIWE is an off-chain authentication standard in which the wallet signs a message containing the relying-party domain, URI, chain ID, nonce, and session timing. [1] The address is a public identifier; do not use it as a secret. The current implementation supports EOA signatures. Contract-wallet/EIP-1271 sign-in is not yet enabled.

## Reference

[1] [ERC-4361 — Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
