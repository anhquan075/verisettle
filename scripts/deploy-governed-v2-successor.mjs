import { Contract, ContractFactory, JsonRpcProvider, Wallet, formatEther, getAddress, getCreateAddress, keccak256 } from "ethers";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = "/home/ubuntu/verisettle";
const walletPath = "/home/ubuntu/.verisettle-testnet-wallet.json";
const deploymentDirectory = resolve(projectRoot, "contracts/deployments");
const baseManifestPath = resolve(deploymentDirectory, "v2-policy-cc3-testnet.json");
const deploymentPath = resolve(deploymentDirectory, "v2-governed-policy-cc3-testnet.json");
const multisigArtifactPath = resolve(projectRoot, "out/VeriSettleDisputeMultisig.sol/VeriSettleDisputeMultisig.json");
const escrowArtifactPath = resolve(projectRoot, "out/VeriSettleEscrowASCV2Governed.sol/VeriSettleEscrowASCV2Governed.json");

if (existsSync(deploymentPath)) {
  throw new Error(`Governed deployment manifest already exists at ${deploymentPath}. Refusing to spend testnet funds twice.`);
}

const baseManifest = JSON.parse(readFileSync(baseManifestPath, "utf8"));
const multisigArtifact = JSON.parse(readFileSync(multisigArtifactPath, "utf8"));
const escrowArtifact = JSON.parse(readFileSync(escrowArtifactPath, "utf8"));
const walletConfig = JSON.parse(readFileSync(walletPath, "utf8"));
const signers = [
  "0xc7774720D1C14B9dA1c656b796a2a092D0b9D1c9",
  "0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620",
  "0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA",
].map(getAddress);
const threshold = 2;

function artifactBytecode(artifact) {
  const bytecode = artifact.bytecode?.object ?? artifact.bytecode;
  if (!bytecode) throw new Error("Artifact bytecode was not found.");
  return bytecode.startsWith("0x") ? bytecode : `0x${bytecode}`;
}

function linkBytecode(artifact, libraries) {
  let bytecode = artifactBytecode(artifact).slice(2);
  for (const fileReferences of Object.values(artifact.linkReferences ?? {})) {
    for (const [libraryName, positions] of Object.entries(fileReferences)) {
      const address = libraries[libraryName];
      if (!address) throw new Error(`Missing linked-library address for ${libraryName}.`);
      for (const position of positions) {
        const start = position.start * 2;
        const length = position.length * 2;
        bytecode = `${bytecode.slice(0, start)}${address.slice(2).toLowerCase()}${bytecode.slice(start + length)}`;
      }
    }
  }
  if (libraries.EvmV1Decoder) {
    bytecode = bytecode.replace(/__\$[0-9a-f]{34}\$__/g, libraries.EvmV1Decoder.slice(2).toLowerCase());
  }
  if (bytecode.includes("__$")) throw new Error("Unresolved linked-library reference in governed escrow bytecode.");
  return `0x${bytecode}`;
}

const provider = new JsonRpcProvider(baseManifest.network.settlement.rpc);
const wallet = new Wallet(walletConfig.privateKey, provider);
if (wallet.address.toLowerCase() !== baseManifest.deployer.toLowerCase()) throw new Error("Deployment wallet does not match the verified V2 deployer.");

const [network, balance, nonce, decoderCode] = await Promise.all([
  provider.getNetwork(),
  provider.getBalance(wallet.address),
  provider.getTransactionCount(wallet.address, "pending"),
  provider.getCode(baseManifest.decoderLibrary.address),
]);
if (Number(network.chainId) !== baseManifest.network.settlement.chainId) throw new Error("Unexpected CC3 Testnet chain ID.");
if (balance === 0n) throw new Error("CC3 testnet deployer balance is empty.");
if (decoderCode === "0x") throw new Error("Pinned EvmV1Decoder library is absent from CC3 Testnet.");

const predictedMultisig = getCreateAddress({ from: wallet.address, nonce });
const multisigFactory = new ContractFactory(multisigArtifact.abi, artifactBytecode(multisigArtifact), wallet);
const multisig = await multisigFactory.deploy(signers, threshold);
const multisigTx = multisig.deploymentTransaction();
await multisig.waitForDeployment();
const multisigAddress = await multisig.getAddress();
if (multisigAddress.toLowerCase() !== predictedMultisig.toLowerCase()) throw new Error("Predicted multisig address differs from deployed address.");

