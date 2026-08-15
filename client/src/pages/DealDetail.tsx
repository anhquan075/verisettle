import { DealStatusBadge } from "@/components/DealStatusBadge";
import { ExplorerLink } from "@/components/ExplorerLink";
import { JudgeReplayWalkthrough } from "@/components/JudgeReplayWalkthrough";
import { JudgeEvidenceExport } from "@/components/JudgeEvidenceExport";
import { WalletApprovalEvidence } from "@/components/WalletApprovalEvidence";
import { V2ManifestGateExplainer } from "@/components/V2ManifestGateExplainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTestnetWallet } from "@/hooks/useTestnetWallet";
import { useWalletAccess } from "@/hooks/useWalletAccess";
import { trpc } from "@/lib/trpc";
import { verifyV2PolicyManifest, type V2ManifestVerification } from "@/lib/v2Manifest";
import { WalletReadinessPanel } from "@/components/WalletReadinessPanel";
import { REPLAY_PROTECTION_ERROR, type DealEventType } from "@shared/deals";
import { TESTNET_NETWORKS, toTermsHash, VERISETTLE_CONTRACTS } from "@shared/contracts";
import { V2_POLICY_MANIFEST } from "@shared/v2PolicyManifest";
import { assertExpectedReplayResult, isExpectedReplayRejection } from "@shared/judgeMode";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileCheck2,
  Loader2,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const eventIcon: Record<DealEventType, typeof CheckCircle2> = {
  created: FileCheck2,
  funded: LockKeyhole,
  proof_submitted: CircleDashed,
  proof_verified: ShieldCheck,
  proof_rejected: XCircle,
  released: CheckCircle2,
  refunded: RotateCcw,
  disputed: AlertTriangle,
  replay_rejected: AlertTriangle,
};

