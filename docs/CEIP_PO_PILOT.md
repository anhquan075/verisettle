# CEIP one-pager — purchase-order settlement pilot

**VeriSettle** · Creditcoin Ecosystem Integration Proposal · testnet pilot  
Canonical app: https://verisettle.vercel.app · Judge: https://verisettle.vercel.app/judge

Attestcoin verifies the **acceptance receipt**, **NOT** physical delivery.

## Problem

Purchase-order settlement still waits on email PDFs, shared spreadsheets, and a trusted operator who decides when to release funds. Cross-border tCTC (or later mainnet CTC) escrow cannot honestly unlock on “we think the buyer accepted” if that acceptance lives on another chain and is not proven.

Buyers overpay operational risk. Sellers wait on discretionary release. Neither side can show a public, replay-safe receipt rail to a judge or auditor.

## Why Attestcoin

Attestcoin is the release condition, not a dashboard decoration.

- Buyer funds exact terms on Creditcoin CC3.
- Buyer (or an optional registered carrier) emits a Sepolia event bound to those terms.
- ChainInfo (`0xFD3`) reports when that source height is attested.
- `ProofBuilder` + BlockProver `verifyAndEmit` (`0xFD2`) prove inclusion.
- The ASC decodes the event and pays the recorded seller **once**.

No fabricated balances. No centralized oracle “yes.” A relayer cannot steal the escrow because it cannot change parties or terms.

## Vertical

**B2B purchase-order escrow** for testnet goods: a buyer PO, a seller fulfillment promise, and an on-chain acceptance (or optional carrier confirmation) that unlocks native tCTC.

Out of scope for this pilot: customs, insurance, warehouse IoT, and any claim that a receipt equals physical delivery.

## Roadmap

1. **Now (testnet).** Live V1/V2/V3 routes, two-wallet evidence, ChainInfo-gated proofs, optional relayer, optional carrier + silence-timeout policies under Foundry.
2. **Pilot cohort.** 3–5 Creditcoin ecosystem teams run real Sepolia/CC3 POs with distinct buyer and seller keys. Publish `contracts/test-runs/` JSON, not screenshots.
3. **Governed recovery.** Keep 2-of-3 V3 for disputes; use attested-height silence refunds when no acceptance arrives.
4. **Mainnet only after** verified contracts, keyed ops runbooks, and a legal wrapper that still refuses to call a receipt “delivery.”

## Ask

- Creditcoin / Attestcoin office hours for constructor-arg verification and ChainInfo semantics on CC3.
- Introductions to two purchase-order operators willing to run the testnet desk.
- A CEIP slot to treat receipt-bound escrow as a documented Creditcoin settlement pattern — not a new prover.

Contact and evidence live at https://verisettle.vercel.app/judge.
