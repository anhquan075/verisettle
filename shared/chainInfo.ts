export const CHAIN_INFO_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000FD3";
export const ATTESTCOIN_PROVER_URL = "https://prover.cc3-testnet.creditcoin.network/";

export type AttestationReadinessStatus = "waiting" | "attested" | "unavailable" | "unknown";

export type AttestationReadiness = {
  status: AttestationReadinessStatus;
  chainKey: number;
  chainId: number | null;
  chainName: string | null;
  sourceBlockNumber: number | null;
  attestedHeight: number | null;
  attestedHash: string | null;
  message: string;
};

export function describeAttestationReadiness(readiness: AttestationReadiness) {
  if (readiness.status === "attested") {
    return `ChainInfo 0xFD3 reports height ${readiness.attestedHeight} attested (source block ${readiness.sourceBlockNumber}).`;
  }
  if (readiness.status === "waiting") {
    return `Waiting for Attestcoin. Source block ${readiness.sourceBlockNumber ?? "pending"}; latest attested height ${readiness.attestedHeight ?? "none"}.`;
  }
  if (readiness.status === "unknown") {
    return readiness.message || "Source transaction has not been mined yet.";
  }
  return readiness.message || "ChainInfo precompile is currently unavailable.";
}
