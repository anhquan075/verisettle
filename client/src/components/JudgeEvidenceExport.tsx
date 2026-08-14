import { TESTNET_NETWORKS, VERISETTLE_CONTRACTS } from "@shared/contracts";
import { REPLAY_PROTECTION_ERROR } from "@shared/deals";
import { Check, Download, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

type EvidenceDeal = {
  orderId: string;
  status: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: string;
  currency: string;
  description: string;
  sepoliaSourceTxHash?: string | null;
  fundingTxHash?: string | null;
  settlementTxHash?: string | null;
  proofPolicyNonce: string;
  createdAt: Date | string;
};

type EvidenceEvent = {
  sequence: number;
  type: string;
  title: string;
  detail: string;
  txHash?: string | null;
  createdAt: Date | string;
};

function receiptUrl(chain: "sepolia" | "creditcoin", hash?: string | null) {
  if (!hash) return null;
  const explorer = chain === "sepolia" ? TESTNET_NETWORKS.sepolia.explorerUrl : TESTNET_NETWORKS.creditcoin.explorerUrl;
  return `${explorer}/tx/${hash}`;
}

function eventChain(type: string) {
  return type === "proof_submitted" ? "sepolia" : "creditcoin" as const;
}

export function buildJudgeEvidenceMarkdown({
  deal,
  events,
  termsHash,
  replayVerified,
}: {
  deal: EvidenceDeal;
  events: EvidenceEvent[];
  termsHash: string;
  replayVerified: boolean;
}) {
  const source = receiptUrl("sepolia", deal.sepoliaSourceTxHash);
  const funding = receiptUrl("creditcoin", deal.fundingTxHash);
  const settlement = receiptUrl("creditcoin", deal.settlementTxHash);
  const timeline = [...events]
    .sort((left, right) => left.sequence - right.sequence)
    .map(event => {
      const url = receiptUrl(eventChain(event.type), event.txHash);
      return `- #${event.sequence} · **${event.title}** (${new Date(event.createdAt).toISOString()})\n  ${event.detail}${url ? `\n  Receipt: ${url}` : ""}`;
    })
    .join("\n");

  return `# VeriSettle Judge Evidence Bundle

## Scope

This portable record summarizes persisted purchase-order evidence and public testnet receipts for **${deal.orderId}**. It is generated from the authenticated VeriSettle workspace; it does not contain private keys, seed phrases, passwords, wallet-extension screenshots, or claims of physical delivery.

## Purchase order

- Status: **${deal.status}**
- Buyer: \`${deal.buyerAddress}\`
- Seller: \`${deal.sellerAddress}\`
- Escrow amount: **${deal.amount} ${deal.currency}**
- Description: ${deal.description}
- Created: ${new Date(deal.createdAt).toISOString()}
- Terms commitment: \`${termsHash}\`
- Proof policy nonce: \`${deal.proofPolicyNonce}\`

## Public receipt links

- Sepolia source acceptance: ${source ?? "Not recorded"}
- Creditcoin CC3 escrow funding: ${funding ?? "Not recorded"}
- Creditcoin CC3 settlement/refund/dispute: ${settlement ?? "Not recorded"}

## Immutable timeline

${timeline || "No immutable events are available."}

## Deployed testnet configuration

- Source emitter (Ethereum Sepolia): \`${VERISETTLE_CONTRACTS.source}\`
- Escrow ASC (Creditcoin CC3): \`${VERISETTLE_CONTRACTS.escrowAsc}\`
- BlockProver precompile: \`${VERISETTLE_CONTRACTS.blockProverPrecompile}\`
- Ethereum Sepolia chain ID: ${TESTNET_NETWORKS.sepolia.chainId}
- Creditcoin CC3 chain ID: ${TESTNET_NETWORKS.creditcoin.chainId}

## Replay-safety evidence

- Expected on-chain rejection reason: **${REPLAY_PROTECTION_ERROR}**
- In-session replay demonstration completed: **${replayVerified ? "Yes" : "Not recorded in this session"}**

## Evidence boundary

VeriSettle verifies configured on-chain receipt inclusion, success, event semantics, parties, terms binding, and one-time proof use. This testnet evidence does not assert physical delivery, custody of real funds, or an unavailable browser-wallet approval capture.
`;
}

export function JudgeEvidenceExport({
  deal,
  events,
  termsHash,
  replayVerified,
}: {
  deal: EvidenceDeal;
  events: EvidenceEvent[];
  termsHash: string;
  replayVerified: boolean;
}) {
  const [result, setResult] = useState<"idle" | "shared" | "downloaded" | "error">("idle");
  const markdown = useMemo(() => buildJudgeEvidenceMarkdown({ deal, events, termsHash, replayVerified }), [deal, events, termsHash, replayVerified]);

  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `verisettle-judge-evidence-${deal.orderId}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  };

  const exportEvidence = async () => {
    setResult("idle");
    try {
      const file = new File([markdown], `verisettle-judge-evidence-${deal.orderId}.md`, { type: "text/markdown" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `VeriSettle evidence · ${deal.orderId}`, text: "Judge evidence bundle from VeriSettle testnet.", files: [file] });
        setResult("shared");
      } else {
        download();
        setResult("downloaded");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        download();
        setResult("downloaded");
      } catch {
        setResult("error");
      }
    }
  };

  return (
    <section aria-label="Judge evidence export" className="rounded-[1.35rem] border border-cyan-200/15 bg-cyan-300/[0.045] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-100/80">Portable review record</p><p className="mt-1 text-sm font-semibold text-white">Share the receipt trail in one file.</p></div>
        <button type="button" onClick={() => void exportEvidence()} className="veri-action inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-3.5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"><Share2 className="h-4 w-4" /> Export judge evidence</button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-400">Includes persisted terms, chronological events, public receipt links, deployed testnet configuration, and the replay boundary. Never includes sensitive wallet material.</p>
      {result !== "idle" && <p role={result === "error" ? "alert" : "status"} className={`mt-3 inline-flex items-center gap-2 text-xs font-medium ${result === "error" ? "text-rose-100" : "text-teal-100"}`}>{result === "error" ? "Unable to export evidence. Please try again." : <><Check className="h-3.5 w-3.5" />{result === "shared" ? "Evidence bundle shared." : <><Download className="h-3.5 w-3.5" /> Evidence bundle downloaded.</>}</>}</p>}
    </section>
  );
}