function formatTimestamp(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function ErrorBox({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-100"><p><span className="font-semibold">Action rejected.</span> {message}</p><button onClick={onDismiss} className="veri-action shrink-0 rounded-lg border border-rose-200/25 px-3 py-1.5 text-xs font-semibold text-rose-50 hover:bg-rose-100/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200">Review next action</button></div>;
}

function DealActionGuide({ status, walletAddress, activeOperation, nextAction }: { status: string; walletAddress: string | null; activeOperation: string | null; nextAction: string }) {
  const stages = [
    { id: "01", label: "Wallet", detail: walletAddress ? "Connected testnet signer detected." : "Connect the buyer's testnet wallet.", complete: Boolean(walletAddress) },
    { id: "02", label: "Receipt", detail: status === "draft" ? "Fund the matching CC3 escrow." : "Funding receipt is persisted and term-checked.", complete: status !== "draft" },
    { id: "03", label: "Attestation", detail: status === "proof_pending" ? "Wait for the Sepolia block to become attestable, then request proof." : status === "released" ? "Proof was accepted by the ASC." : "Record the matching Sepolia acceptance.", complete: status === "released" },
    { id: "04", label: "Finality", detail: status === "released" ? "Settlement released; a replay is expected to fail." : "Creditcoin settlement remains protected until a valid proof arrives.", complete: status === "released" },
  ];

  return <section aria-label="Guided deal execution" className="veri-action-rail rounded-[1.45rem] border border-cyan-200/12 bg-[#08171c]/75 p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-cyan-200/75">Next permitted action</p><p aria-live="polite" className="mt-1 max-w-3xl text-sm font-semibold text-white">{activeOperation ?? nextAction}</p></div>{activeOperation ? <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-300/[0.08] px-3 py-1.5 text-xs font-semibold text-cyan-100"><Loader2 className="h-3.5 w-3.5 animate-spin" /> In progress</span> : <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400">Follow active stage</span>}</div>
    <ol className="mt-5 grid gap-2 sm:grid-cols-2">{stages.map((stage) => <li key={stage.id} className={`rounded-xl border p-3 ${stage.complete ? "border-teal-200/15 bg-teal-300/[0.045]" : "border-white/8 bg-white/[0.02]"}`}><p className="flex items-center gap-2 text-xs font-semibold text-white"><span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${stage.complete ? "bg-teal-300/15 text-teal-100" : "bg-white/[0.06] text-slate-400"}`}>{stage.complete ? <CheckCircle2 className="h-3 w-3" /> : stage.id}</span>{stage.label}</p><p className="mt-2 text-xs leading-5 text-slate-400">{stage.detail}</p></li>)}</ol>
  </section>;
}

export default function DealDetail({ orderId }: { orderId: string }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const detailQuery = trpc.deals.getDeal.useQuery({ orderId }, { retry: false });
  const { address, busy: walletBusy, connect, fundEscrow, acceptSourceOrder, submitProof: submitProofOnChain, refundEscrow, raiseDispute, replayProof } = useTestnetWallet();
  const walletAccess = useWalletAccess();
  const [sourceTxHash, setSourceTxHash] = useState("");
  const [fundingTxHash, setFundingTxHash] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [replayVerified, setReplayVerified] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [lookupTimedOut, setLookupTimedOut] = useState(false);
  const [v2Manifest, setV2Manifest] = useState<V2ManifestVerification | null>(null);
  const [v2ManifestChecking, setV2ManifestChecking] = useState(false);

  const recordFunding = trpc.deals.recordFunding.useMutation();
  const submitSource = trpc.deals.submitProof.useMutation();
  const prepareProof = trpc.deals.prepareProof.useMutation();
  const recordSettlement = trpc.deals.recordSettlement.useMutation();
  const recordRefund = trpc.deals.recordRefund.useMutation();
  const recordDispute = trpc.deals.recordDispute.useMutation();
  const recordReplay = trpc.deals.recordReplayRejection.useMutation();

  const refresh = async () => {
    await Promise.all([utils.deals.getDeal.invalidate({ orderId }), utils.deals.listDeals.invalidate()]);
  };

  useEffect(() => {
    if (!detailQuery.isLoading) {
      setLookupTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setLookupTimedOut(true), 750);
    return () => window.clearTimeout(timer);
  }, [detailQuery.isLoading, orderId]);

  const isV2PolicyDeployed = detailQuery.data?.deal.policyVersion === "v2_deployed";
  useEffect(() => {
    if (!isV2PolicyDeployed) return;
    let active = true;
    setV2ManifestChecking(true);
    verifyV2PolicyManifest().then(result => {
      if (active) setV2Manifest(result);
    }).finally(() => {
      if (active) setV2ManifestChecking(false);
    });
    return () => { active = false; };
  }, [isV2PolicyDeployed]);

  const run = async (label: string, operation: () => Promise<void>) => {
    setActionError(null);
    setActiveOperation(label);
    try {
      await operation();
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The requested on-chain action could not be completed.");
    } finally {
      setActiveOperation(null);
    }
  };

  if (detailQuery.isLoading && !lookupTimedOut) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading deal evidence</div>;
  }
  if (detailQuery.error || !detailQuery.data || lookupTimedOut) {
    const detailMessage = lookupTimedOut
      ? "This order lookup did not respond. You can retry safely or return to the deal register."
      : detailQuery.error?.message ?? "This purchase order could not be retrieved.";
    return <div role="alert" className="mx-auto max-w-xl rounded-[1.5rem] border border-rose-300/20 bg-rose-400/[0.06] p-7 text-center"><AlertTriangle className="mx-auto h-7 w-7 text-rose-200" /><h1 className="mt-4 font-display text-2xl font-semibold text-white">Deal unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-300">{detailMessage}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={() => { setLookupTimedOut(false); void detailQuery.refetch(); }} variant="outline" className="veri-action">Retry lookup</Button><Button onClick={() => setLocation("/app")} variant="outline" className="veri-action">Return to register</Button></div></div>;
  }

  const { deal, events } = detailQuery.data;
  const terms = {
    orderId: deal.orderId,
    buyerAddress: deal.buyerAddress,
    sellerAddress: deal.sellerAddress,
    amount: deal.amount,
    currency: deal.currency,
    description: deal.description,
    policyVersion: deal.policyVersion,
    termsCommitmentHash: deal.termsCommitmentHash,
    acceptanceExpiresAt: deal.acceptanceExpiresAt,
  };
  const termsHash = toTermsHash(terms);
  const isV2PolicyDraft = deal.policyVersion === "v2_draft";
  const isV2Policy = isV2PolicyDraft || isV2PolicyDeployed;
  const v2ActionsReady = !isV2PolicyDeployed || Boolean(v2Manifest?.verified);
  const canSubmitPolicyAction = !isV2PolicyDeployed || v2ActionsReady;
  const isActionPending = walletBusy || recordFunding.isPending || submitSource.isPending || prepareProof.isPending || recordSettlement.isPending || recordRefund.isPending || recordDispute.isPending || recordReplay.isPending;
  const effectiveSourceHash = sourceTxHash || deal.sepoliaSourceTxHash || "";
  const sourceLink = effectiveSourceHash ? <ExplorerLink hash={effectiveSourceHash} chain="sepolia" className="mt-3" /> : null;
  const lifecycleStages = [
    { label: "Order", detail: "Terms anchored", ready: true },
    { label: "Fund", detail: "tCTC in ASC", ready: deal.status !== "draft" },
    { label: "Attest", detail: "Sepolia proof", ready: ["proof_pending", "released"].includes(deal.status) },
    { label: "Settle", detail: "Receipt final", ready: ["released", "refunded", "disputed"].includes(deal.status) },
  ];
  const nextAction = deal.status === "draft"
    ? "Connect the recorded buyer wallet and fund the native tCTC escrow."
    : deal.status === "funded"
      ? "Emit or attach the matching buyer acceptance from Ethereum Sepolia."
      : deal.status === "proof_pending"
        ? "Request the live Attestcoin proof after the Sepolia block is attested."
        : deal.status === "released"
          ? "Settlement is final. A replay attempt will be rejected by the ASC."
          : deal.status === "refunded"
            ? "Refund completed on Creditcoin CC3 Testnet."
            : "Dispute is active and requires the disclosed resolution process.";
  const requiredWalletNetwork = deal.status === "funded" ? "sepolia" : "creditcoin";
  const walletNetworkReady = walletAccess.readiness[requiredWalletNetwork];
  const creditcoinReady = walletAccess.readiness.creditcoin;
  const sepoliaReady = walletAccess.readiness.sepolia;
  const requireVerifiedV2Manifest = () => {
    if (!canSubmitPolicyAction) throw new Error("The V2 deployment manifest has not verified against public testnet state. No transaction was submitted.");
  };

  const fund = () => run("Waiting for the Creditcoin funding receipt to match these stored terms.", async () => {
    requireVerifiedV2Manifest();
    const txHash = await fundEscrow(terms);
    await recordFunding.mutateAsync({ orderId, fundingTxHash: txHash });
  });
  const attachFundingReceipt = () => run("Checking the supplied CC3 funding receipt against this order.", async () => {
    requireVerifiedV2Manifest();
    await recordFunding.mutateAsync({ orderId, fundingTxHash });
  });
  const createSourceAcceptance = () => run("Waiting for the Ethereum Sepolia acceptance receipt.", async () => {
    requireVerifiedV2Manifest();
    const txHash = await acceptSourceOrder(terms);
    setSourceTxHash(txHash);
    await submitSource.mutateAsync({ orderId, sepoliaSourceTxHash: txHash });
  });
  const attachSourceAcceptance = () => run("Checking the supplied Sepolia receipt against this order.", async () => {
    requireVerifiedV2Manifest();
    await submitSource.mutateAsync({ orderId, sepoliaSourceTxHash: effectiveSourceHash });
  });
  const submitRealProof = () => run("Building the live Attestcoin proof and waiting for CC3 settlement.", async () => {
    requireVerifiedV2Manifest();
    const proof = await prepareProof.mutateAsync({ orderId });
    const txHash = await submitProofOnChain(proof, deal.policyVersion);
    await recordSettlement.mutateAsync({ orderId, settlementTxHash: txHash });
  });
  const refund = () => run("Waiting for the on-chain refund receipt.", async () => {
    requireVerifiedV2Manifest();
    const txHash = await refundEscrow(terms);
    await recordRefund.mutateAsync({ orderId, settlementTxHash: txHash });
  });
  const dispute = () => run("Waiting for the on-chain dispute receipt.", async () => {
    requireVerifiedV2Manifest();
    const txHash = await raiseDispute(terms, disputeReason);
    await recordDispute.mutateAsync({ orderId, reason: disputeReason, disputeTxHash: txHash });
    setShowDispute(false);
  });
  const replay = () => run("Submitting the already processed proof to verify replay protection.", async () => {
    requireVerifiedV2Manifest();
    const proof = await prepareProof.mutateAsync({ orderId });
    const result = await replayProof(proof, deal.policyVersion);
    assertExpectedReplayResult(result);
    try {
      await recordReplay.mutateAsync({ orderId });
    } catch (error) {
      if (!isExpectedReplayRejection(error)) throw error;
      setReplayVerified(true);
    }
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button onClick={() => setLocation("/app")} className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><ArrowLeft className="h-4 w-4" /> Deal register</button>
        <div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-500">{deal.orderId}</span><DealStatusBadge status={deal.status} /></div>
      </div>
      {actionError && <ErrorBox message={actionError} onDismiss={() => setActionError(null)} />}
      {isV2PolicyDraft && <div role="status" className="rounded-[1.35rem] border border-cyan-200/20 bg-cyan-300/[0.07] px-5 py-4 text-sm text-cyan-50"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" /><div><p className="font-semibold">V2 policy draft — no on-chain actions enabled</p><p className="mt-1 leading-6 text-cyan-50/75">This commitment is immutable workspace evidence. Funding, source acceptance, proof, refund, dispute, and release stay blocked until a V2 source and ASC deploy with the same pinned policy hash.</p></div></div></div>}
      {isV2PolicyDeployed && <div role="status" className={`rounded-[1.35rem] border px-5 py-4 text-sm ${v2Manifest?.verified ? "border-violet-200/25 bg-violet-300/[0.08] text-violet-50" : "border-amber-200/25 bg-amber-300/[0.07] text-amber-50"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">V2 policy-pinned testnet route</p><p className="mt-1 leading-6 opacity-80">Policy {V2_POLICY_MANIFEST.policyHash.slice(0, 12)}…{V2_POLICY_MANIFEST.policyHash.slice(-8)} · Sepolia source and CC3 ASC must match public runtime code before every action.</p></div></div><span className="rounded-full border border-current/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">{v2ManifestChecking ? "Verifying" : v2Manifest?.verified ? "Manifest verified" : "Actions blocked"}</span></div><V2ManifestGateExplainer checking={v2ManifestChecking} verified={Boolean(v2Manifest?.verified)} />{v2Manifest && !v2Manifest.verified && <p role="alert" className="mt-3 text-xs leading-5">The public deployment manifest did not verify. Refresh after checking the V2 deployment receipt; no V2 wallet action is available until it does.</p>}</div>}

      <section aria-label="Deal lifecycle status" className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#071216]/85 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-cyan-200/75">Live lifecycle</p><p className="mt-1 text-sm font-medium text-white">Every stage is advanced by a persisted receipt or the deployed ASC.</p></div><span className="rounded-full border border-teal-200/15 bg-teal-300/[0.06] px-3 py-1 text-xs font-medium text-teal-100">CC3 × Sepolia</span></div>
        <ol className="grid divide-y divide-white/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">{lifecycleStages.map((stage, index) => <li key={stage.label} className="flex items-center gap-3 px-5 py-4"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold ${stage.ready ? "border-teal-200/30 bg-teal-300/10 text-teal-100" : "border-white/10 bg-white/[0.03] text-slate-500"}`}>{stage.ready ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><span className="min-w-0"><span className={`block text-sm font-semibold ${stage.ready ? "text-white" : "text-slate-400"}`}>{stage.label}</span><span className="block truncate text-xs text-slate-500">{stage.detail}</span></span></li>)}</ol>
      </section>

      <DealActionGuide status={deal.status} walletAddress={address} activeOperation={activeOperation} nextAction={nextAction} />

      <section className="veri-order-sheet relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a1b21] p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-60 w-60 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100/75">Purchase order / immutable terms</p><h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">{deal.description}</h1><div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 text-sm"><div><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Escrow amount</p><p className="mt-1 text-xl font-semibold text-white">{deal.amount} <span className="text-slate-400">{deal.currency}</span></p></div><div><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Seller</p><p className="mt-1 font-mono text-sm text-cyan-100">{deal.sellerAddress.slice(0, 10)}…{deal.sellerAddress.slice(-8)}</p></div><div><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Buyer</p><p className="mt-1 font-mono text-sm text-cyan-100">{deal.buyerAddress.slice(0, 10)}…{deal.buyerAddress.slice(-8)}</p></div></div><div className="veri-role-notes mt-5 grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100/75">Buyer authority</p><p>Only the recorded buyer acceptance on Sepolia can unlock this proof path.</p></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-100/75">Seller entitlement</p><p>The ASC releases native tCTC only to this recorded seller after proof verification.</p></div></div><div className="mt-4 rounded-xl border border-cyan-200/10 bg-[#061014]/60 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/75">Terms commitment</p><span className="text-xs text-slate-500">Buyer accepts on Sepolia · seller receives on CC3</span></div><p className="mt-2 break-all font-mono text-xs leading-5 text-cyan-100">{termsHash}</p><p className="mt-2 text-xs leading-5 text-slate-400">This hash binds the order ID, both parties, amount, currency, and description. A source event with different terms cannot release this escrow.</p></div></div>
          <div className="rounded-2xl border border-cyan-200/15 bg-[#061014]/70 p-5"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">Wallet readiness</span><span className="text-xs text-slate-500">Real testnet only</span></div><div className="mt-4"><WalletReadinessPanel requiredNetwork={requiredWalletNetwork} compact /></div><div aria-live="polite" className="veri-status-line mt-4 rounded-r-xl border border-white/10 bg-white/[0.025] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Next required action</p><p className="mt-1 text-xs leading-5 text-slate-300">{isV2PolicyDraft ? "Review the immutable policy commitment. V2 testnet transactions unlock only after deployment verification." : isV2PolicyDeployed && !v2ActionsReady ? "Wait for the deployed V2 source and ASC manifest to verify in this browser." : activeOperation ?? nextAction}</p></div></div>
        </div>
      </section>

      {isV2PolicyDraft && <section aria-label="V2 settlement policy commitment" className="rounded-[1.5rem] border border-cyan-200/20 bg-[#07181f] p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100/80">Policy / V2 draft</p><h2 className="mt-2 font-display text-2xl font-semibold text-white">Settlement policy commitment</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">This is the exact proposed policy a future source and ASC must pin. It is immutable draft evidence, not a live contract authorization.</p></div><span className="rounded-full border border-cyan-200/20 bg-cyan-300/[0.08] px-3 py-1 text-xs font-semibold text-cyan-100">M2 policy draft</span></div><div className="mt-6 grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-white/10 bg-black/15 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Finality rule</p><p className="mt-2 text-sm font-semibold text-white">{deal.minimumSourceConfirmations} source confirmations</p><p className="mt-1 text-xs text-slate-500">Attested receipt + confirmation threshold</p></div><div className="rounded-xl border border-white/10 bg-black/15 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Acceptance expires</p><p className="mt-2 text-sm font-semibold text-white">{deal.acceptanceExpiresAt ? formatTimestamp(deal.acceptanceExpiresAt) : "Not set"}</p><p className="mt-1 text-xs text-slate-500">No source acceptance after this boundary</p></div><div className="rounded-xl border border-white/10 bg-black/15 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Refund window</p><p className="mt-2 text-sm font-semibold text-white">{deal.refundWindowSeconds ? `${Math.round(deal.refundWindowSeconds / 86400)} days` : "Not set"}</p><p className="mt-1 text-xs text-slate-500">Future V2 escrow recovery limit</p></div></div><div className="mt-4 grid gap-3 lg:grid-cols-2"><div className="rounded-xl border border-cyan-200/15 bg-cyan-300/[0.04] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/80">Policy hash · schema {deal.termsSchemaVersion}</p><p className="mt-2 break-all font-mono text-xs leading-5 text-cyan-100">{deal.policyHash}</p><p className="mt-2 text-xs leading-5 text-slate-400">Binds domain, version, source chain/emitter, V2 event, finality, and time windows.</p></div><div className="rounded-xl border border-cyan-200/15 bg-cyan-300/[0.04] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/80">Order commitment</p><p className="mt-2 break-all font-mono text-xs leading-5 text-cyan-100">{deal.termsCommitmentHash}</p><p className="mt-2 text-xs leading-5 text-slate-400">Binds this order, both parties, amount, description, policy hash, and expiry.</p></div></div><div className="mt-4 rounded-xl border border-amber-200/15 bg-amber-300/[0.045] p-4 text-xs leading-5 text-amber-50/90"><span className="font-semibold text-amber-100">Deployment boundary:</span> source contract {deal.policySourceContract && !/^0x0{40}$/i.test(deal.policySourceContract) ? deal.policySourceContract : "not assigned"}. A deployed V2 manifest must pin the same policy hash before this draft can become settleable.</div></section>}

      <WalletApprovalEvidence buyerAddress={deal.buyerAddress} connectedAddress={address} />

      <JudgeEvidenceExport deal={deal} events={events} termsHash={termsHash} replayVerified={replayVerified} />

      <section aria-label="Deal evidence summary" className="veri-evidence-index grid overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#081417]/80 sm:grid-cols-3">
        <div className="border-b border-white/10 p-4 sm:border-b-0 sm:border-r"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/75">Buyer evidence</p><p className="mt-2 text-sm font-semibold text-white">{deal.sepoliaSourceTxHash ? "Sepolia approval recorded" : "Approval not yet recorded"}</p><p className="mt-1 text-xs leading-5 text-slate-400">{deal.sepoliaSourceTxHash ? "The trusted source receipt matches this order’s protected terms." : "A matching buyer acceptance is required before proof can be requested."}</p></div>
        <div className="border-b border-white/10 p-4 sm:border-b-0 sm:border-r"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-100/80">Settlement evidence</p><p className="mt-2 text-sm font-semibold text-white">{deal.status === "released" ? "CC3 release decoded" : deal.fundingTxHash ? "Escrow receipt decoded" : "No CC3 receipt yet"}</p><p className="mt-1 text-xs leading-5 text-slate-400">{deal.status === "released" ? "The recorded seller received release only after the proof cleared." : "The application advances only after the receipt matches buyer, seller, amount, and terms."}</p></div>
        <div className="p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100/80">Finality boundary</p><p className="mt-2 text-sm font-semibold text-white">{deal.status === "released" ? "Replay guard armed" : "One-time proof required"}</p><p className="mt-1 text-xs leading-5 text-slate-400">{deal.status === "released" ? "The ASC rejects a second submission of the processed proof query." : "The settlement path remains locked until a valid unique proof is accepted."}</p></div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-white/10 bg-[#091216] p-5 sm:p-7"><div className="flex items-start gap-3"><div className="rounded-xl bg-teal-300/10 p-2.5 text-teal-100"><LockKeyhole className="h-5 w-5" /></div><div><h2 className="font-display text-xl font-semibold text-white">Escrow funding</h2><p className="mt-1 text-sm text-slate-400">Fund the deployed Creditcoin ASC with native tCTC. The server records only a receipt whose event matches these stored terms.</p></div></div><div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4"><div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-slate-300">Creditcoin CC3 escrow</span><DealStatusBadge status={deal.status === "draft" ? "draft" : "funded"} /></div>{deal.fundingTxHash ? <ExplorerLink hash={deal.fundingTxHash} chain="creditcoin" className="mt-3" /> : <p className="mt-3 text-sm text-slate-500">No funding receipt has been recorded.</p>}</div>{deal.status === "draft" && isV2PolicyDraft && <div className="mt-5 rounded-xl border border-cyan-200/15 bg-cyan-300/[0.05] p-4 text-sm leading-6 text-cyan-50"><p className="font-semibold">V2 funding is intentionally unavailable.</p><p className="mt-1 text-cyan-50/70">This draft will not send value until the matching V2 policy is deployed and verified.</p></div>}{deal.status === "draft" && !isV2PolicyDraft && <div className="mt-5 space-y-3"><Button disabled={isActionPending || !creditcoinReady || !canSubmitPolicyAction} onClick={fund} className="veri-action bg-teal-300 font-semibold text-slate-950 hover:bg-teal-200">{isActionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Fund real tCTC escrow</Button><div className="rounded-xl border border-white/10 bg-white/[0.02] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Recovery: transaction already submitted?</p><span className="text-[11px] text-slate-500">No second on-chain action</span></div><div className="mt-3 flex flex-col gap-3 sm:flex-row"><Input value={fundingTxHash} onChange={event => setFundingTxHash(event.target.value)} placeholder="Paste the CC3 funding transaction hash" className="font-mono" aria-describedby="funding-recovery-help" /><Button disabled={isActionPending || !fundingTxHash || !canSubmitPolicyAction} onClick={attachFundingReceipt} variant="outline" className="veri-action border-cyan-200/25 text-cyan-100 hover:bg-cyan-300/10">Verify existing receipt</Button></div><p id="funding-recovery-help" className="mt-2 text-xs leading-5 text-slate-500">Use this only for a real CC3 `EscrowFunded` transaction for these exact buyer, seller, amount, and terms.</p></div></div>}</section>

          <section className="veri-proof-policy rounded-[1.5rem] border border-cyan-200/15 p-5 sm:p-7"><div className="flex items-start gap-3"><div className="rounded-xl bg-cyan-300/10 p-2.5 text-cyan-100"><Sparkles className="h-5 w-5" /></div><div><p className="veri-kicker mb-2">Policy / verification gate</p><h2 className="font-display text-xl font-semibold text-white">Attestcoin proof policy</h2><p className="mt-1 text-sm text-slate-400">The ASC releases only a BlockProver-verified Sepolia receipt with the deployed source emitter and exact protected payload.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-cyan-100/10 bg-[#071216]/70 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Source chain</p><p className="mt-2 text-sm font-semibold text-cyan-50">Ethereum Sepolia <span className="font-mono text-cyan-200">chainKey 1</span></p></div><div className="rounded-xl border border-cyan-100/10 bg-[#071216]/70 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Policy nonce</p><p className="mt-2 truncate font-mono text-sm text-cyan-100">{deal.proofPolicyNonce}</p></div></div><div className="mt-4 rounded-xl border border-white/10 bg-[#071216]/55 p-4 text-sm leading-6 text-slate-300"><span className="font-semibold text-white">Required checks:</span> inclusion proof, receipt status `0x1`, trusted emitter, matching order/buyer/seller/terms, and a unique query ID.</div>
            {deal.status === "funded" && <div className="mt-6 space-y-3"><Label htmlFor="sepoliaTx">Sepolia acceptance transaction</Label><div className="flex flex-col gap-3 sm:flex-row"><Input id="sepoliaTx" value={effectiveSourceHash} onChange={event => setSourceTxHash(event.target.value)} placeholder="0x…" className="font-mono" /><Button disabled={isActionPending || !effectiveSourceHash || !canSubmitPolicyAction} onClick={attachSourceAcceptance} className="bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">Verify receipt</Button></div><Button disabled={isActionPending || !sepoliaReady || !canSubmitPolicyAction} onClick={createSourceAcceptance} variant="outline" className="border-cyan-200/25 text-cyan-100 hover:bg-cyan-300/10">Emit buyer acceptance on Sepolia</Button><p className="text-xs leading-5 text-slate-500">This is a real source-chain transaction. You may also paste a previously mined `OrderAccepted` transaction for exactly these terms.</p>{sourceLink}</div>}
            {deal.status === "proof_pending" && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl border border-cyan-200/15 bg-[#061014]/75 p-5"><div className="flex items-start gap-3"><ClipboardCheck className="mt-0.5 h-5 w-5 text-cyan-200" /><div><h3 className="font-semibold text-white">Real Attestcoin verification</h3><p className="mt-1 text-sm leading-6 text-slate-400">The server requests an attested proof from the official builder, then your wallet submits it to the deployed ASC. Attestation can take several minutes after the Sepolia transaction is mined.</p></div></div>{sourceLink}<Button disabled={isActionPending || !creditcoinReady || !canSubmitPolicyAction} onClick={submitRealProof} className="mt-5 bg-teal-300 font-semibold text-slate-950 hover:bg-teal-200">{isActionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit real Attestcoin proof</Button></motion.div>}
            {deal.status === "released" && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl border border-teal-200/15 bg-teal-300/[0.05] p-5"><h3 className="font-semibold text-white">Settlement released</h3><p className="mt-1 text-sm leading-6 text-slate-400">The product recorded a released state only after a real EscrowReleased receipt was decoded from Creditcoin CC3 Testnet.</p>{deal.settlementTxHash && <ExplorerLink hash={deal.settlementTxHash} chain="creditcoin" className="mt-3" />}<Button disabled={isActionPending || !creditcoinReady || !canSubmitPolicyAction} onClick={replay} variant="outline" className="mt-5 border-rose-300/30 text-rose-100 hover:bg-rose-400/10"><AlertTriangle className="mr-2 h-4 w-4" />Attempt real proof replay</Button></motion.div>}
          </section>

          {deal.status === "released" && <JudgeReplayWalkthrough disabled={isActionPending} onRunReplay={replay} replayVerified={replayVerified} replayError={actionError} onDismissReplayError={() => setActionError(null)} expectedError={REPLAY_PROTECTION_ERROR} settlementTxHash={deal.settlementTxHash} explorerUrl={TESTNET_NETWORKS.creditcoin.explorerUrl} />}

          <section className="rounded-[1.5rem] border border-white/10 bg-[#091216] p-5 sm:p-7"><h2 className="font-display text-xl font-semibold text-white">Resolution controls</h2><p className="mt-1 text-sm text-slate-400">Refund becomes executable after the on-chain deadline. A buyer or seller can raise a real dispute immediately while funding remains active.</p><div className="mt-5 flex flex-wrap gap-3">{deal.status === "funded" && <Button disabled={isActionPending || !creditcoinReady} variant="outline" onClick={refund} className="border-violet-300/30 text-violet-100 hover:bg-violet-300/10">Refund expired escrow</Button>}{deal.status === "funded" && <Button disabled={isActionPending || !creditcoinReady} variant="outline" onClick={() => { setActionError(null); setShowDispute(open => !open); }} className="border-rose-300/30 text-rose-100 hover:bg-rose-400/10">Open dispute</Button>}</div>{showDispute && <div className="mt-5 space-y-3 rounded-xl border border-rose-300/20 bg-rose-400/[0.06] p-4"><Label htmlFor="disputeReason">Dispute reason</Label><Textarea id="disputeReason" value={disputeReason} onChange={event => setDisputeReason(event.target.value)} placeholder="Explain why this settlement needs manual review." /><Button disabled={isActionPending || !creditcoinReady || disputeReason.trim().length < 8} onClick={dispute} className="bg-rose-300 font-semibold text-slate-950 hover:bg-rose-200">Raise real on-chain dispute</Button></div>}</section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start"><section aria-label="Immutable deal timeline" className="rounded-[1.5rem] border border-white/10 bg-[#091216] p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="veri-kicker mb-2">Append-only evidence</p><h2 className="font-display text-xl font-semibold text-white">Immutable timeline</h2><p className="mt-1 text-sm text-slate-400">Events are append-only and ordered by sequence.</p></div><Clock3 className="h-5 w-5 text-cyan-200" /></div><ol className="mt-7 space-y-0">{events.map((event, index) => { const EventIcon = eventIcon[event.type as DealEventType]; const rejected = event.type === "proof_rejected" || event.type === "replay_rejected"; const chain = event.type === "proof_submitted" ? "sepolia" : "creditcoin"; return <li key={event.id} className="relative grid grid-cols-[32px_1fr] gap-3 pb-6 last:pb-0"><div className="relative"><span className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border ${rejected ? "border-rose-300/35 bg-rose-400/10 text-rose-200" : "border-cyan-200/25 bg-cyan-300/10 text-cyan-100"}`}><EventIcon className="h-4 w-4" /></span>{index < events.length - 1 && <span className="absolute left-4 top-8 h-[calc(100%-20px)] w-px bg-white/10" />}</div><div className="min-w-0"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-white">{event.title}</p><span className="shrink-0 text-[11px] text-slate-500">#{event.sequence}</span></div><p className="mt-1 text-sm leading-6 text-slate-400">{event.detail}</p>{event.txHash && <ExplorerLink hash={event.txHash} chain={chain} className="mt-2" />}<p className="mt-2 text-xs text-slate-500">{formatTimestamp(event.createdAt)}</p></div></li>; })}</ol></section>
          <section id="protocol" className="rounded-[1.5rem] border border-cyan-200/15 bg-cyan-300/[0.045] p-5 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100/80">Live protocol configuration</p><h2 className="mt-3 font-display text-xl font-semibold text-white">Attestcoin CC3 Testnet</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Deployed source emitter</dt><dd className="mt-1 break-all font-mono text-xs text-cyan-100"><a href={`${TESTNET_NETWORKS.sepolia.explorerUrl}/address/${VERISETTLE_CONTRACTS.source}`} target="_blank" rel="noreferrer" className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">{VERISETTLE_CONTRACTS.source}</a></dd></div><div><dt className="text-slate-500">Deployed escrow ASC</dt><dd className="mt-1 break-all font-mono text-xs text-cyan-100"><a href={`${TESTNET_NETWORKS.creditcoin.explorerUrl}/address/${VERISETTLE_CONTRACTS.escrowAsc}`} target="_blank" rel="noreferrer" className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">{VERISETTLE_CONTRACTS.escrowAsc}</a></dd></div><div><dt className="text-slate-500">BlockProver precompile</dt><dd className="mt-1 break-all font-mono text-xs text-cyan-100">{VERISETTLE_CONTRACTS.blockProverPrecompile}</dd></div><div><dt className="text-slate-500">SDK</dt><dd className="mt-1 font-mono text-xs text-cyan-100">@gluwa/usc-sdk</dd></div></dl><a href="https://docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-sdk-usc-sdk.md" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Open official SDK docs <ExternalLink className="h-4 w-4" /></a></section>
          <section className="rounded-[1.5rem] border border-amber-200/15 bg-amber-300/[0.045] p-5 text-sm leading-6 text-amber-50/90"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" /><p><span className="font-semibold text-amber-100">Judge replay demo:</span> after settlement, choose <em>Attempt real proof replay</em>. The deployed ASC rejects the proof query; the UI displays: “{REPLAY_PROTECTION_ERROR}”</p></div></section>
        </aside>
      </div>
    </div>
  );
}