const escrowBytecode = linkBytecode(escrowArtifact, { EvmV1Decoder: baseManifest.decoderLibrary.address });
const predictedEscrow = getCreateAddress({ from: wallet.address, nonce: nonce + 1 });
const escrowFactory = new ContractFactory(escrowArtifact.abi, escrowBytecode, wallet);
const escrow = await escrowFactory.deploy(
  baseManifest.source.address,
  baseManifest.policy.sourceChainKey,
  baseManifest.policyHash,
  baseManifest.policy.acceptanceWindowSeconds,
  baseManifest.policy.refundWindowSeconds,
  multisigAddress,
);
const escrowTx = escrow.deploymentTransaction();
await escrow.waitForDeployment();
const escrowAddress = await escrow.getAddress();
if (escrowAddress.toLowerCase() !== predictedEscrow.toLowerCase()) throw new Error("Predicted governed escrow address differs from deployed address.");

const multisigRead = new Contract(multisigAddress, multisigArtifact.abi, provider);
const escrowRead = new Contract(escrowAddress, escrowArtifact.abi, provider);
const [
  observedThreshold,
  observedSignerCount,
  observedSignerOne,
  observedSignerTwo,
  observedSignerThree,
  escrowPolicyHash,
  escrowSource,
  escrowSourceChainKey,
  escrowAcceptanceWindow,
  escrowRefundWindow,
  observedGovernance,
  multisigCode,
  escrowCode,
] = await Promise.all([
  multisigRead.threshold(),
  multisigRead.signerCount(),
  multisigRead.isSigner(signers[0]),
  multisigRead.isSigner(signers[1]),
  multisigRead.isSigner(signers[2]),
  escrowRead.policyHash(),
  escrowRead.sourceContract(),
  escrowRead.sourceChainKey(),
  escrowRead.acceptanceWindowSeconds(),
  escrowRead.refundWindowSeconds(),
  escrowRead.disputeGovernance(),
  provider.getCode(multisigAddress),
  provider.getCode(escrowAddress),
]);

if (
  Number(observedThreshold) !== threshold ||
  Number(observedSignerCount) !== signers.length ||
  !observedSignerOne || !observedSignerTwo || !observedSignerThree ||
  escrowPolicyHash !== baseManifest.policyHash ||
  escrowSource.toLowerCase() !== baseManifest.source.address.toLowerCase() ||
  Number(escrowSourceChainKey) !== baseManifest.policy.sourceChainKey ||
  Number(escrowAcceptanceWindow) !== baseManifest.policy.acceptanceWindowSeconds ||
  Number(escrowRefundWindow) !== baseManifest.policy.refundWindowSeconds ||
  observedGovernance.toLowerCase() !== multisigAddress.toLowerCase() ||
  multisigCode === "0x" ||
  escrowCode === "0x"
) throw new Error("Governed successor constructor integrity check failed.");

const balanceAfter = await provider.getBalance(wallet.address);
const manifest = {
  manifestVersion: 1,
  policyVersion: 2,
  policyKind: "v2_governed",
  policyHash: baseManifest.policyHash,
  baseV2Manifest: "v2-policy-cc3-testnet.json",
  policy: baseManifest.policy,
  network: baseManifest.network,
  deployer: wallet.address,
  source: baseManifest.source,
  decoderLibrary: baseManifest.decoderLibrary,
  governance: {
    contract: multisigAddress,
    deploymentTxHash: multisigTx?.hash,
    runtimeCodeHash: keccak256(multisigCode),
    threshold,
    signerCount: signers.length,
    signers,
  },
  escrowAsc: {
    address: escrowAddress,
    deploymentTxHash: escrowTx?.hash,
    runtimeCodeHash: keccak256(escrowCode),
    sourceChainKey: baseManifest.policy.sourceChainKey,
    blockProverPrecompile: "0x0000000000000000000000000000000000000FD2",
  },
  deploymentChecks: {
    sourcePolicyHash: baseManifest.policyHash,
    multisigThreshold: Number(observedThreshold),
    multisigSignerCount: Number(observedSignerCount),
    multisigSigners: [observedSignerOne, observedSignerTwo, observedSignerThree],
    escrowPolicyHash,
    escrowSource,
    escrowSourceChainKey: Number(escrowSourceChainKey),
    escrowAcceptanceWindowSeconds: Number(escrowAcceptanceWindow),
    escrowRefundWindowSeconds: Number(escrowRefundWindow),
    escrowDisputeGovernance: observedGovernance,
  },
  balances: { beforeTctc: formatEther(balance), afterTctc: formatEther(balanceAfter), deploymentCostTctc: formatEther(balance - balanceAfter) },
  deployedAt: new Date().toISOString(),
};

mkdirSync(deploymentDirectory, { recursive: true });
writeFileSync(deploymentPath, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
