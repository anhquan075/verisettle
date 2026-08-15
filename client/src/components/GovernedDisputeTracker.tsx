import { TESTNET_NETWORKS, toOrderKey } from "@shared/contracts";
import { V2_GOVERNED_POLICY_MANIFEST, v2GovernanceAbi } from "@shared/v2PolicyManifest";
import { Contract, JsonRpcProvider } from "ethers";
import { CheckCircle2, CircleDashed, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

type Candidate = {
  releaseToSeller: boolean;
  actionHash: string;
  approvals: number;
  executed: boolean;
  approvedBy: boolean[];
};

type Progress = {
  nonce: number;
  threshold: number;
  candidates: Candidate[];
};

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function GovernedDisputeTracker({ orderId, active }: { orderId: string; active: boolean }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let mounted = true;
    const load = async () => {
      try {
        const provider = new JsonRpcProvider(TESTNET_NETWORKS.creditcoin.rpcUrl);
        const governance = new Contract(V2_GOVERNED_POLICY_MANIFEST.governance.address, v2GovernanceAbi, provider);
        const nonce = Number(await governance.nextNonce());
        const orderKey = toOrderKey(orderId);
        const candidates = await Promise.all([true, false].map(async releaseToSeller => {
          const actionHash = await governance.disputeResolutionActionHash(V2_GOVERNED_POLICY_MANIFEST.escrowAsc.address, orderKey, releaseToSeller, nonce);
          const [approvalCount, executed, ...approvedBy] = await Promise.all([
            governance.approvalCount(actionHash),
            governance.executed(actionHash),
            ...V2_GOVERNED_POLICY_MANIFEST.governance.signers.map(signer => governance.approvedBy(actionHash, signer)),
          ]);
          return { releaseToSeller, actionHash, approvals: Number(approvalCount), executed, approvedBy };
        }));
        if (mounted) setProgress({ nonce, threshold: V2_GOVERNED_POLICY_MANIFEST.governance.threshold, candidates });
      } catch {
        if (mounted) setError("Unable to read the current multisig approval state from public CC3 RPC.");
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 12_000);
    return () => { mounted = false; window.clearInterval(interval); };
  }, [active, orderId]);

  if (!active) return null;
  const activeCandidate = progress?.candidates.find(candidate => candidate.approvals > 0 || candidate.executed);
  const approvalCount = activeCandidate?.approvals ?? 0;
  const outcome = activeCandidate ? activeCandidate.releaseToSeller ? "Release to seller" : "Refund buyer" : "No resolution proposed";

  return <section aria-label="Governed dispute approval tracker" className="rounded-[1.5rem] border border-fuchsia-200/20 bg-fuchsia-300/[0.055] p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-fuchsia-300/12 p-2.5 text-fuchsia-100"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-fuchsia-100/80">Governed dispute / public CC3 state</p><h2 className="mt-2 font-display text-xl font-semibold text-white">2-of-3 signature progress</h2><p className="mt-1 text-sm leading-6 text-slate-300">Only the pinned multisig can resolve this disputed escrow. This panel refreshes from public RPC every 12 seconds.</p></div></div>
      <span className="rounded-full border border-fuchsia-100/20 bg-fuchsia-300/10 px-3 py-1 text-xs font-semibold text-fuchsia-100">{progress ? `${approvalCount}/${progress.threshold} approvals` : "Loading approvals"}</span>
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-amber-100">{error}</p>}
    {!progress && !error && <div className="mt-5 flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Reading multisig action state</div>}
    {progress && <>
      <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Proposed outcome</p><p className="mt-2 text-sm font-semibold text-white">{outcome}</p><p className="mt-1 text-xs text-slate-400">{activeCandidate ? `Nonce ${progress.nonce} is bound to this outcome.` : "No signer has proposed an outcome."}</p></div><div className="rounded-xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Threshold</p><p className="mt-2 text-sm font-semibold text-white">{progress.threshold} of {V2_GOVERNED_POLICY_MANIFEST.governance.signerCount} independent signers</p><p className="mt-1 text-xs text-slate-400">A single signer cannot move funds.</p></div><div className="rounded-xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Execution</p><p className="mt-2 text-sm font-semibold text-white">{activeCandidate?.executed ? "Resolved on-chain" : "Awaiting threshold"}</p><p className="mt-1 text-xs text-slate-400">Action hash is chain, escrow, order, outcome, and nonce bound.</p></div></div>
      <div className="mt-5 overflow-hidden rounded-xl border border-white/10"><div className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Signer approval timeline</div><ol className="divide-y divide-white/10">{V2_GOVERNED_POLICY_MANIFEST.governance.signers.map((signer, index) => { const approved = activeCandidate?.approvedBy[index] ?? false; return <li key={signer} className="flex items-center justify-between gap-3 px-4 py-3"><div className="flex min-w-0 items-center gap-3">{approved ? <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-200" /> : <CircleDashed className="h-4 w-4 shrink-0 text-slate-500" />}<div><p className="text-sm font-medium text-white">Signer {index + 1} · <span className="font-mono text-xs text-slate-300">{shortAddress(signer)}</span></p><p className="mt-0.5 text-xs text-slate-500">{approved ? "Approval recorded for the current bound action." : "No approval recorded for the proposed current action."}</p></div></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${approved ? "bg-teal-300/10 text-teal-100" : "bg-white/[0.05] text-slate-500"}`}>{approved ? "Approved" : "Awaiting"}</span></li>; })}</ol></div>
    </>}
  </section>;
}
