import { DealStatusBadge } from "@/components/DealStatusBadge";
import { Button } from "@/components/ui/button";
import { DealCommandPalette } from "@/components/DealCommandPalette";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useTestnetWallet } from "@/hooks/useTestnetWallet";
import { verifyV2PolicyManifest, type V2ManifestVerification } from "@/lib/v2Manifest";
import { V2ManifestGateExplainer } from "@/components/V2ManifestGateExplainer";
import { WalletFirstLaunchpad } from "@/components/WalletFirstLaunchpad";
import { VERISETTLE_CONTRACTS } from "@shared/contracts";
import { V2_GOVERNED_POLICY_MANIFEST, V2_POLICY_MANIFEST } from "@shared/v2PolicyManifest";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ArrowUpRight, CircleAlert, FileKey2, FilePlus2, Loader2, Network, Plus, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const initialForm = {
  buyerAddress: "",
  sellerAddress: "",
  amount: "",
  currency: "tCTC" as const,
  description: "",
  policyKind: "v1_live" as "v1_live" | "v2_draft" | "v2_deployed" | "v2_governed",
  policySourceContract: "",
  policyConfirmations: "12",
  policyAcceptanceDays: "7",
  policyRefundDays: "30",
};

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatTctcAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(amount);
}

const isEvmAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value.trim());
const isPositiveAmount = (value: string) => Number.isFinite(Number(value)) && Number(value) > 0;

