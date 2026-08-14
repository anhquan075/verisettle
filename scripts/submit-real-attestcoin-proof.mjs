import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { proofProvider } from "@gluwa/usc-sdk";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [sourceTxHash, orderId] = process.argv.slice(2);
if (!sourceTxHash?.match(/^0x[0-9a-fA-F]{64}$/) || !orderId?.match(/^0x[0-9a-fA-F]{64}$/)) {
  throw new Error("Usage: node scripts/submit-real-attestcoin-proof.mjs <sepoliaTxHash> <orderId>");
}

const projectRoot = "/home/ubuntu/verisettle";
const walletConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-testnet-wallet.json", "utf8"));
const deployment = JSON.parse(readFileSync(resolve(projectRoot, "contracts/deployments/cc3-testnet.json"), "utf8"));
const escrowArtifact = JSON.parse(readFileSync(resolve(projectRoot, "contracts/artifacts/VeriSettleEscrowASC-VeriSettleEscrowASC.json"), "utf8"));
const creditcoinProvider = new JsonRpcProvider("https://rpc.cc3-testnet.creditcoin.network");
const creditcoinWallet = new Wallet(walletConfig.privateKey, creditcoinProvider);
const escrowContract = new Contract(deployment.escrowAsc.address, escrowArtifact.abi, creditcoinWallet);

const proofBuilder = new proofProvider.service.ProofBuilder(
  deployment.escrowAsc.sourceChainKey,
  "https://prover.cc3-testnet.creditcoin.network/"
);
const proofResult = await proofBuilder.getProof(sourceTxHash);
if (!proofResult.success || !proofResult.data) {
  throw new Error(`Attestcoin proof generation failed: ${proofResult.error ?? "no proof payload returned"}`);
}
const proof = proofResult.data;
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
  gasLimit = 250_000n + BigInt(Math.max(proof.continuityProof.roots.length, 1)) * 30_000n;
  console.warn(`Proof gas estimation unavailable; using calculated limit ${gasLimit.toString()}.`, error.shortMessage ?? "");
}

const proofTx = await escrowContract.submitAcceptanceProof(...proofArgs, { gasLimit });
const proofReceipt = await proofTx.wait();
const escrow = await escrowContract.escrows(orderId);
if (Number(escrow.status) !== 2) {
  throw new Error(`Expected released escrow after proof submission; received status ${escrow.status}.`);
}

let replayRejection;
try {
  await creditcoinProvider.call({ to: deployment.escrowAsc.address, from: creditcoinWallet.address, data: proofData });
  throw new Error("Replay call unexpectedly passed.");
} catch (error) {
  const parsed = escrowContract.interface.parseError(error.data ?? error.info?.error?.data ?? "0x");
  replayRejection = parsed?.name ?? error.shortMessage ?? error.message;
  if (parsed?.name !== "QueryAlreadyProcessed") {
    throw new Error(`Expected QueryAlreadyProcessed replay rejection; received ${replayRejection}.`);
  }
}

const evidence = {
  purpose: "Real Attestcoin proof submission and replay check",
  orderId,
  sourceTxHash,
  sourceChainKey: proof.chainKey,
  sourceBlockNumber: proof.headerNumber,
  proofSubmissionTxHash: proofTx.hash,
  proofSubmissionBlockNumber: proofReceipt.blockNumber,
  escrowAsc: deployment.escrowAsc.address,
  finalStatus: "Released",
  replayRejection,
  completedAt: new Date().toISOString(),
};
const evidenceDirectory = resolve(projectRoot, "contracts/test-runs");
mkdirSync(evidenceDirectory, { recursive: true });
writeFileSync(resolve(evidenceDirectory, `real-proof-${orderId.slice(2, 10)}.json`), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
