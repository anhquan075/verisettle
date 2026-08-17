# VeriSettle Walkthrough — Wide Capture and Callout Map

The revised 110-second walkthrough uses only clean **native 1920 × 1080** current-production-equivalent desktop captures of VeriSettle. Each capture is cropped around its real interface region and scaled to fill the entire 16:9 video frame, rather than appearing as a narrow centred canvas. A restrained cursor approaches and clicks only public controls that were exercised in the production interface; every click ripple leads to the corresponding real route or scroll state. The demo stops before opening a wallet provider, requesting a signature, or creating a transaction.

| Narration span | Real production capture | Visible component | Video callout treatment |
|---|---|---|---|
| 00:00–00:18 | Landing `/` Full HD capture | `Judge proof` public route | Cursor click routes directly to public Judge Evidence. |
| 00:18–00:38 | Judge Evidence `/judge` Full HD capture | `See proof`, completed receipts | Cursor click scrolls to the receipt path, then the three real receipts remain visible. |
| 00:38–00:58 | Judge Evidence `/judge` and Protocol `/protocol` captures | `Contracts`, proof boundary, public contract reference | Cursor click opens the public protocol route; replay protection stays visible. |
| 00:58–01:18 | Protocol `/protocol` Full HD capture | `Workspace`, V3 governed recovery | Cursor click hands off to the workspace; V3 threshold authority remains visible. |
| 01:18–01:38 | Workspace `/app` Full HD capture, scrolled to `Secure wallet sign-in` | `Wallet checks`, Choose wallet, Sign in, Verify readiness | Cursor click scrolls to real wallet guidance; no provider is opened and no signature is requested. |
| 01:38–01:50 | Judge Evidence `/judge` Full HD capture | Public R01–R03 receipt path | Cursor rests on public evidence as the walkthrough closes. |

Callouts use thin borders, modest opaque labels, and short leader lines only where needed. White narration subtitles retain a dark outline for high contrast. The callouts do not cover addresses, receipts, or action labels that evaluators need to inspect.
