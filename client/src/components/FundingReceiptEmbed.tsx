import { Check, ExternalLink, ReceiptText, ShieldCheck } from "lucide-react";

type FundingReceiptEmbedProps = {
  cc3TxHash?: string | null;
  sepoliaTxHash?: string | null;
};

type ReceiptCardProps = {
  amount: string;
  explorerLabel: string;
  href: string;
  network: string;
  txHash?: string | null;
};

function ReceiptCard({ amount, explorerLabel, href, network, txHash }: ReceiptCardProps) {
  if (!txHash) return null;

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100">{network}</p>
          <p className="mt-2 text-lg font-semibold text-white">{amount}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-teal-200/20 bg-teal-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-teal-100"><Check className="h-3 w-3" /> Confirmed</span>
      </div>
      <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.025] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Transaction hash</p>
        <p className="mt-1 break-all font-mono text-[11px] leading-5 text-cyan-100">{txHash}</p>
      </div>
      <a href={href} target="_blank" rel="noreferrer" className="veri-action mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-100 hover:text-cyan-50">Open live in {explorerLabel}<ExternalLink className="h-3.5 w-3.5" /></a>
    </article>
  );
}

export function FundingReceiptEmbed({ cc3TxHash, sepoliaTxHash }: FundingReceiptEmbedProps) {
  if (!cc3TxHash && !sepoliaTxHash) return null;

  return (
    <section aria-label="Embedded testnet funding receipts" className="mt-5 rounded-2xl border border-teal-200/20 bg-teal-300/[0.045] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-300 text-slate-950"><ReceiptText className="h-5 w-5" /></span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-100">Saved wallet state</p>
          <h3 className="mt-1 text-base font-semibold text-white">Your verified testnet receipts are ready.</h3>
          <p className="mt-1 text-xs leading-5 text-slate-300">These receipt records are restored from the verified wallet-linked claim whenever you return with the same signed wallet session.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ReceiptCard network="Creditcoin CC3" amount="0.005 tCTC" explorerLabel="Blockscout" href={`https://creditcoin-testnet.blockscout.com/tx/${cc3TxHash}`} txHash={cc3TxHash} />
        <ReceiptCard network="Ethereum Sepolia" amount="0.001 ETH" explorerLabel="Etherscan" href={`https://sepolia.etherscan.io/tx/${sepoliaTxHash}`} txHash={sepoliaTxHash} />
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-200" />The explorer pages open in a new tab because their public security policy disallows third-party page frames. The verified transaction identifiers and receipt context remain embedded here.</p>
    </section>
  );
}
