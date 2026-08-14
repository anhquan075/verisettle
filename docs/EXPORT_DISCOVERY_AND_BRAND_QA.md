# Evidence Export, Deal Discovery, and Brand QA

## Implemented scope

VeriSettle now provides a one-click **Export judge evidence** control on a loaded deal. The control produces a portable Markdown file (or invokes the native file share sheet when available) from the persisted purchase order, chronological immutable timeline, terms commitment, public receipt links, deployed configuration, and replay-safety boundary. The export explicitly excludes private keys, seed phrases, passwords, wallet-extension screenshots, and any unavailable browser-session evidence.

The deal register now exposes **Find deal** and `⌘K`/`Ctrl+K`. The palette searches only authenticated persisted deal fields—order ID, description, buyer/seller addresses, amount, currency, and exact status—and opens the existing detail route. It also offers the same `All`, `Active`, and `Released` register filters; it does not mutate lifecycle data.

## Layout and identity validation

Desktop and 375px mobile captures cover `/`, `/app`, `/protocol`, and the released real-testnet deal `/deals/2w8_iT1aNogY1b`. The generated text-free VeriSettle symbol is used in the landing, authenticated sidebar/header, favicon, and Apple touch icon. The prior compressed brand lockup is now a readable wordmark with the separate subtitle **Cross-chain escrow · CC3 Testnet**.

The authenticated workspace has a single sticky top header at desktop and mobile sizes. It preserves route context, mobile navigation access, and the public-testnet/receipt-bound disclosure while long deal evidence scrolls beneath it. The landing’s **Live testnet route** and the Protocol Reference route now render source → verification → settlement as a connected responsive path, with real explorer or documentation actions at each protocol stage.

## Quality result and boundary

`pnpm test`, `pnpm check`, and `pnpm build` all pass: **31 tests** across 8 files, strict TypeScript, and the production build. The evidence-export Markdown generator has direct deterministic coverage for public receipts, sequence ordering, replay wording, and sensitive-material exclusions. Browser keyboard focus and an actual native share-sheet invocation require an interactive browser session; the command shortcut, focus-capable command dialog, and export/share fallback are covered in code and automated contracts without claiming a session was captured.
