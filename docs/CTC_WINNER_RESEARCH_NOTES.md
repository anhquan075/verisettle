# Prior BUIDL CTC Winner Research Notes

## Verified prior cohort

The relevant completed predecessor is DoraHacks’ **BUIDL CTC Hackathon – BUIDL For The Real World** at `https://dorahacks.io/hackathon/buidl-ctc/`. Its public index reports a **$15,000 prize pool**, **76 BUIDL submissions**, **189 hackers**, a submission window from **1 February 2026** through **8 March 2026**, and required a repository link plus demo video. The published winner-announcement date was **21 March 2026**.

## Primary sources

| Evidence | URL | Status |
|---|---|---|
| Prior hackathon project index and requirements | https://dorahacks.io/hackathon/buidl-ctc/buidl | Extracted; winner route linked |
| Prior official winners route | https://dorahacks.io/hackathon/buidl-ctc/winner | Dynamic page did not render names in browser extraction; needs corroboration |
| Prior official details route | https://dorahacks.io/hackathon/buidl-ctc/detail | Dynamic page did not render details in browser extraction; search corroborates prizes and dates |
| Discovered winner candidate | https://dorahacks.io/buidl/40363/milestones | HashCredit is indexed as a BUIDL CTC winner candidate; prize tier and project evidence require verification |

## Official winner assignment data

The DoraHacks page’s public winner-assignment endpoint returned HTTP 200 for `https://dorahacks.io/api/v1/hub/hackathon-winner-assignments?hackathon=buidl-ctc`. It confirms the completed cohort had exactly three overall awards and describes the group as an integrated DeFi protocol, an on-chain community savings model, and a credit protocol tied to Bitcoin-mining rewards.

| Prize | BUIDL ID | Project | Official vision |
|---|---:|---|---|
| Grand Prize | 40170 | CrediKye – On-chain ROSCA savings circles | Friends save together and take turns receiving the pot; gamified with ranks, badges, and XP. |
| 2nd Prize | 40363 | HashCredit | Turn BTC mining payouts into on-chain USDT credit lines via USC powered by CTC. |
| 3rd Prize | 39899 | SnowBall | Full-stack CDP, lending, DEX, and yield-vault protocol; mint sbUSD against CTC now and RWA-backed tokens later. |

The corresponding project-detail payload was retrieved from `https://dorahacks.io/api/v1/hub/hackathon-winner-assignments/345/buidl-details`.

## Research standard

Only project names and prize tiers corroborated by a primary official page or two independent credible sources will be treated as confirmed. Where the official DoraHacks dynamic winners page cannot be rendered, any uncorroborated project will be labeled **candidate / not independently verified**, not presented as a confirmed winner.
