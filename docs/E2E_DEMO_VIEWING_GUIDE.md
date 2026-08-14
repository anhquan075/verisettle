# VeriSettle Evidence Walkthrough Viewing Guide

The file `VeriSettle-real-testnet-evidence-walkthrough.mp4` is a **58-second, 1280 × 720 H.264 evidence walkthrough**. It combines real application captures with the actual public testnet receipts produced by the dedicated testnet-only signer. It does not portray a wallet extension approval that did not occur in the sandbox browser.

| Timecode | Scene | What to verify |
|---:|---|---|
| 00:00–00:07 | Product framing | The public landing page describes Attestcoin-governed Creditcoin escrow and its testnet-only boundary. |
| 00:07–00:14 | Deal command center | The command-center UI presents wallet connection, order creation, lifecycle metrics, and the proof rail. |
| 00:14–00:22 | Source acceptance | The real [Sepolia acceptance transaction](https://sepolia.etherscan.io/tx/0x4b6c2c2645cea40926839e15b63c61e90d6539053a4cce3d3e68ce2f92de1d18) is visibly marked successful by Etherscan. |
| 00:22–00:29 | CC3 funding | The video identifies the real [Creditcoin funding receipt](https://creditcoin-testnet.blockscout.com/tx/0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94). |
| 00:29–00:37 | Attestcoin release | The video identifies the real [CC3 proof and release receipt](https://creditcoin-testnet.blockscout.com/tx/0x0e8c31dc7d8d42066e4285d2362547a5f2cbcd1ca53a2a1662234d657b3dd6df). |
| 00:37–00:45 | Replay protection | The walkthrough explains that the already processed query was rejected by the deployed ASC. |
| 00:45–00:52 | Responsive UI | The mobile command center preserves the same real-testnet guidance. |
| 00:52–00:58 | Disclosure | The video states the capture boundary and directs viewers to the deployment inventory. |

> **Disclosure:** The application interface was captured in the sandbox browser. The testnet transactions were executed by the dedicated local testnet-only signer, and their public receipts are linked above. No wallet-approval interaction, private key, keystore password, seed phrase, or fabricated transaction is shown.

For the complete contract, receipt, and invalid-proof evidence, see [`DEPLOYMENT_INVENTORY.md`](DEPLOYMENT_INVENTORY.md). For the reproducible test procedure, see [`E2E_DEMO_SCRIPT.md`](E2E_DEMO_SCRIPT.md).
