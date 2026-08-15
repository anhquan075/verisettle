import { BrowserProvider, Contract, getAddress, keccak256, parseUnits, toUtf8Bytes } from "ethers";
import { useCallback, useState } from "react";
import { escrowAbi, sourceAbi, TESTNET_NETWORKS, toOrderKey, toTermsHash, VERISETTLE_CONTRACTS } from "@shared/contracts";
import { V2_GOVERNED_POLICY_MANIFEST, V2_POLICY_MANIFEST, v2EscrowAbi, v2SourceAbi } from "@shared/v2PolicyManifest";

type Eip1193Provider = {
  request: (request: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type DealTerms = {
  orderId: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: string;
  currency: string;
  description: string;
  policyVersion?: "v1_live" | "v2_deployed" | "v2_governed" | "v2_draft";
  termsCommitmentHash?: string | null;
  acceptanceExpiresAt?: Date | string | null;
};

type AttestcoinProof = {
  chainKey: number;
  headerNumber: number;
  txBytes: string;
  merkleProof: { root: string; siblings: Array<{ hash: string; isLeft: boolean }> };
  continuityProof: { lowerEndpointDigest: string; roots: string[] };
};

function injectedProvider() {
  const ethereum = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
  if (!ethereum) throw new Error("No injected EVM wallet was found. Install an EIP-1193 compatible wallet and import only a testnet account.");
  return ethereum;
}

async function signerFor(network: keyof typeof TESTNET_NETWORKS) {
  const ethereum = injectedProvider();
  const target = TESTNET_NETWORKS[network];
  await ethereum.request({ method: "eth_requestAccounts" });
  const currentChainId = await ethereum.request({ method: "eth_chainId" });
  if (currentChainId !== target.chainIdHex) {
    try {
      await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: target.chainIdHex }] });
    } catch {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: target.chainIdHex,
            chainName: network === "creditcoin" ? "Creditcoin CC3 Testnet" : "Ethereum Sepolia",
            nativeCurrency: { name: network === "creditcoin" ? "Creditcoin Testnet" : "Sepolia Ether", symbol: network === "creditcoin" ? "tCTC" : "ETH", decimals: 18 },
            rpcUrls: [target.rpcUrl],
            blockExplorerUrls: [target.explorerUrl],
          },
        ],
      });
    }
  }
  const provider = new BrowserProvider(ethereum);
  return provider.getSigner();
}

function assertBuyer(signerAddress: string, terms: DealTerms) {
  if (getAddress(signerAddress) !== getAddress(terms.buyerAddress)) {
    throw new Error("The connected wallet must match the buyer address recorded on this purchase order.");
  }
}

function proofArgs(proof: AttestcoinProof) {
  return [
    proof.chainKey,
    proof.headerNumber,
    proof.txBytes,
    proof.merkleProof.root,
    proof.merkleProof.siblings,
    proof.continuityProof.lowerEndpointDigest,
    proof.continuityProof.roots,
  ] as const;
}

function isManifestV2(terms: DealTerms) {
  return terms.policyVersion === "v2_deployed" || terms.policyVersion === "v2_governed";
}

function manifestFor(terms: DealTerms) {
  return terms.policyVersion === "v2_governed" ? V2_GOVERNED_POLICY_MANIFEST : V2_POLICY_MANIFEST;
}

function v2Commitment(terms: DealTerms) {
  if (!terms.termsCommitmentHash) throw new Error("This V2 deal is missing its committed policy terms.");
  return terms.termsCommitmentHash;
}

function v2AcceptanceExpiry(terms: DealTerms) {
  if (!terms.acceptanceExpiresAt) throw new Error("This V2 deal is missing its acceptance expiry.");
  const seconds = Math.floor(new Date(terms.acceptanceExpiresAt).getTime() / 1000);
  if (!Number.isFinite(seconds) || seconds <= Math.floor(Date.now() / 1000)) {
    throw new Error("This V2 acceptance window has expired. Create a fresh order under the verified policy.");
  }
  return seconds;
}

