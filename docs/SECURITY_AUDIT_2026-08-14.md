# VeriSettle Source-Based Security Assessment

**Assessment date:** 14 August 2026  
**Assessor:** VeriSettle engineering review
**Scope:** `VeriSettleEscrowASC.sol`, `VeriSettleSource.sol`, `VerifierInterface.sol`, SIWE challenge/session flow, wallet-extension handling, and pre-action network readiness.  
**Assessment type:** source review plus targeted automated regression tests; **not** a third-party formal audit, formal verification, bytecode-equivalence review, or production security certification.

## Executive assessment

The reviewed Creditcoin escrow follows the principal safety invariant: a funded CC3 escrow releases only after the native verifier accepts a source-chain receipt and the decoded `OrderAccepted` event matches the stored order ID, buyer, seller, and terms hash. The code changes state before native-value transfers and applies `nonReentrant` to value-moving release, refund, and owner-resolution paths. This matches the checks-effects-interactions and reentrancy guidance in Solidity and OpenZeppelin documentation. [1] [2]

The reviewed SIWE flow now issues a five-minute, one-time, server-stored challenge; verifies the recovered EOA signer; atomically consumes the challenge; binds the signed origin from the incoming request; and creates a separate 24-hour authenticated session. The message includes the required sign-in domain, address, URI, version, chain ID, nonce, issuance time, and expiration time used by the SIWE standard. [3]

No **Critical** or **High** source-level exploit was identified in the reviewed paths. Two **Medium** product-security risks remain before a value-bearing mainnet deployment: the single owner can resolve disputes unilaterally, and recipient contracts that reject native transfers can delay settlement. The deployed contracts remain explicitly testnet-only.

| Severity | Open findings | Remediated during assessment | Status |
|---|---:|---:|---|
| Critical | 0 | 0 | No source-level critical issue identified. |
| High | 0 | 0 | No source-level high issue identified. |
| Medium | 2 | 0 | Requires governance and payout-policy decisions before mainnet. |
| Low | 3 | 3 | SIWE origin, nonce, and session/cookie hardening were implemented and tested. |
| Informational | 3 | 0 | External-verifier, wallet-account-type, and deployment configuration boundaries. |

## Method and limits

The review traced contract state transitions, authorization, proof decoding, replay handling, external calls, native-value transfers, and dispute authority. The SIWE review traced challenge construction, signer recovery, nonce storage/consumption, cookie issuance, origin handling, extension detection, and CC3/Sepolia gating. Targeted tests exercise an actual locally generated EOA signature and the security contracts around challenge construction, replay consumption, cookie lifetime, origin handling, and UI gates.

The assessment did **not** independently verify the deployed bytecode against source, fuzz the Creditcoin BlockProver precompile, test all malformed receipt encodings, formally prove the state machine, assess third-party wallet extensions, or test Vercel account configuration. Smart-contract security guidance recommends combining tests with static/dynamic analysis, formal methods where appropriate, and independent review; this report should be treated as one development-stage control rather than a release certificate. [4]

## Findings and remediation status

