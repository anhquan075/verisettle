# VeriSettle E2E Capture Evidence

The sandbox-browser walkthrough uses only the dedicated testnet-only signer’s already recorded public transactions. It does not claim browser wallet approvals that the sandbox cannot display.

| Step | Public transaction | Browser capture result | Evidence use |
|---|---|---|---|
| Sepolia source acceptance | [`0x4b6c…1d18`](https://sepolia.etherscan.io/tx/0x4b6c2c2645cea40926839e15b63c61e90d6539053a4cce3d3e68ce2f92de1d18) | Etherscan rendered a `Success` transaction, sender, trusted source contract, and testnet label in the sandbox browser. | Use as the real source-event proof scene. |
| CC3 escrow funding | [`0x6975…1d94`](https://creditcoin-testnet.blockscout.com/tx/0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94) | Blockscout returned a blank sandbox-rendered page despite the public URL and recorded inventory evidence. | Use a text evidence card with the direct public link rather than claiming a rendered explorer capture. |

The remaining evidence is linked in [`DEPLOYMENT_INVENTORY.md`](DEPLOYMENT_INVENTORY.md), including the real proof-submission/release transaction and invalid-proof rejection transaction.
