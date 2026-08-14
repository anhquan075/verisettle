# VeriSettle Evidence Verification Matrix

**Recorded:** 14 August 2026 (GMT+7)

This matrix separates what has been independently verified in the current environment from actions that inherently require a user-controlled browser extension. It prevents the project from presenting server-side signing, authenticated preview rendering, or public receipts as evidence of a wallet-extension confirmation dialog.

| Capability or claim | Verified evidence | Current status | Boundary |
|---|---|---|---|
| Buyer/seller testnet wallets exist | Separately generated encrypted keystores; public addresses and balance evidence are recorded in [`TESTNET_FUNDING.md`](TESTNET_FUNDING.md). | Verified | No private-key material is in the frontend or repository. |
| Buyer funds escrow | Real CC3 `fundEscrow` receipt for order `2w8_iT1aNogY1b`; application decoded the receipt and persisted `Funded`. | Verified | The transaction was signed by the isolated sandbox buyer signer. |
| Buyer accepts on Sepolia | Real source transaction and `ProofPending` transition for the same order. | Verified | The transaction was signed by the isolated sandbox buyer signer. |
| Attestcoin releases seller settlement | Real proof submission, CC3 release receipt, seller settlement, and replay-guard error. | Verified | Public transaction links and immutable events are documented. |
| External funding receipt recovery | Two fresh Draft orders received real already-mined CC3 funding receipts; the shared receipt verifier confirmed the exact terms and rendered `Funded` with immutable event `#2`. | Verified procedure and rendered outcome | The sandbox invoked the same authenticated recovery procedure called by the UI. |
| Browser extension import of buyer/seller keystores | No connected My Browser, Anchor Browser, or Playwright session is available. | External pending | Cannot be claimed without a user-controlled extension session. |
| Browser wallet connection prompt and approval | No browser extension session is attached to the sandbox. | External pending | The app’s `Connect testnet wallet` control exists; approval UI remains outside this environment. |
| Literal click of receipt-recovery UI control | The underlying verifier and resulting UI state were tested, but no browser automation session can click user-owned UI. | External pending | The control is ready for manual verification with a real transaction hash. |
| Faucet bot acknowledgement message | Public on-chain balances and transfers are verified. | External pending | A private Discord/bot completion transcript was not collected. |

> **Disclosure:** The completed product evidence consists of real public-testnet contracts, receipts, decoded lifecycle transitions, authenticated managed-preview rendering, automated server tests, and a transparent sandbox signer boundary. Browser-extension actions are intentionally left as external pending rather than being simulated or overstated.
