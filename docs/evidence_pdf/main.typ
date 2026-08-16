// Public DoraHacks evidence deck for VeriSettle.
#import "report-theme.typ": report-accent, report-theme

#show: report-theme.with(
  title: "VeriSettle",
  author: "Manus AI",
  rhythm: "report",
  running-header: true,
)

#page(margin: (top: 27%, x: 2.2cm), numbering: none, header: none)[
  #set par(first-line-indent: 0em)
  #align(center)[
    #text(size: 28pt, weight: "bold", fill: report-accent)[VeriSettle]
    #v(0.45em)
    #text(size: 14pt, fill: luma(42))[Evidence-First Cross-Chain Escrow]
    #v(0.8em)
    #text(size: 10pt, fill: luma(52))[BUIDL CTC 2026 Fall · RWA track]
    #v(2.1em)
    #line(length: 42%, stroke: 0.55pt + report-accent)
    #v(1.4em)
    #text(size: 11pt)[A public-testnet settlement proof, not a simulated flow.]
    #v(2.3em)
    #text(size: 9pt, fill: luma(52))[Prepared by Manus AI · #datetime.today().display("[month repr:long] [day], [year]")]
  ]
]

#page(numbering: none, header: none)[
  #outline(title: [Contents], indent: 1.5em)
]

#counter(page).update(1)

= The claim

VeriSettle is a testnet-only purchase-order escrow for real-world settlement workflows. A buyer funds exact terms in native tCTC on Creditcoin CC3. The buyer later accepts delivery on Ethereum Sepolia. The seller is paid only after the Creditcoin Attestcoin Smart Contract verifies that source receipt against the committed parties, order terms, and one-time proof boundary.

> A delivery receipt becomes a seller payment—once.

This is an RWA settlement primitive: it makes a real-world acceptance event inspectable before an on-chain release. The project is designed for the BUIDL CTC Fall 2026 RWA track, which calls for products that bridge off-chain value and on-chain transparency on Creditcoin.#footnote[#link("https://dorahacks.io/hackathon/buidl-ctc-2026-fall/tracks")[Official Fall tracks]]

= The proof rail

The public evidence below is a completed testnet lifecycle. It is deliberately presented as a sequence so a reviewer can inspect the commercial outcome before the contract architecture.

#enum(
  [*01 — Buyer funds exact terms.* Native tCTC is locked on Creditcoin CC3 against the order, parties, and terms hash. #link("https://creditcoin-testnet.blockscout.com/tx/0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94")[Inspect R01: CC3 escrow funding].],
  [*02 — Buyer acceptance is emitted.* The trusted source emits the delivery acceptance on Ethereum Sepolia. #link("https://sepolia.etherscan.io/tx/0x4b6c2c2645cea40926839e15b63c61e90d6539053a4cce3d3e68ce2f92de1d18")[Inspect R02: Sepolia acceptance].],
  [*03 — Proof releases once.* Attestcoin verifies the receipt and releases the CC3 escrow. #link("https://creditcoin-testnet.blockscout.com/tx/0x0e8c31dc7d8d42066e4285d2362547a5f2cbcd1ca53a2a1662234d657b3dd6df")[Inspect R03: CC3 Attestcoin release].],
)

= Why the proof matters

Attestcoin is the release condition, not a decorative integration. Before funds can move, the Creditcoin ASC requires a successful proof, the expected source emitter and event semantics, buyer and seller binding, the committed terms hash, and a query identifier not previously processed. A valid proof cannot be replayed to release the same escrow a second time.

The public testing record includes a corrupted-proof rejection and a replay-defense result. Those checks are intended to make the project’s critical negative-path behavior inspectable rather than merely asserted.

#enum(
  [*Expected emitter and event.* A proof from the wrong Sepolia source cannot trigger settlement.],
  [*Party and terms binding.* A valid receipt cannot be redirected to a different buyer, seller, or order.],
  [*One-time query use.* The contract rejects a replay with `QueryAlreadyProcessed`.],
)

= Normal settlement and governed recovery

Normal release is proof-bound. A dispute is deliberately different: VeriSettle’s V3 successor separates recovery authority from the escrow contract. A single signer cannot release or refund a disputed escrow; the bound action requires an immutable two-of-three multisig threshold.

#enum(
  [*V3 dispute multisig.* #link("https://creditcoin-testnet.blockscout.com/tx/0x5547fbd93d802522bc8c28509299c19c2a9b7ceaecfebea0973bd4593a7dddbe")[Inspect the deployed 2-of-3 multisig].],
  [*V3 governed escrow ASC.* #link("https://creditcoin-testnet.blockscout.com/tx/0xf7d9e76c14da6577e910cc5cc9d7e5902d57c71cdd03907ba67003ac55734c43")[Inspect the deployed governed escrow].],
)

The two paths remain intentionally distinct: a successful delivery acceptance releases settlement through the proof rail, while a disputed case must clear its separate governance threshold.

= Review without setup

The public Judge Evidence route lets reviewers inspect completed receipts, replay controls, and the V3 recovery boundary without connecting a wallet. Wallet connection, Sign-In with Ethereum, testnet readiness checks, starter funding, and all deal actions remain explicit workspace steps.

#enum(
  [*Judge Evidence:* #link("https://verisettle-testnet.vercel.app/judge")[verisettle-testnet.vercel.app/judge]],
  [*Live workspace:* #link("https://verisettle-testnet.vercel.app/app")[verisettle-testnet.vercel.app/app]],
  [*Protocol reference:* #link("https://verisettle-testnet.vercel.app/protocol")[verisettle-testnet.vercel.app/protocol]],
  [*Source repository:* #link("https://github.com/anhquan075/verisettle")[github.com/anhquan075/verisettle]],
)

= Scope and testnet boundary

VeriSettle is a public-testnet prototype. It does not claim real-fund custody or physical-delivery verification. The interface presents actual testnet receipts and deployed contracts while keeping wallet approval and any funding action separate, explicit, and user-controlled.

= References

#enum(
  [#link("https://buidl.creditcoin.org/")[BUIDL CTC 2026 Fall official builder site]],
  [#link("https://dorahacks.io/hackathon/buidl-ctc/submission-guide")[BUIDL CTC submission guide]],
  [#link("https://github.com/anhquan075/verisettle/blob/main/docs/DEPLOYMENT_INVENTORY.md")[VeriSettle real-testnet deployment inventory]],
  [#link("https://github.com/anhquan075/verisettle/blob/main/docs/V2_MULTISIG_GOVERNANCE_MIGRATION.md")[VeriSettle V3 governed-recovery migration record]],
)
