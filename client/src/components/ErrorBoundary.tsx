import { AlertTriangle, RotateCcw, ShieldCheck } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }

  render() {
    if (this.state.hasError) {
      return <main className="veri-shell grid min-h-screen place-items-center px-5 py-10 text-white"><section role="alert" className="w-full max-w-xl rounded-[2rem] border border-rose-300/20 bg-[#09161a]/90 p-7 shadow-[0_28px_100px_rgba(0,0,0,0.42)] sm:p-10"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-rose-300/20 bg-rose-400/10 text-rose-100"><AlertTriangle className="h-6 w-6" aria-hidden="true" /></div><p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-rose-100/80">Workspace recovery</p><h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">The workspace needs a clean reload.</h1><p className="mt-4 text-sm leading-7 text-slate-300">No on-chain action was sent by this screen. Reload to restore the most recent receipt-backed state.</p><div className="mt-6 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs leading-5 text-slate-400"><ShieldCheck className="mr-2 inline h-3.5 w-3.5 text-teal-200" aria-hidden="true" /> If an action was already submitted, use its receipt in the deal recovery flow after reload.</div><button onClick={() => window.location.reload()} className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-gradient-to-r from-teal-300 to-cyan-300 px-4 text-sm font-semibold text-slate-950 transition-transform active:scale-[0.98] hover:from-teal-200 hover:to-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><RotateCcw className="mr-2 h-4 w-4" /> Reload workspace</button></section></main>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
