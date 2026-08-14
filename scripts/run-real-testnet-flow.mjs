import { Contract, JsonRpcProvider, Wallet, formatEther, hexlify, keccak256, randomBytes } from "ethers";
import { proofProvider } from "@gluwa/usc-sdk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = "/home/ubuntu/verisettle";
const walletConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-testnet-wallet.json", "utf8"));
const deployment = JSON.parse(readFileSync(resolve(projectRoot, "contracts/deployments/cc3-testnet.json"), "utf8"));
const sourceArtifact = JSON.parse(readFileSync(resolve(projectRoot, "contracts/artifacts/VeriSettleSource-VeriSettleSource.json"), "utf8"));
const escrowArtifact = JSON.parse(readFileSync(resolve(projectRoot, "contracts/artifacts/VeriSettleEscrowASC-VeriSettleEscrowASC.json"), "utf8"));
const evidenceDirectory = resolve(projectRoot, "contracts/test-runs");

const sepoliaProvider = new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
const creditcoinProvider = new JsonRpcProvider("https://rpc.cc3-testnet.creditcoin.network");
const sepoliaWallet = new Wallet(walletConfig.privateKey, sepoliaProvider);
const creditcoinWallet = new Wallet(walletConfig.privateKey, creditcoinProvider);
const sourceContract = new Contract(deployment.source.address, sourceArtifact.abi, sepoliaWallet);
const escrowContract = new Contract(deployment.escrowAsc.address, escrowArtifact.abi, creditcoinWallet);

const orderId = hexlify(randomBytes(32));
const termsHash = keccak256(randomBytes(32));
const refundAfter = Math.floor(Date.now() / 1000) + 86_400;
const amount = 100_000_000_000_000_000n; // 0.1 tCTC in native base units.

const evidence = {
  purpose: "Real VeriSettle testnet proof-flow validation",
  orderId,
  termsHash,
  buyer: creditcoinWallet.address,
  seller: creditcoinWallet.address,
  sourceContract: deployment.source.address,
  escrowAsc: deployment.escrowAsc.address,
  sourceChainKey: 1,
  amount: formatEther(amount),
  startedAt: new Date().toISOString(),
};

console.log(`Creating real testnet order ${orderId} with ${formatEther(amount)} tCTC escrow.`);

const fundTx = await escrowContract.fundEscrow(orderId, creditcoinWallet.address, termsHash, refundAfter, { value: amount });
const fundReceipt = await fundTx.wait();
evidence.fundTxHash = fundTx.hash;
evidence.fundBlockNumber = fundReceipt.blockNumber;
console.log(`Creditcoin escrow funded: ${fundTx.hash}`);

const acceptanceTx = await sourceContract.acceptOrder(orderId, creditcoinWallet.address, termsHash);
const acceptanceReceipt = await acceptanceTx.wait();
evidence.sourceAcceptanceTxHash = acceptanceTx.hash;
evidence.sourceAcceptanceBlockNumber = acceptanceReceipt.blockNumber;
console.log(`Sepolia acceptance emitted: ${acceptanceTx.hash} in block ${acceptanceReceipt.blockNumber}`);

const proofBuilder = new proofProvider.service.ProofBuilder(
  deployment.escrowAsc.sourceChainKey,
  "https://prover.cc3-testnet.creditcoin.network/"
);
console.log("Waiting for the actual Sepolia block attestation and proof-builder availability. This can take several minutes.");
await proofBuilder.waitUntilHeightAttested(
  deployment.escrowAsc.sourceChainKey,
  acceptanceReceipt.blockNumber,
  15_000,
  1_200_000
);
const proofResult = await proofBuilder.getProof(acceptanceTx.hash);
if (!proofResult.success || !proofResult.data) {
  throw new Error(`Attestcoin proof generation failed: ${proofResult.error ?? "no proof payload returned"}`);
}
const proof = proofResult.data;
evidence.proofHeaderNumber = proof.headerNumber;
evidence.proofContinuityRoots = proof.continuityProof.roots.length;
console.log(`Attestcoin proof generated for source block ${proof.headerNumber}.`);

const proofArgs = [
  proof.chainKey,
  proof.headerNumber,
  proof.txBytes,
  proof.merkleProof.root,
  proof.merkleProof.siblings,
  proof.continuityProof.lowerEndpointDigest,
  proof.continuityProof.roots,
];

const proofData = escrowContract.interface.encodeFunctionData("submitAcceptanceProof", proofArgs);
let gasLimit;
try {
  const estimatedGas = await creditcoinProvider.estimateGas({
    to: deployment.escrowAsc.address,
    from: creditcoinWallet.address,
    data: proofData,
  });
  gasLimit = (estimatedGas * 135n) / 100n;
} catch (error) {
  const continuityLength = BigInt(Math.max(proof.continuityProof.roots.length, 1));
  gasLimit = 250_000n + continuityLength * 30_000n;
  console.warn(`Proof gas estimation unavailable; using calculated limit ${gasLimit.toString()}.`, error.shortMessage ?? "");
}

const proofTx = await escrowContract.submitAcceptanceProof(...proofArgs, { gasLimit });
const proofReceipt = await proofTx.wait();
evidence.proofSubmissionTxHash = proofTx.hash;
evidence.proofSubmissionBlockNumber = proofReceipt.blockNumber;
console.log(`Creditcoin acceptance proof submitted: ${proofTx.hash}`);

const onChainEscrow = await escrowContract.escrows(orderId);
evidence.finalStatus = Number(onChainEscrow.status);
evidence.finalStatusName = ["None", "Funded", "Released", "Refunded", "Disputed"][Number(onChainEscrow.status)];
if (Number(onChainEscrow.status) !== 2) {
  throw new Error(`Expected Released final status; received ${evidence.finalStatusName}.`);
}

try {
  await creditcoinProvider.call({ to: deployment.escrowAsc.address, from: creditcoinWallet.address, data: proofData });
  throw new Error("Replay attempt unexpectedly passed eth_call.");
} catch (error) {
  const parsed = escrowContract.interface.parseError(error.data ?? error.info?.error?.data ?? "0x");
  evidence.replayRejection = parsed?.name ?? error.shortMessage ?? error.message;
  if (parsed?.name !== "QueryAlreadyProcessed") {
    throw new Error(`Expected QueryAlreadyProcessed replay rejection; received ${evidence.replayRejection}.`);
  }
  console.log("Replay protection confirmed by on-chain custom error QueryAlreadyProcessed.");
}

evidence.completedAt = new Date().toISOString();
mkdirSync(evidenceDirectory, { recursive: true });
const evidencePath = resolve(evidenceDirectory, `real-proof-${orderId.slice(2, 10)}.json`);
if (existsSync(evidencePath)) throw new Error(`Evidence file already exists at ${evidencePath}.`);
writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
