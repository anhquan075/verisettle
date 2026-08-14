import { ExternalLink } from "lucide-react";

export function ExplorerLink({
  hash,
  chain,
  className = "",
}: {
  hash: string;
  chain: "creditcoin" | "sepolia";
  className?: string;
}) {
  const href =
    chain === "creditcoin"
      ? `https://creditcoin-testnet.blockscout.com/tx/${hash}`
      : `https://sepolia.etherscan.io/tx/${hash}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-cyan-200 transition-colors hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071216] ${className}`}
    >
      <span className="truncate font-mono">{hash.slice(0, 10)}…{hash.slice(-8)}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}