export function useTestnetWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const connect = useCallback(async () => {
    setBusy(true);
    try {
      const signer = await signerFor("creditcoin");
      const connectedAddress = await signer.getAddress();
      setAddress(connectedAddress);
      return connectedAddress;
    } finally {
      setBusy(false);
    }
  }, []);

  const fundEscrow = useCallback(async (terms: DealTerms) => {
    setBusy(true);
    try {
      const signer = await signerFor("creditcoin");
      assertBuyer(await signer.getAddress(), terms);
      const isV2 = isManifestV2(terms);
      const escrow = new Contract(isV2 ? manifestFor(terms).escrowAsc.address : VERISETTLE_CONTRACTS.escrowAsc, isV2 ? v2EscrowAbi : escrowAbi, signer);
      const commitment = isV2 ? v2Commitment(terms) : toTermsHash(terms);
      const deadline = isV2 ? v2AcceptanceExpiry(terms) : Math.floor(Date.now() / 1000) + 86_400;
      const transaction = await escrow.fundEscrow(toOrderKey(terms.orderId), terms.sellerAddress, commitment, deadline, {
        value: parseUnits(terms.amount, 18),
      });
      await transaction.wait();
      return transaction.hash as string;
    } finally {
      setBusy(false);
    }
  }, []);

  const acceptSourceOrder = useCallback(async (terms: DealTerms) => {
    setBusy(true);
    try {
      const signer = await signerFor("sepolia");
      assertBuyer(await signer.getAddress(), terms);
      const isV2 = isManifestV2(terms);
      const source = new Contract(isV2 ? manifestFor(terms).source.address : VERISETTLE_CONTRACTS.source, isV2 ? v2SourceAbi : sourceAbi, signer);
      const transaction = isV2
        ? await source.acceptOrder(toOrderKey(terms.orderId), terms.sellerAddress, v2Commitment(terms), v2AcceptanceExpiry(terms))
        : await source.acceptOrder(toOrderKey(terms.orderId), terms.sellerAddress, toTermsHash(terms));
      await transaction.wait();
      return transaction.hash as string;
    } finally {
      setBusy(false);
    }
  }, []);

  const submitProof = useCallback(async (proof: AttestcoinProof, policyVersion: DealTerms["policyVersion"] = "v1_live") => {
    setBusy(true);
    try {
      const signer = await signerFor("creditcoin");
      const isV2 = policyVersion === "v2_deployed" || policyVersion === "v2_governed";
      const manifest = policyVersion === "v2_governed" ? V2_GOVERNED_POLICY_MANIFEST : V2_POLICY_MANIFEST;
      const escrow = new Contract(isV2 ? manifest.escrowAsc.address : VERISETTLE_CONTRACTS.escrowAsc, isV2 ? v2EscrowAbi : escrowAbi, signer);
      const transaction = await escrow.submitAcceptanceProof(...proofArgs(proof));
      await transaction.wait();
      return transaction.hash as string;
    } finally {
      setBusy(false);
    }
  }, []);

  const refundEscrow = useCallback(async (terms: DealTerms) => {
    setBusy(true);
    try {
      const signer = await signerFor("creditcoin");
      assertBuyer(await signer.getAddress(), terms);
      const escrow = new Contract(isManifestV2(terms) ? manifestFor(terms).escrowAsc.address : VERISETTLE_CONTRACTS.escrowAsc, isManifestV2(terms) ? v2EscrowAbi : escrowAbi, signer);
      const transaction = await escrow.refundExpiredEscrow(toOrderKey(terms.orderId));
      await transaction.wait();
      return transaction.hash as string;
    } finally {
      setBusy(false);
    }
  }, []);

  const raiseDispute = useCallback(async (terms: DealTerms, reason: string) => {
    setBusy(true);
    try {
      const signer = await signerFor("creditcoin");
      const signerAddress = await signer.getAddress();
      const buyer = getAddress(terms.buyerAddress);
      const seller = getAddress(terms.sellerAddress);
      if (getAddress(signerAddress) !== buyer && getAddress(signerAddress) !== seller) {
        throw new Error("Only the recorded buyer or seller wallet can raise this dispute.");
      }
      const escrow = new Contract(isManifestV2(terms) ? manifestFor(terms).escrowAsc.address : VERISETTLE_CONTRACTS.escrowAsc, isManifestV2(terms) ? v2EscrowAbi : escrowAbi, signer);
      const transaction = await escrow.raiseDispute(toOrderKey(terms.orderId), keccak256(toUtf8Bytes(reason.trim())));
      await transaction.wait();
      return transaction.hash as string;
    } finally {
      setBusy(false);
    }
  }, []);

  const replayProof = useCallback(async (proof: AttestcoinProof, policyVersion: DealTerms["policyVersion"] = "v1_live") => {
    setBusy(true);
    try {
      const signer = await signerFor("creditcoin");
      const isV2 = policyVersion === "v2_deployed" || policyVersion === "v2_governed";
      const manifest = policyVersion === "v2_governed" ? V2_GOVERNED_POLICY_MANIFEST : V2_POLICY_MANIFEST;
      const escrow = new Contract(isV2 ? manifest.escrowAsc.address : VERISETTLE_CONTRACTS.escrowAsc, isV2 ? v2EscrowAbi : escrowAbi, signer);
      try {
        const transaction = await escrow.submitAcceptanceProof(...proofArgs(proof));
        await transaction.wait();
        throw new Error("Replay unexpectedly succeeded.");
      } catch (error) {
        const payload = (error as { data?: string; info?: { error?: { data?: string } } }).data ?? (error as { info?: { error?: { data?: string } } }).info?.error?.data ?? "0x";
        const parsed = escrow.interface.parseError(payload);
        if (parsed?.name !== "QueryAlreadyProcessed") throw error;
        return "QueryAlreadyProcessed";
      }
    } finally {
      setBusy(false);
    }
  }, []);

  return { address, busy, connect, fundEscrow, acceptSourceOrder, submitProof, refundEscrow, raiseDispute, replayProof };
}
