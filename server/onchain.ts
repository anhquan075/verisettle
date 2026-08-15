import { Contract, Interface, JsonRpcProvider, getAddress, keccak256, parseUnits } from "ethers";
import { escrowAbi, sourceAbi, TESTNET_NETWORKS, toOrderKey, toTermsHash, VERISETTLE_CONTRACTS } from "../shared/contracts";
import { V2_GOVERNED_POLICY_MANIFEST, V2_POLICY_MANIFEST, v2EscrowAbi, v2GovernanceAbi, v2SourceAbi } from "../shared/v2PolicyManifest";
import type { DealPolicyVersion } from "../shared/settlementPolicy";

const sepoliaProvider = new JsonRpcProvider(TESTNET_NETWORKS.sepolia.rpcUrl);
const creditcoinProvider = new JsonRpcProvider(TESTNET_NETWORKS.creditcoin.rpcUrl);
const sourceInterface = new Interface(sourceAbi);
const escrowInterface = new Interface(escrowAbi);
const v2SourceInterface = new Interface(v2SourceAbi);
const v2EscrowInterface = new Interface(v2EscrowAbi);

type DealTerms = {
  orderId: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: string;
  currency: string;
  description: string;
  policyVersion?: DealPolicyVersion;
  policyHash?: string | null;
  termsCommitmentHash?: string | null;
  policySourceContract?: string | null;
  acceptanceExpiresAt?: Date | null;
  minimumSourceConfirmations?: number | null;
  refundWindowSeconds?: number | null;
};

function isV2(terms: DealTerms) {
  return terms.policyVersion === "v2_deployed" || terms.policyVersion === "v2_governed";
}

function v2ManifestFor(terms: DealTerms) {
  return terms.policyVersion === "v2_governed" ? V2_GOVERNED_POLICY_MANIFEST : V2_POLICY_MANIFEST;
}

function expectedTerms(terms: DealTerms) {
  return {
    orderKey: toOrderKey(terms.orderId),
    termsHash: toTermsHash(terms),
    buyerAddress: getAddress(terms.buyerAddress),
    sellerAddress: getAddress(terms.sellerAddress),
  };
}

function expectedV2Terms(terms: DealTerms) {
  const manifest = v2ManifestFor(terms);
  if (!terms.policyHash || !terms.termsCommitmentHash || !terms.acceptanceExpiresAt || !terms.policySourceContract) {
    throw new Error("V2 policy record is missing a required immutable commitment field.");
  }
  if (
    terms.policyHash !== manifest.policyHash ||
    getAddress(terms.policySourceContract) !== getAddress(manifest.source.address) ||
    terms.minimumSourceConfirmations !== manifest.policy.minimumSourceConfirmations ||
    terms.refundWindowSeconds !== manifest.policy.refundWindowSeconds
  ) throw new Error("V2 policy record does not match the verified deployment manifest.");
  return {
    orderKey: toOrderKey(terms.orderId),
    termsCommitmentHash: terms.termsCommitmentHash,
    policyHash: terms.policyHash,
    buyerAddress: getAddress(terms.buyerAddress),
    sellerAddress: getAddress(terms.sellerAddress),
    acceptanceExpiresAt: BigInt(Math.floor(terms.acceptanceExpiresAt.getTime() / 1000)),
  };
}

async function verifyV2ManifestIntegrity(terms: DealTerms) {
  const governedManifest = terms.policyVersion === "v2_governed" ? V2_GOVERNED_POLICY_MANIFEST : null;
  const manifest = governedManifest ?? V2_POLICY_MANIFEST;
  const source = new Contract(manifest.source.address, v2SourceAbi, sepoliaProvider);
  const escrow = new Contract(manifest.escrowAsc.address, v2EscrowAbi, creditcoinProvider);
  const governance = governedManifest ? new Contract(governedManifest.governance.address, v2GovernanceAbi, creditcoinProvider) : null;
  const [sourceCode, escrowCode, sourcePolicyHash, sourceWindow, escrowPolicyHash, escrowSource, escrowChainKey, escrowWindow, escrowRefundWindow, disputeGovernance, governanceCode, threshold, signerCount, ...signerChecks] = await Promise.all([
    sepoliaProvider.getCode(manifest.source.address),
    creditcoinProvider.getCode(manifest.escrowAsc.address),
    source.policyHash(),
    source.acceptanceWindowSeconds(),
    escrow.policyHash(),
    escrow.sourceContract(),
    escrow.sourceChainKey(),
    escrow.acceptanceWindowSeconds(),
    escrow.refundWindowSeconds(),
    governedManifest ? escrow.disputeGovernance() : Promise.resolve(undefined),
    governedManifest ? creditcoinProvider.getCode(governedManifest.governance.address) : Promise.resolve(undefined),
    governance ? governance.threshold() : Promise.resolve(undefined),
    governance ? governance.signerCount() : Promise.resolve(undefined),
    ...(governance ? governedManifest!.governance.signers.map(signer => governance.isSigner(signer)) : []),
  ]);
  const valid =
    sourceCode !== "0x" && escrowCode !== "0x" &&
    keccak256(sourceCode) === manifest.source.runtimeCodeHash &&
    keccak256(escrowCode) === manifest.escrowAsc.runtimeCodeHash &&
    sourcePolicyHash === manifest.policyHash &&
    Number(sourceWindow) === manifest.policy.acceptanceWindowSeconds &&
    escrowPolicyHash === manifest.policyHash &&
    getAddress(escrowSource) === getAddress(manifest.source.address) &&
    Number(escrowChainKey) === manifest.policy.sourceChainKey &&
    Number(escrowWindow) === manifest.policy.acceptanceWindowSeconds &&
    Number(escrowRefundWindow) === manifest.policy.refundWindowSeconds &&
    (!governedManifest || (
      governanceCode !== "0x" &&
      keccak256(governanceCode!) === governedManifest.governance.runtimeCodeHash &&
      Number(threshold) === governedManifest.governance.threshold &&
      Number(signerCount) === governedManifest.governance.signerCount &&
      signerChecks.every(Boolean) &&
      getAddress(disputeGovernance!) === getAddress(governedManifest.governance.address)
    ));
  if (!valid) throw new Error("The public V2 deployment no longer matches its pinned manifest. V2 receipt submission is blocked.");
}

