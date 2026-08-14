# VeriSettle End-to-End Test and Recording Script

This script records a **real testnet** VeriSettle flow. It does not use seeded deals, generated transaction hashes, simulated proof outcomes, or mainnet funds. Record only after the imported testnet-only wallet is connected and the user has signed in.

## Recording Setup

Record the browser window only. Keep the wallet extension’s account list, recovery phrase, private key, keystore password, and any OS notifications outside the captured frame. The wallet address may be shown; it is public. Begin on the signed-in **Deal register** at desktop width, then optionally show the mobile layout after the core workflow completes.

| Segment | Target duration | What the viewer must see |
|---|---:|---|
| Product framing | 10–15 seconds | The command center, testnet rail, wallet connection control, and no seeded deals. |
| Draft creation | 20–30 seconds | A user-created order with the connected wallet as buyer and seller, native `tCTC`, amount `0.01`, and a clear description. |
| Escrow funding | 25–40 seconds | The wallet approval on Creditcoin CC3 Testnet, followed by the `EscrowFunded` receipt link in the immutable timeline. |
| Source acceptance | 25–40 seconds | The wallet approval on Ethereum Sepolia, followed by the verified `OrderAccepted` receipt link. |
| Attestcoin proof | 20–40 seconds | The status changes to `ProofPending`, the live Attestcoin proof action, and the eventual `EscrowReleased` receipt. Attestation latency should be edited down, not hidden by fabrication. |
| Security proof | 15–25 seconds | The `Attempt real proof replay` control and the exact replay-rejection message. |
| Evidence close | 10–15 seconds | The immutable timeline, deployed contract links, and final `Released` badge. |

## Live Test Procedure

1. Open the preview and sign in to the workspace.
2. Click **Connect wallet**. Confirm that the imported public testnet wallet is selected, then approve Creditcoin CC3 Testnet if the wallet prompts for a network switch.
3. Click **Create purchase order** and set both buyer and seller to the connected public address. Use `0.01` for the native `tCTC` amount and use `VeriSettle live Attestcoin verification` as the description.
4. Create the draft. Confirm that the new `orderId` appears in the register and no synthetic history exists before this point.
5. Open the deal and click **Fund real tCTC escrow**. Approve the real Creditcoin CC3 Testnet transaction. Confirm the funding receipt is shown in the timeline and the status becomes `Funded`.
6. In the Attestcoin policy section, click **Emit buyer acceptance on Sepolia**. Approve the Sepolia transaction. Confirm that the app validates the receipt and changes to `ProofPending`.
7. Wait until the Sepolia block is attested. Use the explicit **Submit real Attestcoin proof** action. If attestation is not ready, record the honest retry message and resume only when the proof builder returns data.
8. Approve the Creditcoin proof-submission transaction. Confirm the status becomes `Released`, and open the `EscrowReleased` transaction in the explorer.
9. Click **Attempt real proof replay**. Confirm that the ASC rejects the duplicate query and that the page displays exactly: `Replay rejected: this Sepolia transaction has already been processed for settlement.`

## Pass Criteria

| Control | Pass condition |
|---|---|
| Data integrity | The order is created during the recording by the signed-in account; no seeded records are used. |
| Funding | The deal records `Funded` only after a matching CC3 `EscrowFunded` event is decoded. |
| Source policy | The Sepolia transaction is accepted only when it contains the deployed source contract’s expected event and matching terms. |
| Proof depth | The proof uses the official Attestcoin builder and the deployed ASC’s BlockProver path. |
| Settlement | The UI records `Released` only after a matching `EscrowReleased` receipt. |
| Replay protection | A second submission of the accepted proof produces the exact rejection text above. |

## Evidence to Attach with the Video

Include the three explorer URLs in the video description or DoraHacks submission: the CC3 funding transaction, the Sepolia acceptance transaction, and the CC3 proof/settlement transaction. Link the deployed contract inventory in [`DEPLOYMENT_INVENTORY.md`](DEPLOYMENT_INVENTORY.md) and the technical integration explanation in [`REAL_TESTNET_ARCHITECTURE.md`](REAL_TESTNET_ARCHITECTURE.md).