| ID | Severity | Area | Evidence | Risk | Recommendation and status |
|---|---|---|---|---|---|
| C-01 | Medium | Dispute authority | `resolveDispute` is `onlyOwner` and can send all disputed value to either party. | A compromised or unilateral administrator can override the commercial outcome. | **Open.** Before mainnet, transfer ownership to a multisig, introduce a documented arbitration quorum and timelock, and emit/monitor governance actions. Ownable controls centralize a sensitive function; multisig or role separation reduces that single-point-of-failure risk. [4] |
| C-02 | Medium | Payout liveness | Release, refund, and dispute resolution use native `call`; a reverting recipient rolls back the operation. | An account abstraction wallet or recipient contract with a reverting receive path can leave the order in its current state until a compatible recipient/policy exists. | **Open.** Use a pull-payment credit balance, add a controlled beneficiary-update route with dual consent, or specify EOA-only recipients for testnet. State is updated before interaction and guarded, so this is liveness rather than reentrancy loss. [1] [2] |
| C-03 | Low | Acceptance deadline policy | A valid acceptance receipt can release a still-funded escrow after `refundAfter`; the buyer must actively call refund first. | If commercial policy treats the deadline as a hard proof cutoff, a late source acceptance could settle contrary to expectations. | **Open policy decision.** For a hard deadline, reject proof release after `refundAfter`; otherwise state plainly that the deadline opens buyer refund but does not invalidate later verified acceptance. |
| C-04 | Informational | Attestcoin trust boundary | The ASC calls the immutable Creditcoin native verifier at `0x…0FD2`, then validates one decoded receipt event from the immutable source-contract address. | The local contract depends on native verifier correctness, supported-chain finality, decoder behavior, and the configured source-chain key. | **Accepted testnet boundary.** Keep source chain/address immutable, monitor precompile/documentation changes, and include verifier/decoder review in any mainnet audit. Attestcoin documentation describes synchronous native validation only after a source block is finalized and attested on Creditcoin. [5] |
| C-05 | Informational | Emergency response | The immutable testnet escrow has no pause mechanism. | A newly discovered proof-decoder or policy flaw cannot halt funding/release in place. | **Open.** A production successor should consider a constrained, multisig/timelocked pause with documented emergency withdrawal policy. Emergency-stop design must itself have carefully decentralized authority. [4] |
| C-06 | Informational | Forced native value | The contract has no `receive` or surplus-accounting method. | Value forced to the address cannot be attributed to an escrow or withdrawn through normal policy. | **Accepted for testnet.** Add accounted-surplus handling only with a clearly governed withdrawal policy; never conflate it with escrow balances. |
| S-01 | Low — remediated | SIWE origin trust | Challenge issuance previously accepted caller-supplied `origin`. | A non-browser caller could request a message for an arbitrary HTTPS origin. | **Fixed.** The router now derives origin from the request, requires it to match the request host, and optionally enforces `VERISETTLE_APP_ORIGIN`. Client input no longer carries `origin`. |
| S-02 | Low — remediated | SIWE nonce alphabet | The challenge used an arbitrary `nanoid` alphabet. | The standard specifies an alphanumeric nonce; nonstandard punctuation reduces interoperability clarity. | **Fixed.** The server uses 24 cryptographic random bytes encoded as lowercase hexadecimal (48 alphanumeric characters), stores the exact message, and consumes it atomically. The SIWE specification requires a nonce of at least eight alphanumeric characters and matching expected message fields. [3] |
| S-03 | Low — remediated | Wallet session duration | SIWE session issuance inherited the generic one-year default. | A lost browser session remained useful for too long after a wallet sign-in. | **Fixed.** Wallet-created JWT and cookie lifetimes are both bounded to 24 hours. |
| S-04 | Low — remediated | Cookie cross-site exposure | Authenticated sessions used `SameSite=None`. | Cross-site cookie sending broadened CSRF exposure for protected requests. | **Fixed.** Authenticated sessions now use `SameSite=Lax`; the distinct OAuth state cookie remains `SameSite=None` to support the cross-site callback nonce check. |
| S-05 | Informational | Contract-wallet support | Verification uses `ethers.verifyMessage`, which validates EOA/ERC-191 signatures only. | ERC-1271 contract wallets and multisig accounts cannot currently use SIWE sign-in. | **Open compatibility item.** Add chain-aware ERC-1271 verification before claiming smart-account support. EIP-4361 recommends ERC-1271 handling for contract accounts. [3] |
| S-06 | Low | Challenge issuance abuse | Challenge rows expire and cannot be replayed, but issuance has no explicit rate limit or scheduled cleanup. | A bot could create unnecessary database rows or consume service capacity. | **Open.** Rate-limit by origin/address/IP, cap outstanding challenges per address, and periodically delete expired rows. |
| S-07 | Informational | Extension detection | The app detects an injected EIP-1193 provider and labels Rabby/SubWallet when provider flags exist. | Detection is UX guidance, not an attestation that an extension is trustworthy or that the correct account owns a deal. | **Accepted boundary.** Server SIWE verification and on-chain contract checks remain authoritative; retain visible network/action readiness checks. |

## Controls confirmed in source

| Control | Reviewed implementation |
|---|---|
| Escrow creation | Rejects zero seller/value, past refund deadline, and duplicate order ID; records buyer, seller, terms hash, amount, and status. |
| Receipt policy binding | Requires exactly one `OrderAccepted` log, exact immutable source emitter, expected topic/data shape, successful source receipt, and exact buyer/seller/terms-hash match. |
| Proof replay protection | Computes a query ID from proof coordinates, rejects it if previously processed, marks it processed before receipt-driven release, and relies on transaction atomicity if release reverts. |
| Value-transfer ordering | Sets escrow state before `call{value: ...}` and uses `nonReentrant` around release/refund/owner-resolution. |
| Refund authorization | Allows only stored buyer after the configured deadline. |
| Dispute authorization | Allows buyer or seller to raise a dispute; owner-only testnet resolver is explicitly documented. |
| SIWE replay protection | Stores exact challenge text and expiry; an atomic update requires matching nonce, normalized address, exact message, unused status, and unexpired status. |
| SIWE message scope | Binds sign-in message to server-derived browser origin, selected CC3/Sepolia chain ID, address, issued time, and expiry. |
| Transaction readiness | Wallet UI gates source acceptance on Sepolia and CC3 escrow/proof/refund/dispute/replay actions on Creditcoin CC3 Testnet. Contract authorization remains the security authority. |

## Release criteria before non-testnet value

Mainnet deployment should be blocked until an independent Solidity audit includes the native proof/decoder integration, bytecode verification, malformed-receipt fuzzing, state-machine invariants, and gas analysis. Governance must replace the single-owner dispute resolver with a multisig or comparable documented policy. Payout liveness, proof-after-deadline policy, explicit pause/emergency response, challenge rate limiting, and ERC-1271 support must have written acceptance or remediation. Deployment configuration must set `VERISETTLE_APP_ORIGIN` to the canonical HTTPS host and use a separate production database and `JWT_SECRET`.

## References

[1] [Solidity — Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)

[2] [OpenZeppelin Contracts — Utilities and ReentrancyGuard](https://docs.openzeppelin.com/contracts/5.x/api/utils)

[3] [ERC-4361 — Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)

[4] [Ethereum.org — Smart Contract Security](https://ethereum.org/developers/docs/smart-contracts/security/)

[5] [Creditcoin — Attestcoin Protocol](https://docs.creditcoin.org/attestcoin-protocol)
