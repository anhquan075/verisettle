# Wallet Authentication and Readiness API Reference

## Overview

The wallet features use tRPC procedures under `auth.wallet` and a browser-side `useWalletAccess` controller. They authenticate an EOA by verifying an ERC-191 personal-sign message; they do not submit a blockchain transaction. The API accepts only Creditcoin CC3 Testnet (`102031`) or Ethereum Sepolia (`11155111`) as wallet sign-in chain IDs.

> **Transport boundary:** Call the procedures through the existing typed tRPC client. Do not create custom REST wrappers or send a private key, seed phrase, raw transaction, or arbitrary user-selected `origin` to the authentication API.

## tRPC procedures

### `auth.wallet.requestNonce`

This public mutation creates a single-use, five-minute SIWE challenge for the EOA address and selected supported chain. The server derives the signed browser origin from the request; the caller cannot choose it in the input.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `address` | `0x`-prefixed 40-hex-character string | Yes | Normalized to EIP-55 checksum form before challenge storage. |
| `chainId` | integer | Yes | `102031` for Creditcoin CC3 Testnet or `11155111` for Sepolia. |

```ts
const challenge = await trpc.auth.wallet.requestNonce.mutate({
  address: "0x…",
  chainId: 102031,
});
// challenge: { nonce, message, expiresAt, address }
```

The returned `message` includes the domain, address, statement, URI, version, chain ID, nonce, issued time, and expiration time described by ERC-4361. [1]

### `auth.wallet.verify`

This public mutation verifies the EOA signature over the exact stored challenge, atomically consumes the nonce, links the address to a user, and sets a secure HTTP-only 24-hour session cookie.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `address` | `0x`-prefixed 40-hex-character string | Yes | Must equal the challenge address and recovered signer. |
| `nonce` | string, 16–96 characters | Yes | Must be unused and unexpired. |
| `signature` | `0x` plus 130 hex characters | Yes | EOA `personal_sign` signature over `challenge.message`. |

```ts
const signature = await provider.request({
  method: "personal_sign",
  params: [challenge.message, account],
});

const result = await trpc.auth.wallet.verify.mutate({
  address: account,
  nonce: challenge.nonce,
  signature,
});
// result: { user, address, linked }
```

| Error class | User-visible reason | Expected response |
|---|---|---|
| `BAD_REQUEST` | Unsupported chain, insecure/mismatched/unconfigured origin. | Use CC3/Sepolia and the canonical HTTPS host. |
| `UNAUTHORIZED` | Challenge unavailable/expired or signature mismatch. | Request a new challenge and sign it once. |
| `CONFLICT` | Challenge already used. | Treat as replay protection; request a new challenge. |
| `INTERNAL_SERVER_ERROR` | User session could not be created. | Retry only after service/database configuration is healthy. |

## `useWalletAccess` controller

`useWalletAccess()` is the browser-side controller used by the readiness panel. It is not a substitute for on-chain authorization.

| Returned property or method | Meaning |
|---|---|
| `hasExtension` / `extension` | Detects an injected EIP-1193 provider and labels Rabby or SubWallet when provider flags are available. |
| `address`, `chainId` | Current first connected account and active chain reported by the provider. |
| `connect()` | Calls `eth_requestAccounts` only after a user action. |
| `signIn()` | Requests a server challenge, calls `personal_sign`, verifies it through tRPC, and refreshes app identity. |
| `switchNetwork("creditcoin" \| "sepolia")` | Calls `wallet_switchEthereumChain`; on error `4902`, offers `wallet_addEthereumChain` using configured public testnet metadata. |
| `readiness.creditcoin` / `readiness.sepolia` | Boolean chain matches used to block the wrong-network action before the user opens a transaction confirmation. |
| `busy`, `error` | UI state for pending provider calls and user-actionable errors. |

## Action-to-network policy

The client readiness gate is a usability control. The deployed contracts remain authoritative for sender, escrow state, proof event binding, and replay policy.

| Action | Readiness requirement | Contract authority |
|---|---|---|
| `acceptSourceOrder` | Sepolia | Source contract records one acceptance per order ID. |
| `fundEscrow` | CC3 | Escrow records buyer, seller, terms, amount, and refund deadline. |
| `submitProof` / `replayProof` | CC3 | Native verification, event-emitter/policy matching, and query replay protection. |
| `refundEscrow` | CC3 | Stored buyer and elapsed refund deadline. |
| `raiseDispute` | CC3 | Stored buyer or seller. |

## Deployment configuration

Set `VERISETTLE_APP_ORIGIN` to the canonical HTTPS application origin in the production environment. When it is set, wallet challenge issuance rejects any request whose browser origin does not match it. The Vercel configuration and complete environment-variable map are documented in [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md).

## References

[1] [ERC-4361 — Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)

[2] [EIP-1193 — Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
