import { Contract, Interface, JsonRpcProvider, getAddress, parseUnits } from "ethers";
import { escrowAbi, sourceAbi, TESTNET_NETWORKS, toOrderKey, toTermsHash, VERISETTLE_CONTRACTS } from "../shared/contracts";

const sepoliaProvider = new JsonRpcProvider(TESTNET_NETWORKS.sepolia.rpcUrl);
const creditcoinProvider = new JsonRpcProvider(TESTNET_NETWORKS.creditcoin.rpcUrl);
const sourceInterface = new Interface(sourceAbi);
const escrowInterface = new Interface(escrowAbi);

type DealTerms = {
  orderId: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: string;
  currency: string;
  description: string;
};

function expectedTerms(terms: DealTerms) {
  return {
    orderKey: toOrderKey(terms.orderId),
    termsHash: toTermsHash(terms),
    buyerAddress: getAddress(terms.buyerAddress),
    sellerAddress: getAddress(terms.sellerAddress),
  };
}

function findEvent(receipt: Awaited<ReturnType<JsonRpcProvider["getTransactionReceipt"]>>, contractAddress: string, eventName: string, iface: Interface) {
  if (!receipt) throw new Error("Transaction has not been mined yet.");
  if (receipt.status !== 1) throw new Error("Transaction reverted on-chain.");
  const log = receipt.logs.find(candidate => {
    if (candidate.address.toLowerCase() !== contractAddress.toLowerCase()) return false;
    try {
      return iface.parseLog(candidate)?.name === eventName;
    } catch {
      return false;
    }
  });
  if (!log) throw new Error(`Expected ${eventName} event was not emitted by the VeriSettle contract.`);
  const parsed = iface.parseLog(log);
  if (!parsed) throw new Error(`Unable to decode ${eventName} event.`);
  return parsed;
}

export async function verifyEscrowFunding(txHash: string, terms: DealTerms) {
  const receipt = await creditcoinProvider.getTransactionReceipt(txHash);
  const event = findEvent(receipt, VERISETTLE_CONTRACTS.escrowAsc, "EscrowFunded", escrowInterface);
  const expected = expectedTerms(terms);
  const [orderKey, buyer, seller, amount, termsHash] = event.args;
  if (
    orderKey !== expected.orderKey ||
    getAddress(buyer) !== expected.buyerAddress ||
    getAddress(seller) !== expected.sellerAddress ||
    termsHash !== expected.termsHash
  ) {
    throw new Error("Funding receipt does not match this purchase order’s buyer, seller, order ID, or terms hash.");
  }
  if (amount.toString() !== parseUnits(terms.amount, 18).toString()) {
    throw new Error("Funding receipt amount does not match the recorded purchase order.");
  }
  return receipt;
}

export async function verifySourceAcceptance(txHash: string, terms: DealTerms) {
  const receipt = await sepoliaProvider.getTransactionReceipt(txHash);
  const event = findEvent(receipt, VERISETTLE_CONTRACTS.source, "OrderAccepted", sourceInterface);
  const expected = expectedTerms(terms);
  const [orderKey, buyer, seller, termsHash] = event.args;
  if (
    orderKey !== expected.orderKey ||
    getAddress(buyer) !== expected.buyerAddress ||
    getAddress(seller) !== expected.sellerAddress ||
    termsHash !== expected.termsHash
  ) {
    throw new Error("Sepolia acceptance event does not match this purchase order’s protected terms.");
  }
  return receipt;
}

export async function verifyReleasedSettlement(txHash: string, terms: DealTerms) {
  const receipt = await creditcoinProvider.getTransactionReceipt(txHash);
  const event = findEvent(receipt, VERISETTLE_CONTRACTS.escrowAsc, "EscrowReleased", escrowInterface);
  const expected = expectedTerms(terms);
  const [orderKey, , seller] = event.args;
  if (orderKey !== expected.orderKey || getAddress(seller) !== expected.sellerAddress) {
    throw new Error("Settlement receipt does not release this purchase order to its designated seller.");
  }
  return receipt;
}

export async function verifyEscrowRefund(txHash: string, terms: DealTerms) {
  const receipt = await creditcoinProvider.getTransactionReceipt(txHash);
  const event = findEvent(receipt, VERISETTLE_CONTRACTS.escrowAsc, "EscrowRefunded", escrowInterface);
  const expected = expectedTerms(terms);
  const [orderKey, buyer] = event.args;
  if (orderKey !== expected.orderKey || getAddress(buyer) !== expected.buyerAddress) {
    throw new Error("Refund receipt does not return this purchase order’s escrow to its buyer.");
  }
  return receipt;
}

export async function verifyEscrowDispute(txHash: string, terms: DealTerms) {
  const receipt = await creditcoinProvider.getTransactionReceipt(txHash);
  const event = findEvent(receipt, VERISETTLE_CONTRACTS.escrowAsc, "EscrowDisputed", escrowInterface);
  const expected = expectedTerms(terms);
  const [orderKey, raisedBy] = event.args;
  const actor = getAddress(raisedBy);
  if (orderKey !== expected.orderKey || (actor !== expected.buyerAddress && actor !== expected.sellerAddress)) {
    throw new Error("Dispute receipt does not belong to this purchase order or an authorized party.");
  }
  return receipt;
}

export async function getProofForSourceTransaction(txHash: string) {
  const { proofProvider } = await import("@gluwa/usc-sdk");
  const builder = new proofProvider.service.ProofBuilder(VERISETTLE_CONTRACTS.sourceChainKey, "https://prover.cc3-testnet.creditcoin.network/");
  const result = await builder.getProof(txHash);
  if (!result.success || !result.data) {
    throw new Error(result.error ?? "The source block has not been attested by Attestcoin yet. Retry shortly.");
  }
  return result.data;
}

export async function readEscrowStatus(orderId: string) {
  const escrow = new Contract(VERISETTLE_CONTRACTS.escrowAsc, escrowAbi, creditcoinProvider);
  return escrow.escrows(toOrderKey(orderId));
}
