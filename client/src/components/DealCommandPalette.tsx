import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { DealStatusBadge } from "@/components/DealStatusBadge";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

export type DealPaletteItem = {
  orderId: string;
  status: "draft" | "funded" | "proof_pending" | "released" | "refunded" | "disputed";
  description: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: string;
  currency: string;
};

type DealFilter = "all" | "active" | "released";

function compactAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function DealCommandPalette({
  deals,
  statusFilter,
  onStatusFilter,
  onOpenDeal,
}: {
  deals: DealPaletteItem[];
  statusFilter: DealFilter;
  onStatusFilter: (filter: DealFilter) => void;
  onOpenDeal: (orderId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      event.preventDefault();
      setOpen(current => !current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const chooseFilter = (filter: DealFilter) => {
    onStatusFilter(filter);
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="veri-action inline-flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-[#061014]/55 px-3 py-2 text-sm font-semibold text-cyan-50 hover:bg-cyan-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
        <Search className="h-4 w-4 text-cyan-200" /> Find deal <kbd className="hidden rounded border border-white/10 bg-black/20 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Find a deal" description="Search your persisted purchase orders and filter the register." className="border border-cyan-200/15 bg-[#081417] text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.55)] sm:max-w-xl">
        <CommandInput placeholder="Search order, party, description, amount, or status…" />
        <CommandList className="max-h-[min(420px,60vh)]">
          <CommandEmpty className="text-slate-400">No matching persisted deals.</CommandEmpty>
          <CommandGroup heading="Register filters">
            {(["all", "active", "released"] as const).map(filter => <CommandItem key={filter} value={`filter ${filter}`} onSelect={() => chooseFilter(filter)} className="text-slate-200 data-[selected=true]:bg-cyan-300/10 data-[selected=true]:text-cyan-50"><SlidersHorizontal className="h-4 w-4 text-cyan-200" /><span className="capitalize">{filter} deals</span>{statusFilter === filter && <span className="ml-auto text-[11px] font-semibold text-teal-100">Current</span>}</CommandItem>)}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Persisted purchase orders">
            {deals.map(deal => <CommandItem key={deal.orderId} value={[deal.orderId, deal.description, deal.buyerAddress, deal.sellerAddress, deal.amount, deal.currency, deal.status].join(" ")} onSelect={() => { onOpenDeal(deal.orderId); setOpen(false); }} className="items-start py-3 text-slate-200 data-[selected=true]:bg-cyan-300/10 data-[selected=true]:text-cyan-50"><Search className="mt-0.5 h-4 w-4 text-cyan-200" /><span className="min-w-0"><span className="flex items-center gap-2"><span className="font-mono text-xs font-semibold text-cyan-100">{deal.orderId}</span><DealStatusBadge status={deal.status} /></span><span className="mt-1 block truncate text-xs text-slate-400">{deal.description}</span><span className="mt-1 block font-mono text-[11px] text-slate-500">{compactAddress(deal.buyerAddress)} → {compactAddress(deal.sellerAddress)} · {deal.amount} {deal.currency}</span></span><CommandShortcut>Open</CommandShortcut></CommandItem>)}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
