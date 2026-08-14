import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { proofProvider } from "@gluwa/usc-sdk";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sourceTxHash = "0x4b6c2c2645cea40926839e15b63c61e90d6539053a4cce3d3e68ce2f92de1d18";
const projectRoot = "/home/ubuntu/verisettle";
const walletConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-testnet-wallet.json", "utf8"));
const archivedDeployment = JSON.parse(
  readFileSync(resolve(projectRoot, "contracts/deployments/history/cc3-testnet-pre-queryid-fix.json"), "utf8")
);
const escrowArtifact = JSON.parse(readFileSync(resolve(projectRoot, "contracts/artifacts/VeriSettleEscrowASC-VeriSettleEscrowASC.json"), "utf8"));
const creditcoinProvider = new JsonRpcProvider("https://rpc.cc3-testnet.creditcoin.network");
const creditcoinWallet = new Wallet(walletConfig.privateKey, creditcoinProvider);
const escrowContract = new Contract(archivedDeployment.escrowAsc.address, escrowArtifact.abi, creditcoinWallet);

const proofBuilder = new proofProvider.service.ProofBuilder(1, "https://prover.cc3-testnet.creditcoin.network/");
const proofResult = await proofBuilder.getProof(sourceTxHash);
if (!proofResult.success || !proofResult.data) {
  throw new Error(`Unable to load the existing real proof: ${proofResult.error ?? "missing proof data"}`);
}
const proof = proofResult.data;
const finalByte = Number.parseInt(proof.txBytes.slice(-2), 16);
const mutatedTxBytes = `${proof.txBytes.slice(0, -2)}${(finalByte ^ 1).toString(16).padStart(2, "0")}`;
const invalidData = escrowContract.interface.encodeFunctionData("submitAcceptanceProof", [
  proof.chainKey,
  proof.headerNumber,
  mutatedTxBytes,
  proof.merkleProof.root,
  proof.merkleProof.siblings,
  proof.continuityProof.lowerEndpointDigest,
  proof.continuityProof.roots,
]);

const transaction = await creditcoinWallet.sendTransaction({
  to: archivedDeployment.escrowAsc.address,
  data: invalidData,
  gasLimit: 1_000_000n,
});
let receipt;
try {
  receipt = await transaction.wait();
} catch (error) {
  receipt = error.receipt;
}
if (!receipt) {
  throw new Error("Invalid-proof transaction did not return a receipt.");
}
if (receipt.status !== 0) {
  throw new Error(`Expected failed invalid-proof transaction, received status ${receipt.status}.`);
}

const evidence = {
  purpose: "Real invalid Attestcoin proof rejection",
  sourceTxHash,
  asc: archivedDeployment.escrowAsc.address,
  invalidProofTxHash: transaction.hash,
  receiptStatus: receipt.status,
  expectedFailure: "ProofVerificationFailed",
  reason: "A one-byte mutation made the source transaction bytes inconsistent with its real merkle inclusion proof.",
  completedAt: new Date().toISOString(),
};
const evidenceDirectory = resolve(projectRoot, "contracts/test-runs");
mkdirSync(evidenceDirectory, { recursive: true });
writeFileSync(resolve(evidenceDirectory, "invalid-attestcoin-proof.json"), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
