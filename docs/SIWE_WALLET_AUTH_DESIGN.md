# SIWE Wallet Authentication and Readiness Design

## Identity model

VeriSettle keeps the existing OAuth/session account model and adds a wallet identity that can either be linked to the current account or create a wallet-native account. A wallet-native account uses a deterministic internal identifier of the form `wallet:<lowercase-address>`; no private key, seed phrase, signature, or wallet provider metadata is persisted. Deal ownership continues to use `buyerOpenId`, so existing records remain valid.

| Record | Purpose | Security boundary |
|---|---|---|
| `wallet_identities` | Links a normalized EVM address to a single VeriSettle user account | Address is unique; link cannot be silently reassigned. |
| `siwe_nonces` | Stores the exact server-issued sign-in message and short-lived nonce | A nonce expires quickly and can be consumed once only. |
| Existing app session | Uses the existing signed HTTP-only session format after signature verification | Wallet-authenticated and OAuth-authenticated users share the same protected-procedure boundary. |

## Verification sequence

The browser first detects an EIP-1193 wallet and requests a server nonce. The server stores a canonical message with the requested address, browser origin, chain ID, issuance time, and expiry. The wallet signs that exact message with `personal_sign`. The server verifies the recovered signer, atomically consumes the matching nonce, resolves or creates the linked user, and sets the existing secure session cookie. A reused, mismatched, expired, or malformed assertion fails before a session is created.

## Wallet readiness

The client reports four independently useful states: wallet unavailable, wallet detected, wallet connected, and wallet ready. A connected wallet is ready only when the expected testnet is selected. Creditcoin CC3 Testnet is required for funding, proof submission, refunds, disputes, and replay demonstrations. Ethereum Sepolia is required for buyer acceptance. The readiness control can request a standard chain switch and, when unavailable, offers the configured add-chain request; it never signs or broadcasts a transaction by itself.

## User-facing accuracy

The interface must distinguish **Sign in with wallet** from **Connect wallet for a transaction**. Signature sign-in establishes the protected VeriSettle session. Network readiness establishes whether the connected signer can perform a particular on-chain action. Neither state claims a transaction has been submitted or a physical-delivery condition has been proved.

## Validation record

The signed-out workspace was opened directly in a browser without an injected provider. It rendered the explicit **Wallet unavailable** state with Rabby and SubWallet installation destinations, a concise fallback sign-in action, and no wallet signature prompt. The released real-testnet deal was reviewed at desktop and 375px widths. Its wallet-ready surface appears before the action rail, renders extension-unavailable guidance without hiding the receipt timeline, and retains an accessible vertical stack on mobile.

The automated quality gate passes with **37 tests** across nine suites, strict TypeScript, and the production build. Coverage includes a real locally generated ECDSA wallet signature recovered from the exact SIWE message; the challenge’s address, origin, chain ID, nonce, issuance, expiry, non-transaction statement, deterministic account ID, consumed-nonce path, secure-cookie issuance, extension guidance, and per-chain gates are all asserted. A real browser extension signature and chain switch require the user’s Rabby/SubWallet session and are intentionally not simulated.
