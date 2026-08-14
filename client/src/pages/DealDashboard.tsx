import { DealStatusBadge } from "@/components/DealStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useTestnetWallet } from "@/hooks/useTestnetWallet";
import { VERISETTLE_CONTRACTS } from "@shared/contracts";
import { motion } from "framer-motion";
import { Activity, ArrowUpRight, FilePlus2, Loader2, Network, Plus, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

const initialForm = {
  buyerAddress: "",
  sellerAddress: "",
  amount: "",
  currency: "tCTC" as const,
  description: "",
};

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function DealDashboard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [form, setForm] = useState(initialForm);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const dealsQuery = trpc.deals.listDeals.useQuery();
  const { address: walletAddress, busy: walletBusy, connect } = useTestnetWallet();
  const createDeal = trpc.deals.createDeal.useMutation({
    onSuccess: data => {
      utils.deals.listDeals.invalidate();
      setLocation(`/deals/${data.deal.orderId}`);
    },
    onError: error => setFormError(error.message),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    createDeal.mutate(form);
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

  const totals = dealsQuery.data?.reduce(
    (summary, deal) => {
      summary.total += 1;
      if (deal.status === "released") summary.released += 1;
      if (["funded", "proof_pending"].includes(deal.status)) summary.active += 1;
      return summary;
    },
    { total: 0, active: 0, released: 0 }
  ) ?? { total: 0, active: 0, released: 0 };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      <section className="relative overflow-hidden rounded-[1.9rem] border border-cyan-100/10 bg-[#0a1b21] px-5 py-7 shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute right-20 top-0 h-full w-px bg-gradient-to-b from-transparent via-teal-300/25 to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/75">
              <ShieldCheck className="h-4 w-4" />
              Authenticated settlement workspace
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Your settlement command center.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Create a testnet order, fund escrow on Creditcoin, then use a verified Ethereum Sepolia event to govern its settlement path.
            </p>
          </div>
          <div className="flex flex-wrap gap-3"><Button size="lg" onClick={connectWallet} disabled={walletBusy} variant="outline" className="border-cyan-100/20 bg-white/[0.035] font-semibold text-cyan-50 hover:bg-cyan-300/10"><WalletCards className="mr-2 h-4 w-4" />{walletBusy ? "Connecting…" : walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "Connect wallet"}</Button><Button size="lg" onClick={() => setShowCreateForm(open => !open)} className="group bg-gradient-to-r from-teal-300 to-cyan-300 font-semibold text-slate-950 shadow-[0_0_28px_rgba(45,212,191,0.22)] hover:from-teal-200 hover:to-cyan-200"><Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />{showCreateForm ? "Close form" : "Create purchase order"}</Button></div>
        </div>
        <div className="relative mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-[#061014]/65 p-4"><p className="text-xs uppercase tracking-[0.13em] text-slate-500">Active deals</p><p className="mt-2 font-display text-3xl font-semibold text-white">{totals.active}</p><p className="mt-1 text-xs text-teal-100">Awaiting proof or settlement</p></div><div className="rounded-2xl border border-white/10 bg-[#061014]/65 p-4"><p className="text-xs uppercase tracking-[0.13em] text-slate-500">Released</p><p className="mt-2 font-display text-3xl font-semibold text-white">{totals.released}</p><p className="mt-1 text-xs text-cyan-100">Receipt-proven settlements</p></div><div className="rounded-2xl border border-white/10 bg-[#061014]/65 p-4"><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.13em] text-slate-500">Proof rail</p><Network className="h-4 w-4 text-cyan-200" /></div><p className="mt-2 font-display text-sm font-semibold text-white">Sepolia → CC3</p><p className="mt-1 truncate font-mono text-[11px] text-slate-500">{VERISETTLE_CONTRACTS.escrowAsc}</p></div></div>
      </section>

      {showCreateForm && (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="rounded-[1.5rem] border border-white/10 bg-[#0a1519] p-5 sm:p-7"
        >
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-cyan-300/10 p-2.5 text-cyan-200"><FilePlus2 className="h-5 w-5" /></div>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">New purchase order</h2>
              <p className="mt-1 text-sm text-slate-400">Create a signed-ready policy. The next screen guides every real testnet action from funding to proof submission.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buyerAddress">Buyer address</Label>
              <div className="flex gap-2"><Input id="buyerAddress" value={form.buyerAddress} onChange={event => setForm({ ...form, buyerAddress: event.target.value })} placeholder="0x…" required /><Button type="button" onClick={connectWallet} disabled={walletBusy} variant="outline" className="shrink-0 border-cyan-100/20 text-cyan-100 hover:bg-cyan-300/10">Use wallet</Button></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellerAddress">Seller address</Label>
              <Input id="sellerAddress" value={form.sellerAddress} onChange={event => setForm({ ...form, sellerAddress: event.target.value })} placeholder="0x…" required />
            </div>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Asset amount</Label>
                <Input id="amount" inputMode="decimal" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} placeholder="2,500.00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Asset</Label>
                <Input id="currency" value={form.currency} readOnly aria-readonly="true" className="text-slate-400" />
              </div>
            </div>
            <div className="rounded-xl border border-cyan-100/10 bg-cyan-300/[0.035] px-4 py-3 text-sm leading-6 text-slate-300">
              <span className="font-semibold text-cyan-100">Proof policy:</span> only a receipt-success `OrderAccepted` event for these exact terms can enter the Attestcoin verification path.
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Purchase-order description</Label>
              <Textarea id="description" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Describe the goods, service, or settlement milestone." className="min-h-28" required />
            </div>
            {formError && <p className="md:col-span-2 rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{formError}</p>}
            <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createDeal.isPending} className="bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">
                {createDeal.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ReceiptText className="mr-2 h-4 w-4" />}
                Create Draft
              </Button>
            </div>
          </form>
        </motion.section>
      )}

      <section className="rounded-[1.5rem] border border-white/10 bg-[#091216] p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">Deal register</h2>
            <p className="mt-1 text-sm text-slate-400">Each row is a persisted purchase order; follow its guided detail view for every wallet and proof action.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-medium text-slate-300"><Activity className="h-3.5 w-3.5 text-teal-200" />{totals.total} total</span>
        </div>
        {dealsQuery.isLoading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-slate-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your deals</div>
        ) : dealsQuery.error ? (
          <div className="rounded-xl border border-rose-300/25 bg-rose-400/10 p-4 text-sm text-rose-100">{dealsQuery.error.message}</div>
        ) : dealsQuery.data?.length ? (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="hidden grid-cols-[1.1fr_1fr_0.8fr_0.55fr] gap-5 border-b border-white/10 bg-white/[0.025] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid">
              <span>Order</span><span>Counterparty</span><span>Value</span><span>Status</span>
            </div>
            <div className="divide-y divide-white/8">
              {dealsQuery.data.map(deal => (
                <button key={deal.orderId} onClick={() => setLocation(`/deals/${deal.orderId}`)} className="group grid w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-cyan-300/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300 sm:px-5 md:grid-cols-[1.1fr_1fr_0.8fr_0.55fr] md:items-center md:gap-5">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-mono text-sm font-semibold text-cyan-100"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />{deal.orderId}</span>
                    <span className="mt-1 block text-xs text-slate-500">Created {formatDate(deal.createdAt)}</span>
                  </span>
                  <span className="font-mono text-sm text-slate-300">{shortAddress(deal.sellerAddress)}</span>
                  <span className="text-sm font-semibold text-white">{deal.amount} <span className="text-slate-400">{deal.currency}</span></span>
                  <span className="flex items-center justify-between gap-3"><DealStatusBadge status={deal.status} /><ArrowUpRight className="h-4 w-4 text-slate-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
            <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200"><ReceiptText className="h-6 w-6" /></div>
            <h3 className="mt-4 font-display text-lg font-semibold text-white">No purchase orders yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Start with a draft order. You will fund it, submit a source transaction, and demonstrate the proof boundary from its detail page.</p>
            <Button onClick={() => setShowCreateForm(true)} variant="outline" className="mt-5 border-cyan-300/30 text-cyan-100 hover:bg-cyan-300/10">Create first order</Button>
          </div>
        )}
      </section>
    </div>
  );
}
