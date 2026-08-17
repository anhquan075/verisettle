# VeriSettle

**VeriSettle** is a cross-chain escrow prototype for the **BUIDL CTC Fall 2026** hackathon. A buyer locks test tCTC on Creditcoin CC3. When the buyer accepts the order on Ethereum Sepolia, Attestcoin verifies that receipt and the Creditcoin escrow releases once.

> **Testnet only.** VeriSettle uses real public testnet contracts and real testnet transactions. It does not hold real customer funds, verify physical delivery, or act as a production custody service.

## Start Here

| What to inspect | Link |
|---|---|
| Live application | <https://verisettle-testnet.vercel.app> |
| Public judge evidence | <https://verisettle-testnet.vercel.app/judge> |
| Full HD walkthrough | <https://files.manuscdn.com/user_upload_by_module/session_file/119889830/FUFyhIQFfvzmGeYG.mp4> |
| Evidence PDF | <https://files.manuscdn.com/user_upload_by_module/session_file/119889830/oFbvQGsZNumWBoJA.pdf> |
| Submission draft | [`docs/DORAHACKS_SUBMISSION_DRAFT_2026.md`](docs/DORAHACKS_SUBMISSION_DRAFT_2026.md) |

## How It Works

| Step | What happens | What prevents a bad release |
|---|---|---|
| 1. Fund | The buyer locks native test tCTC in a Creditcoin CC3 escrow. | The application accepts the funded state only after it decodes a matching on-chain receipt. |
| 2. Accept | The buyer emits `OrderAccepted` on Ethereum Sepolia. | The event is bound to the buyer, seller, order ID, and terms hash. |
| 3. Verify | Attestcoin builds proof of the Sepolia receipt. | The Creditcoin ASC checks receipt success, source event data, terms, parties, and one-time use. |
| 4. Release once | The buyer submits the proof to the Creditcoin escrow. | A successful proof releases escrow; a repeated query is rejected. |
| 5. Resolve disputes | V3 sends dispute authority to a separate 2-of-3 multisig. | One signer cannot release or refund the escrow on their own. |

## Deployed Testnet Contracts

| Network | Contract | Address |
|---|---|---|
| Ethereum Sepolia | VeriSettle source V1 | `0x1aC5b6B47EFe751681A206Fa8A5C305250017425` |
| Ethereum Sepolia | VeriSettle source V2 | `0x56e6d3E213141AA8285D0b12504bDa5dA260aa18` |
| Creditcoin CC3 | V2 escrow ASC | `0x185c81ED5a757d1e290BaBa55F051f3cE791D641` |
| Creditcoin CC3 | V3 dispute multisig | `0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849` |
| Creditcoin CC3 | V3 governed escrow | `0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7` |

The application also exposes the deployed-address inventory, real receipt sequence, and governed-recovery explanation in the public Judge Evidence route.

## Run Locally

Install dependencies, configure the required server environment variables in a local untracked `.env` file, then run the project.

```bash
pnpm install
pnpm dev
```

The main commands are:

```bash
pnpm test   # 78 automated application tests
pnpm check  # TypeScript validation
pnpm build  # production build
```

Do not commit a private key, wallet seed phrase, database URL, JWT secret, WalletConnect ID, or any environment file. The testnet funding signer is configured only in the deployment environment.

## Project Layout

| Path | Purpose |
|---|---|
| `client/` | React interface, wallet onboarding, public Judge Evidence page, and workspace. |
| `server/` | tRPC API, SIWE authentication, testnet funding guard, and receipt checks. |
| `contracts/` | Solidity source for the escrow, V2 policy route, and V3 governed recovery. |
| `foundry/` | Contract tests and invariants. |
| `docs/` | Deployment inventory, security notes, judge sequence, and submission materials. |

## Security Boundaries

Wallet signatures are used for SIWE authentication only; they do not authorize a transfer. Testnet funding requires separate user confirmation and is limited by wallet and user identity. The settlement contract enforces event binding and replay protection, while the V3 multisig separates dispute recovery from ordinary receipt-based release.

## Further Reading

The technical details and testnet evidence are available in [`docs/DEPLOYMENT_INVENTORY.md`](docs/DEPLOYMENT_INVENTORY.md), [`docs/TESTNET_FUNDING.md`](docs/TESTNET_FUNDING.md), [`docs/JUDGE_PROOF_SEQUENCE.md`](docs/JUDGE_PROOF_SEQUENCE.md), and [`docs/SECURITY_AUDIT_2026-08-14.md`](docs/SECURITY_AUDIT_2026-08-14.md).

Attestcoin contract and SDK behavior follows the official Creditcoin documentation.[1] [2]

## References

[1]: https://docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-smart-contracts.md "Attestcoin smart contracts"
[2]: https://docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-sdk-usc-sdk.md "Attestcoin SDK"