function findEvent(receipt: Awaited<ReturnType<JsonRpcProvider["getTransactionReceipt"]>>, contractAddress: string, eventName: string, iface: Interface) {
  if (!receipt) throw new Error("Transaction has not been mined yet.");
  if (receipt.status !== 1) throw new Error("Transaction reverted on-chain.");
  const log = receipt.logs.find(candidate => {
    if (candidate.address.toLowerCase() !== contractAddress.toLowerCase()) return false;
    try { return iface.parseLog(candidate)?.name === eventName; } catch { return false; }
  });
  if (!log) throw new Error(`Expected ${eventName} event was not emitted by the VeriSettle contract.`);
  const parsed = iface.parseLog(log);
  if (!parsed) throw new Error(`Unable to decode ${eventName} event.`);
  return parsed;
}

export async function verifyEscrowFunding(txHash: string, terms: DealTerms) {
  const receipt = await creditcoinProvider.getTransactionReceipt(txHash);
  if (isV2(terms)) {
    await verifyV2ManifestIntegrity(terms);
    const event = findEvent(receipt, v2ManifestFor(terms).escrowAsc.address, "EscrowFundedV2", v2EscrowInterface);
    const expected = expectedV2Terms(terms);
    const [orderKey, buyer, seller, amount, commitment, policyHash, acceptanceExpiresAt] = event.args;
    if (orderKey !== expected.orderKey || getAddress(buyer) !== expected.buyerAddress || getAddress(seller) !== expected.sellerAddress || commitment !== expected.termsCommitmentHash || policyHash !== expected.policyHash || acceptanceExpiresAt !== expected.acceptanceExpiresAt) {
      throw new Error("V2 funding receipt does not match this order’s policy, commitment, parties, or acceptance deadline.");
    }
    if (amount.toString() !== parseUnits(terms.amount, 18).toString()) throw new Error("V2 funding receipt amount does not match the recorded purchase order.");
    return receipt;
  }
  const event = findEvent(receipt, VERISETTLE_CONTRACTS.escrowAsc, "EscrowFunded", escrowInterface);
  const expected = expectedTerms(terms);
  const [orderKey, buyer, seller, amount, termsHash] = event.args;
  if (orderKey !== expected.orderKey || getAddress(buyer) !== expected.buyerAddress || getAddress(seller) !== expected.sellerAddress || termsHash !== expected.termsHash) {
    throw new Error("Funding receipt does not match this purchase order’s buyer, seller, order ID, or terms hash.");
  }
  if (amount.toString() !== parseUnits(terms.amount, 18).toString()) throw new Error("Funding receipt amount does not match the recorded purchase order.");
  return receipt;
}