export default function DealDashboard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [form, setForm] = useState(initialForm);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "released">("all");
  const [policyFilter, setPolicyFilter] = useState<"all" | "v1" | "v2">("all");
  const [v2Manifest, setV2Manifest] = useState<V2ManifestVerification | null>(null);
  const [v2ManifestChecking, setV2ManifestChecking] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const dealsQuery = trpc.deals.listDeals.useQuery();
  const { address: walletAddress, busy: walletBusy, connect } = useTestnetWallet();
  const descriptionLength = form.description.trim().length;
  const descriptionIsValid = descriptionLength >= 8;
  const buyerIsValid = isEvmAddress(form.buyerAddress);
  const sellerIsValid = isEvmAddress(form.sellerAddress) && form.sellerAddress.trim().toLowerCase() !== form.buyerAddress.trim().toLowerCase();
  const amountIsValid = isPositiveAmount(form.amount);
  const policyConfirmations = Number(form.policyConfirmations);
  const policyAcceptanceDays = Number(form.policyAcceptanceDays);
  const policyRefundDays = Number(form.policyRefundDays);
  const v2PolicyValid = form.policyKind !== "v2_draft" || (
    Number.isInteger(policyConfirmations) && policyConfirmations >= 1 && policyConfirmations <= 512 &&
    Number.isInteger(policyAcceptanceDays) && policyAcceptanceDays >= 1 && policyAcceptanceDays <= 30 &&
    Number.isInteger(policyRefundDays) && policyRefundDays >= policyAcceptanceDays && policyRefundDays <= 90 &&
    (!form.policySourceContract.trim() || isEvmAddress(form.policySourceContract))
  );
  const fieldErrors = [
    !buyerIsValid ? "Enter a valid buyer EVM address." : null,
    !sellerIsValid ? "Enter a valid seller address that differs from the buyer." : null,
    !amountIsValid ? "Enter a positive native tCTC amount." : null,
    !descriptionIsValid ? "Add a purchase-order description with at least 8 characters." : null,
    !v2PolicyValid ? "Review the V2 policy window, confirmation, and optional source address." : null,
    (form.policyKind === "v2_deployed" || form.policyKind === "v2_governed") && !v2Manifest?.verified ? "The selected V2 deployment manifest must verify before you can create an actionable V2 order." : null,
  ].filter((error): error is string => Boolean(error));

  useEffect(() => {
    if (form.policyKind !== "v2_deployed" && form.policyKind !== "v2_governed") return;
    let active = true;
    setV2ManifestChecking(true);
    verifyV2PolicyManifest(form.policyKind).then(result => {
      if (active) setV2Manifest(result);
    }).finally(() => {
      if (active) setV2ManifestChecking(false);
    });
    return () => { active = false; };
  }, [form.policyKind]);

  useEffect(() => {
    if (attemptedSubmit && fieldErrors.length) errorSummaryRef.current?.focus();
  }, [attemptedSubmit, fieldErrors.length]);
  const createDeal = trpc.deals.createDeal.useMutation({
    onSuccess: data => {
      utils.deals.listDeals.invalidate();
      setLocation(`/deals/${data.deal.orderId}`);
    },
    onError: error => setFormError(error.message.includes("description") ? "Add a purchase-order description with at least 8 characters before creating the draft." : error.message),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttemptedSubmit(true);
    setFormError(null);
    if (fieldErrors.length) {
      setFormError("Review the highlighted purchase-order fields before creating the draft.");
      return;
    }
    const policy = form.policyKind === "v1_live"
      ? { kind: "v1_live" as const }
        : form.policyKind === "v2_deployed" || form.policyKind === "v2_governed"
          ? { kind: form.policyKind }
        : {
          kind: "v2_draft" as const,
          sourceContract: form.policySourceContract.trim(),
          minimumSourceConfirmations: policyConfirmations,
          acceptanceWindowSeconds: policyAcceptanceDays * 24 * 60 * 60,
          refundWindowSeconds: policyRefundDays * 24 * 60 * 60,
        };
    createDeal.mutate({
      buyerAddress: form.buyerAddress,
      sellerAddress: form.sellerAddress,
      amount: form.amount,
      currency: form.currency,
      description: form.description.trim(),
      policy,
    });
  };

  const connectWallet = async () => {
    setFormError(null);
    try {
      const address = await connect();
      setForm(current => ({ ...current, buyerAddress: address }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to connect the testnet wallet.");
    }
  };

  const openGuidedSetup = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("wallet-launchpad")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };

  const totals = dealsQuery.data?.reduce(
    (summary, deal) => {
      summary.total += 1;
      if (deal.status === "released") summary.released += 1;
      if (["funded", "proof_pending"].includes(deal.status)) summary.active += 1;
      return summary;
    },
    { total: 0, active: 0, released: 0 }
  ) ?? { total: 0, active: 0, released: 0 };
  const visibleDeals = dealsQuery.data?.filter(deal => {
    if (statusFilter === "active") return ["funded", "proof_pending"].includes(deal.status);
    if (statusFilter === "released") return deal.status === "released";
    if (policyFilter === "v1") return deal.policyVersion === "v1_live";
    if (policyFilter === "v2") return deal.policyVersion === "v2_draft" || deal.policyVersion === "v2_deployed" || deal.policyVersion === "v2_governed";
    return true;
  }) ?? [];
  const filters = [
    { id: "all" as const, label: "All", count: totals.total },
    { id: "active" as const, label: "Active", count: totals.active },
    { id: "released" as const, label: "Released", count: totals.released },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      <section className="grid gap-5 lg:grid-cols-[1.16fr_0.84fr]">
        <div className="veri-workspace-spark relative overflow-hidden rounded-[2rem] p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100/20 bg-black/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100"><ShieldCheck className="h-3.5 w-3.5" /> Settlement desk</div>
            <h1 className="mt-6 max-w-xl font-veri-display text-4xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-5xl">Terms first.<br />Proof decides.</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">Start guided setup first. Then create terms, fund CC3 escrow, and follow public proof evidence.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" onClick={openGuidedSetup} className="veri-action group bg-white font-semibold text-slate-950 shadow-[0_0_32px_rgba(255,255,255,0.18)] hover:bg-cyan-50"><ShieldCheck className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />Start guided setup</Button><Button size="lg" onClick={() => setShowCreateForm(open => !open)} variant="outline" className="veri-action border-cyan-100/25 bg-[#061014]/25 font-semibold text-cyan-50 hover:bg-[#061014]/45"><Plus className="mr-2 h-4 w-4" />{showCreateForm ? "Close order form" : "Create purchase order"}</Button></div>
            <div className="veri-workspace-spark__footer"><span><span className="h-2 w-2 rounded-full bg-teal-300" /> Testnet only</span><span>Sepolia approval → CC3 escrow</span></div>
          </div>
        </div>

        <aside className="veri-workspace-queue rounded-[2rem] border border-white/10 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><p className="veri-kicker">Live queue</p><h2 className="mt-2 font-veri-display text-2xl font-semibold tracking-[-0.055em] text-white">Needs action.</h2></div><Network className="h-6 w-6 text-cyan-200" /></div>
          <div className="veri-operator-meter mt-6"><div><p>Active</p><strong>{totals.active}</strong><span>Proof or settlement</span></div><div><p>Released</p><strong>{totals.released}</strong><span>Receipt final</span></div></div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">Proof rail</p><span className="rounded-full bg-teal-300/10 px-2 py-1 text-[10px] font-semibold text-teal-100">Configured</span></div><p className="mt-3 font-display text-lg font-semibold text-white">Sepolia <span className="text-cyan-200">→</span> CC3</p><p className="mt-2 truncate font-mono text-[11px] text-cyan-100">{VERISETTLE_CONTRACTS.escrowAsc}</p></div>
        </aside>
      </section>

      <WalletFirstLaunchpad onCreateOrder={() => setShowCreateForm(true)} />

      <AnimatePresence initial={false}>
      {showCreateForm && (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="rounded-[1.5rem] border border-white/10 bg-[#0a1519] p-5 sm:p-7"
        >
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-cyan-300/10 p-2.5 text-cyan-200"><FilePlus2 className="h-5 w-5" /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-veri-display text-xl font-semibold text-white">New purchase order</h2><span className="rounded-full border border-cyan-200/15 bg-cyan-300/[0.06] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">01 · Terms</span></div>
              <p className="mt-1 text-sm text-slate-400">Set the terms. The chain binds the rest.</p>
            </div>
          </div>
          <ol aria-label="Purchase order stages" className="mb-6 grid gap-2 sm:grid-cols-3"><li className="rounded-xl border border-cyan-200/15 bg-cyan-300/[0.06] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">01 · Terms</p><p className="mt-1 text-xs leading-5 text-slate-300">Parties, value, description.</p></li><li className="rounded-xl border border-white/8 bg-white/[0.02] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">02 · Fund</p><p className="mt-1 text-xs leading-5 text-slate-400">CC3 receipt matches.</p></li><li className="rounded-xl border border-white/8 bg-white/[0.02] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">03 · Prove</p><p className="mt-1 text-xs leading-5 text-slate-400">Proof releases escrow.</p></li></ol>
          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buyerAddress">Buyer address</Label>
              <div className="flex gap-2"><Input id="buyerAddress" value={form.buyerAddress} onChange={event => setForm({ ...form, buyerAddress: event.target.value })} placeholder="0x…" required aria-invalid={attemptedSubmit && !buyerIsValid} aria-describedby={attemptedSubmit && !buyerIsValid ? "buyer-error" : undefined} className={attemptedSubmit && !buyerIsValid ? "border-rose-300/60" : undefined} /><Button type="button" onClick={connectWallet} disabled={walletBusy} variant="outline" className="min-h-11 shrink-0 border-cyan-100/20 text-cyan-100 hover:bg-cyan-300/10">Use wallet</Button></div>
              {attemptedSubmit && !buyerIsValid && <p id="buyer-error" className="flex items-center gap-1.5 text-xs text-rose-100"><CircleAlert className="h-3.5 w-3.5" /> Enter a valid buyer EVM address.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellerAddress">Seller address</Label>
              <Input id="sellerAddress" value={form.sellerAddress} onChange={event => setForm({ ...form, sellerAddress: event.target.value })} placeholder="0x…" required aria-invalid={attemptedSubmit && !sellerIsValid} aria-describedby={attemptedSubmit && !sellerIsValid ? "seller-error" : undefined} className={attemptedSubmit && !sellerIsValid ? "border-rose-300/60" : undefined} />
              {attemptedSubmit && !sellerIsValid && <p id="seller-error" className="flex items-center gap-1.5 text-xs text-rose-100"><CircleAlert className="h-3.5 w-3.5" /> Use a valid seller address that differs from the buyer.</p>}
            </div>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Asset amount</Label>
                <Input id="amount" inputMode="decimal" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} placeholder="0.01" required aria-invalid={attemptedSubmit && !amountIsValid} aria-describedby={attemptedSubmit && !amountIsValid ? "amount-error" : undefined} className={attemptedSubmit && !amountIsValid ? "border-rose-300/60" : undefined} />
                {attemptedSubmit && !amountIsValid && <p id="amount-error" className="flex items-center gap-1.5 text-xs text-rose-100"><CircleAlert className="h-3.5 w-3.5" /> Enter a positive tCTC amount.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Asset</Label>
                <Input id="currency" value={form.currency} readOnly aria-readonly="true" className="text-slate-400" />
              </div>
            </div>
            <div className="rounded-xl border border-cyan-100/10 bg-cyan-300/[0.035] px-4 py-3 text-sm leading-6 text-slate-300">
              <span className="font-semibold text-cyan-100">Proof policy:</span> only a receipt-success `OrderAccepted` event for these exact terms can enter the Attestcoin verification path.
            </div>
            <fieldset className="md:col-span-2 rounded-2xl border border-cyan-200/15 bg-[#061014]/60 p-4">
              <legend className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">Settlement policy</legend>
              <div className="grid gap-3 lg:grid-cols-4">
                <button type="button" onClick={() => setForm(current => ({ ...current, policyKind: "v1_live" }))} aria-pressed={form.policyKind === "v1_live"} className={`veri-action rounded-xl border p-4 text-left transition-colors ${form.policyKind === "v1_live" ? "border-teal-200/35 bg-teal-300/[0.08]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}><p className="flex items-center gap-2 text-sm font-semibold text-white"><span className="rounded-full bg-teal-300/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-teal-100">Live</span> V1 testnet policy</p><p className="mt-2 text-xs leading-5 text-slate-400">Current source and ASC. Funding and proof actions are available.</p></button>
                <button type="button" onClick={() => setForm(current => ({ ...current, policyKind: "v2_deployed" }))} aria-pressed={form.policyKind === "v2_deployed"} className={`veri-action rounded-xl border p-4 text-left transition-colors ${form.policyKind === "v2_deployed" ? "border-violet-200/40 bg-violet-300/[0.09]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}><p className="flex items-center gap-2 text-sm font-semibold text-white"><span className="rounded-full bg-violet-300/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-violet-100">Verified</span> V2 pinned policy</p><p className="mt-2 text-xs leading-5 text-slate-400">Sepolia + CC3 policy hash. Public code must verify before funding.</p></button>
                <button type="button" onClick={() => setForm(current => ({ ...current, policyKind: "v2_governed" }))} aria-pressed={form.policyKind === "v2_governed"} className={`veri-action rounded-xl border p-4 text-left transition-colors ${form.policyKind === "v2_governed" ? "border-fuchsia-200/40 bg-fuchsia-300/[0.09]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}><p className="flex items-center gap-2 text-sm font-semibold text-white"><span className="rounded-full bg-fuchsia-300/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-fuchsia-100">2 of 3</span> V2 governed policy</p><p className="mt-2 text-xs leading-5 text-slate-400">Verified source and ASC. Disputes require threshold governance.</p></button>
                <button type="button" onClick={() => setForm(current => ({ ...current, policyKind: "v2_draft" }))} aria-pressed={form.policyKind === "v2_draft"} className={`veri-action rounded-xl border p-4 text-left transition-colors ${form.policyKind === "v2_draft" ? "border-cyan-200/35 bg-cyan-300/[0.08]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}><p className="flex items-center gap-2 text-sm font-semibold text-white"><span className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-cyan-100">Draft</span> V2 policy preview</p><p className="mt-2 text-xs leading-5 text-slate-400">Creates an immutable policy commitment. No V1 transaction can use it.</p></button>
              </div>
              {(form.policyKind === "v2_deployed" || form.policyKind === "v2_governed") && (() => { const manifest = form.policyKind === "v2_governed" ? V2_GOVERNED_POLICY_MANIFEST : V2_POLICY_MANIFEST; return <div className={`mt-4 rounded-xl border p-4 ${v2Manifest?.verified ? "border-violet-200/25 bg-violet-300/[0.06]" : "border-amber-200/25 bg-amber-300/[0.06]"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-white">{form.policyKind === "v2_governed" ? "V2 governed deployment manifest" : "V2 deployment manifest"}</p><p className="mt-1 text-xs leading-5 text-slate-300">Policy <span className="font-mono text-violet-100">{manifest.policyHash.slice(0, 12)}…{manifest.policyHash.slice(-8)}</span> · 7-day acceptance · 30-day refund.</p></div><span role="status" className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${v2ManifestChecking ? "bg-amber-200/10 text-amber-100" : v2Manifest?.verified ? "bg-violet-200/10 text-violet-100" : "bg-rose-200/10 text-rose-100"}`}>{v2ManifestChecking ? "Verifying" : v2Manifest?.verified ? "Code verified" : "Blocked"}</span></div><p className="mt-3 font-mono text-[11px] text-slate-400">Source {manifest.source.address} · ASC {manifest.escrowAsc.address}</p>{form.policyKind === "v2_governed" && <p className="mt-2 text-xs leading-5 text-fuchsia-100">Dispute authority is pinned to <span className="font-mono">{V2_GOVERNED_POLICY_MANIFEST.governance.address}</span> with a 2-of-3 signer threshold.</p>}<V2ManifestGateExplainer checking={v2ManifestChecking} verified={Boolean(v2Manifest?.verified)} />{v2Manifest && !v2Manifest.verified && <p role="alert" className="mt-3 text-xs leading-5 text-amber-100">Public RPC verification did not match the pinned manifest. V2 creation and submission remain blocked; retry after checking the deployment record.</p>}</div>; })()}
              {form.policyKind === "v2_draft" && <div className="mt-4 space-y-4 rounded-xl border border-cyan-200/15 bg-cyan-300/[0.045] p-4"><div className="flex gap-3 text-sm leading-6 text-cyan-50"><FileKey2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" /><p><span className="font-semibold">Draft only.</span> The workspace will calculate a V2 policy hash and per-order commitment. Funding stays disabled until a future V2 source and ASC pin the same policy.</p></div><div className="grid gap-3 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="policyConfirmations">Source confirmations</Label><Input id="policyConfirmations" inputMode="numeric" value={form.policyConfirmations} onChange={event => setForm({ ...form, policyConfirmations: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="policyAcceptanceDays">Acceptance window (days)</Label><Input id="policyAcceptanceDays" inputMode="numeric" value={form.policyAcceptanceDays} onChange={event => setForm({ ...form, policyAcceptanceDays: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="policyRefundDays">Refund window (days)</Label><Input id="policyRefundDays" inputMode="numeric" value={form.policyRefundDays} onChange={event => setForm({ ...form, policyRefundDays: event.target.value })} /></div></div><div className="space-y-2"><Label htmlFor="policySourceContract">V2 source contract (optional until deployed)</Label><Input id="policySourceContract" value={form.policySourceContract} onChange={event => setForm({ ...form, policySourceContract: event.target.value })} placeholder="0x… (leave empty while source deployment is pending)" className="font-mono" /></div>{attemptedSubmit && !v2PolicyValid && <p className="flex items-center gap-1.5 text-xs text-rose-100"><CircleAlert className="h-3.5 w-3.5" /> Use 1–512 confirmations, a 1–30 day acceptance window, and a refund window that is not shorter.</p>}</div>}
            </fieldset>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between gap-3"><Label htmlFor="description">Purchase-order description</Label><span className={`text-xs ${descriptionIsValid ? "text-teal-100" : "text-amber-100"}`}>{descriptionLength}/8 minimum</span></div>
              <Textarea id="description" value={form.description} onChange={event => { setForm({ ...form, description: event.target.value }); if (formError) setFormError(null); }} placeholder="Describe the goods, service, or settlement milestone." className="min-h-28" aria-invalid={attemptedSubmit && !descriptionIsValid} aria-describedby="description-help" required />
              <p id="description-help" className={`text-xs leading-5 ${descriptionIsValid ? "text-slate-500" : "text-amber-100/80"}`}>{descriptionIsValid ? "This description is hashed into the order terms commitment." : "Enter at least 8 characters. The exact description is bound into the source-event and escrow terms hash."}</p>
            </div>
            {formError && <div ref={errorSummaryRef} tabIndex={-1} role="alert" className="md:col-span-2 rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"><p className="flex items-center gap-2 font-semibold"><CircleAlert className="h-4 w-4" /> There is a problem with this draft.</p><p className="mt-1 text-rose-100/85">{formError}</p></div>}
            <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createDeal.isPending} className="min-h-11 bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">
                {createDeal.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ReceiptText className="mr-2 h-4 w-4" />}
                Create Draft
              </Button>
            </div>
          </form>
        </motion.section>
      )}
      </AnimatePresence>

      <section className="veri-register-surface rounded-[1.75rem] border border-white/10 bg-[#091216] p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="veri-kicker mb-2">Immutable order index</p>
            <h2 className="font-veri-display text-xl font-semibold text-white">Deal register</h2>
            <p className="mt-1 text-sm text-slate-400">Persisted orders. Open one to act.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-medium text-slate-300"><Activity className="h-3.5 w-3.5 text-teal-200" />{totals.total} total</span><DealCommandPalette deals={dealsQuery.data ?? []} statusFilter={statusFilter} onStatusFilter={setStatusFilter} onOpenDeal={(id) => setLocation(`/deals/${id}`)} /></div>
        </div>
        <div aria-label="Filter deals by status" className="mb-5 flex flex-wrap gap-2">
          {filters.map(filter => <button key={filter.id} type="button" onClick={() => setStatusFilter(filter.id)} aria-pressed={statusFilter === filter.id} className={`veri-action inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${statusFilter === filter.id ? "border-cyan-200/25 bg-cyan-300/10 text-cyan-50" : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"}`}><span>{filter.label}</span><span className="rounded-full bg-black/20 px-1.5 py-0.5 font-mono text-[10px]">{filter.count}</span></button>)}
          <span className="mx-1 h-6 w-px bg-white/10" aria-hidden="true" />
          {(["all", "v1", "v2"] as const).map(policy => <button key={policy} type="button" onClick={() => setPolicyFilter(policy)} aria-pressed={policyFilter === policy} className={`veri-action rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${policyFilter === policy ? "border-violet-200/30 bg-violet-300/10 text-violet-100" : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"}`}>{policy === "all" ? "All policies" : policy === "v1" ? "V1 live" : "V2 policies"}</button>)}
        </div>
        {dealsQuery.isLoading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-slate-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your deals</div>
        ) : dealsQuery.error ? (
          <div className="rounded-xl border border-rose-300/25 bg-rose-400/10 p-4 text-sm text-rose-100">{dealsQuery.error.message}</div>
        ) : visibleDeals.length ? (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="hidden grid-cols-[1.1fr_1fr_0.8fr_0.55fr] gap-5 border-b border-white/10 bg-white/[0.025] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid">
              <span>Order</span><span>Counterparty</span><span>Value</span><span>Status</span>
            </div>
            <div className="divide-y divide-white/8">
              {visibleDeals.map(deal => (
                <motion.button layout key={deal.orderId} onClick={() => setLocation(`/deals/${deal.orderId}`)} whileHover={{ x: 2 }} whileTap={{ scale: 0.995 }} transition={{ duration: 0.18, ease: "easeOut" }} className="veri-action group grid w-full gap-3 px-4 py-4 text-left hover:bg-cyan-300/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300 sm:px-5 md:grid-cols-[1.1fr_1fr_0.8fr_0.55fr] md:items-center md:gap-5">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-mono text-sm font-semibold text-cyan-100"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />{deal.orderId}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">Created {formatDate(deal.createdAt)}{deal.policyVersion === "v1_live" ? <span className="rounded-full border border-teal-200/15 bg-teal-300/[0.06] px-1.5 py-0.5 font-semibold uppercase tracking-[0.1em] text-teal-100">V1 live</span> : deal.policyVersion === "v2_deployed" ? <span className="rounded-full border border-violet-200/20 bg-violet-300/[0.08] px-1.5 py-0.5 font-semibold uppercase tracking-[0.1em] text-violet-100">V2 verified</span> : <span className="rounded-full border border-cyan-200/15 bg-cyan-300/[0.06] px-1.5 py-0.5 font-semibold uppercase tracking-[0.1em] text-cyan-100">V2 draft</span>}</span>
                  </span>
                  <span><span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 md:hidden">Seller</span><span className="font-mono text-sm text-slate-300">{shortAddress(deal.sellerAddress)}</span></span>
                  <span><span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 md:hidden">Escrow value</span><span className="text-sm font-semibold text-white">{formatTctcAmount(deal.amount)} <span className="text-slate-400">{deal.currency}</span></span></span>
                  <span className="flex items-center justify-between gap-3"><DealStatusBadge status={deal.status} /><span className="flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-cyan-100">Open <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span></span>
                </motion.button>
              ))}
            </div>
          </div>
        ) : dealsQuery.data?.length ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
            <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200"><Activity className="h-6 w-6" /></div>
            <h3 className="mt-4 font-display text-lg font-semibold text-white">No {statusFilter} deals</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Change the filter to review other orders.</p>
            <Button onClick={() => setStatusFilter("all")} variant="outline" className="veri-action mt-5 border-cyan-300/30 text-cyan-100 hover:bg-cyan-300/10">Show all deals</Button>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
            <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200"><ReceiptText className="h-6 w-6" /></div>
            <h3 className="mt-4 font-display text-lg font-semibold text-white">No purchase orders yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Create a draft to begin the receipt path.</p>
            <Button onClick={() => setShowCreateForm(true)} variant="outline" className="veri-action mt-5 border-cyan-300/30 text-cyan-100 hover:bg-cyan-300/10">Create first order</Button>
          </div>
        )}
      </section>
    </div>
  );
}
