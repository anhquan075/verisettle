# Wallet Session Verification Boundary

**Verified on:** 14 August 2026 (GMT+7)

The managed project preview is authenticated to the workspace and can render user-created deal records. The sandbox signer has executed real public-testnet transactions and receipts are documented in [`TESTNET_FUNDING.md`](TESTNET_FUNDING.md). These are different verification scopes.

| Evidence scope | Verified | Not asserted |
|---|---|---|
| Sandbox signer | The testnet-only buyer and deployment keys produced real Sepolia and CC3 transactions, which the application verified and persisted. | A browser extension presented a wallet confirmation dialog. |
| Managed project preview | Authenticated deal pages, released states, receipt links, recovery states, desktop/mobile layouts, and route recovery surfaces rendered. | The preview was connected to a browser-extension wallet. |
| Personal browser session | Not available: the My Browser, Anchor Browser, and Playwright session connectors are disabled. | Buyer/seller keystores were visibly imported into Rabby/SubWallet or the buyer address was connected by extension to VeriSettle. |

The interface supports browser-wallet connection through the `Connect testnet wallet` control. A user-controlled extension test remains the appropriate final verification for the display of a wallet approval and imported account address. This document deliberately does not treat sandbox-signature or managed-preview data as proof of that separate event.