export async function verifySourceAcceptance(txHash: string, terms: DealTerms) {
  const receipt = await sepoliaProvider.getTransactionReceipt(txHash);
  if (isV2(terms)) {
    await verifyV2ManifestIntegrity(terms);
    const event = findEvent(receipt, v2ManifestFor(terms).source.address, "OrderAcceptedV2", v2SourceInterface);
    const expected = expectedV2Terms(terms);
    const [orderKey, buyer, seller, commitment, policyHash, acceptanceExpiresAt] = event.args;
    if (orderKey !== expected.orderKey || getAddress(buyer) !== expected.buyerAddress || getAddress(seller) !== expected.sellerAddress || commitment !== expected.termsCommitmentHash || policyHash !== expected.policyHash || acceptanceExpiresAt !== expected.acceptanceExpiresAt) {
      throw new Error("V2 source acceptance receipt does not match this order’s policy commitment.");
    }
    return receipt;
  }
  const event = findEvent(receipt, VERISETTLE_CONTRACTS.source, "OrderAccepted", sourceInterface);
  const expected = expectedTerms(terms);
  const [orderKey, buyer, seller, termsHash] = event.args;
  if (orderKey !== expected.orderKey || getAddress(buyer) !== expected.buyerAddress || getAddress(seller) !== expected.sellerAddress || termsHash !== expected.termsHash) {
    throw new Error("Sepolia acceptance event does not match this purchase order’s protected terms.");
  }
  return receipt;
}

export async function verifyReleasedSettlement(txHash: string, terms: DealTerms) {
  const receipt = await creditcoinProvider.getTransactionReceipt(txHash);
  if (isV2(terms)) {
    await verifyV2ManifestIntegrity(terms);
    const event = findEvent(receipt, v2ManifestFor(terms).escrowAsc.address, "EscrowReleasedV2", v2EscrowInterface);
    const expected = expectedV2Terms(terms);
    const [orderKey, , seller, , policyHash] = event.args;
    if (orderKey !== expected.orderKey || getAddress(seller) !== expected.sellerAddress || policyHash !== expected.policyHash) throw new Error("V2 settlement receipt does not release this purchase order under its committed policy.");
    return receipt;
  }
  const event = findEvent(receipt, VERISETTLE_CONTRACTS.escrowAsc, "EscrowReleased", escrowInterface);
  const expected = expectedTerms(terms);
  const [orderKey, , seller] = event.args;
  if (orderKey !== expected.orderKey || getAddress(seller) !== expected.sellerAddress) throw new Error("Settlement receipt does not release this purchase order to its designated seller.");
  return receipt;
}

export async function verifyEscrowRefund(txHash: string, terms: DealTerms) {
  const receipt = await creditcoinProvider.getTransactionReceipt(txHash);
  const v2 = isV2(terms);
  if (v2) await verifyV2ManifestIntegrity(terms);
  const event = findEvent(receipt, v2 ? v2ManifestFor(terms).escrowAsc.address : VERISETTLE_CONTRACTS.escrowAsc, v2 ? "EscrowRefundedV2" : "EscrowRefunded", v2 ? v2EscrowInterface : escrowInterface);
  const expected = v2 ? expectedV2Terms(terms) : expectedTerms(terms);
  const [orderKey, buyer] = event.args;
  if (orderKey !== expected.orderKey || getAddress(buyer) !== expected.buyerAddress) throw new Error("Refund receipt does not return this purchase order’s escrow to its buyer.");
  return receipt;
}

export async function verifyEscrowDispute(txHash: string, terms: DealTerms) {
  const receipt = await creditcoinProvider.getTransactionReceipt(txHash);
  const v2 = isV2(terms);
  if (v2) await verifyV2ManifestIntegrity(terms);
  const event = findEvent(receipt, v2 ? v2ManifestFor(terms).escrowAsc.address : VERISETTLE_CONTRACTS.escrowAsc, v2 ? "EscrowDisputedV2" : "EscrowDisputed", v2 ? v2EscrowInterface : escrowInterface);
  const expected = v2 ? expectedV2Terms(terms) : expectedTerms(terms);
  const [orderKey, raisedBy] = event.args;
  const actor = getAddress(raisedBy);
  if (orderKey !== expected.orderKey || (actor !== expected.buyerAddress && actor !== expected.sellerAddress)) throw new Error("Dispute receipt does not belong to this purchase order or an authorized party.");
  return receipt;
}

export async function getProofForSourceTransaction(txHash: string) {
  const { proofProvider } = await import("@gluwa/usc-sdk");
  const builder = new proofProvider.service.ProofBuilder(VERISETTLE_CONTRACTS.sourceChainKey, "https://prover.cc3-testnet.creditcoin.network/");
  const result = await builder.getProof(txHash);
  if (!result.success || !result.data) throw new Error(result.error ?? "The source block has not been attested by Attestcoin yet. Retry shortly.");
  return result.data;
}

export async function readEscrowStatus(orderId: string, policyVersion: DealTerms["policyVersion"] = "v1_live") {
  const v2 = policyVersion === "v2_deployed" || policyVersion === "v2_governed";
  const escrow = new Contract(v2 ? (policyVersion === "v2_governed" ? V2_GOVERNED_POLICY_MANIFEST : V2_POLICY_MANIFEST).escrowAsc.address : VERISETTLE_CONTRACTS.escrowAsc, v2 ? v2EscrowAbi : escrowAbi, creditcoinProvider);
  return escrow.escrows(toOrderKey(orderId));
}
