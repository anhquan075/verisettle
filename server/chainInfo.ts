import { JsonRpcProvider } from "ethers";
import { chainInfo as chainInfoSdk } from "@gluwa/usc-sdk";
import { TESTNET_NETWORKS, VERISETTLE_CONTRACTS } from "../shared/contracts";
import {
  ATTESTCOIN_PROVER_URL,
  CHAIN_INFO_PRECOMPILE_ADDRESS,
  type AttestationReadiness,
} from "../shared/chainInfo";

const creditcoinProvider = new JsonRpcProvider(TESTNET_NETWORKS.creditcoin.rpcUrl);
const sepoliaProvider = new JsonRpcProvider(TESTNET_NETWORKS.sepolia.rpcUrl);

export function createChainInfoProvider(rpc: JsonRpcProvider = creditcoinProvider) {
  return new chainInfoSdk.PrecompileChainInfoProvider(rpc, CHAIN_INFO_PRECOMPILE_ADDRESS);
}

export async function resolveSourceChainKey(preferredKey = VERISETTLE_CONTRACTS.sourceChainKey) {
  try {
    const provider = createChainInfoProvider();
    const supported = await provider.getSupportedChainByKey(preferredKey);
    return supported?.chainKey ?? preferredKey;
  } catch {
    return preferredKey;
  }
}

export async function readLatestSourceAttestation(preferredKey = VERISETTLE_CONTRACTS.sourceChainKey) {
  const provider = createChainInfoProvider();
  const chainKey = await resolveSourceChainKey(preferredKey);
  const [chain, latest] = await Promise.all([
    provider.getSupportedChainByKey(chainKey).catch(() => null),
    provider.getLatestAttestedHeightAndHash(chainKey),
  ]);
  return {
    chainKey,
    chainId: chain?.chainId ?? null,
    chainName: chain?.chainName ?? null,
    latest,
  };
}

export async function getSourceAttestationReadiness(sourceTxHash: string): Promise<AttestationReadiness> {
  try {
    const receipt = await sepoliaProvider.getTransactionReceipt(sourceTxHash);
    if (!receipt) {
      return {
        status: "unknown",
        chainKey: VERISETTLE_CONTRACTS.sourceChainKey,
        chainId: TESTNET_NETWORKS.sepolia.chainId,
        chainName: "Ethereum Sepolia",
        sourceBlockNumber: null,
        attestedHeight: null,
        attestedHash: null,
        message: "Source transaction has not been mined yet.",
      };
    }

    const attestation = await readLatestSourceAttestation();
    const attested = attestation.latest.exists && attestation.latest.height >= Number(receipt.blockNumber);
    return {
      status: attested ? "attested" : "waiting",
      chainKey: attestation.chainKey,
      chainId: attestation.chainId,
      chainName: attestation.chainName,
      sourceBlockNumber: Number(receipt.blockNumber),
      attestedHeight: attestation.latest.exists ? attestation.latest.height : null,
      attestedHash: attestation.latest.exists ? attestation.latest.hash : null,
      message: attested
        ? "ChainInfo reports the source height is attested. ProofBuilder can proceed."
        : `Waiting for Attestcoin. Source block ${receipt.blockNumber}; latest attested height ${attestation.latest.exists ? attestation.latest.height : "none"}.`,
    };
  } catch (error) {
    return {
      status: "unavailable",
      chainKey: VERISETTLE_CONTRACTS.sourceChainKey,
      chainId: TESTNET_NETWORKS.sepolia.chainId,
      chainName: "Ethereum Sepolia",
      sourceBlockNumber: null,
      attestedHeight: null,
      attestedHash: null,
      message: error instanceof Error ? error.message : "ChainInfo precompile read failed.",
    };
  }
}

export { ATTESTCOIN_PROVER_URL, CHAIN_INFO_PRECOMPILE_ADDRESS };
