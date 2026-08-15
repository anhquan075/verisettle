import { ContractFactory, JsonRpcProvider, formatEther, getCreateAddress, getAddress } from "ethers";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = "/home/ubuntu/verisettle";
const deploymentDirectory = resolve(projectRoot, "contracts/deployments");
const baseManifest = JSON.parse(readFileSync(resolve(deploymentDirectory, "v2-policy-cc3-testnet.json"), "utf8"));
const multisigArtifact = JSON.parse(readFileSync(resolve(projectRoot, "out/VeriSettleDisputeMultisig.sol/VeriSettleDisputeMultisig.json"), "utf8"));
const escrowArtifact = JSON.parse(readFileSync(resolve(projectRoot, "out/VeriSettleEscrowASCV2Governed.sol/VeriSettleEscrowASCV2Governed.json"), "utf8"));

const signerAddresses = [
  "0xc7774720D1C14B9dA1c656b796a2a092D0b9D1c9",
  "0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620",
  "0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA",
].map(getAddress);
const threshold = 2;
const provider = new JsonRpcProvider(baseManifest.network.settlement.rpc);

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

const deployer = getAddress(baseManifest.deployer);
const [network, nonce, feeData, balance, decoderCode] = await Promise.all([
  provider.getNetwork(),
  provider.getTransactionCount(deployer, "pending"),
  provider.getFeeData(),
  provider.getBalance(deployer),
  provider.getCode(baseManifest.decoderLibrary.address),
]);

if (Number(network.chainId) !== baseManifest.network.settlement.chainId) throw new Error("Unexpected CC3 chain ID.");
if (decoderCode === "0x") throw new Error("The pinned decoder library is missing on CC3.");
const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;
if (gasPrice == null) throw new Error("CC3 did not provide a usable gas price.");

const multisigFactory = new ContractFactory(multisigArtifact.abi, artifactBytecode(multisigArtifact));
const multisigTx = await multisigFactory.getDeployTransaction(signerAddresses, threshold);
const multisigAddress = getCreateAddress({ from: deployer, nonce });
const escrowBytecode = linkBytecode(escrowArtifact, { EvmV1Decoder: baseManifest.decoderLibrary.address });
const escrowFactory = new ContractFactory(escrowArtifact.abi, escrowBytecode);
const escrowTx = await escrowFactory.getDeployTransaction(
  baseManifest.source.address,
  baseManifest.policy.sourceChainKey,
  baseManifest.policyHash,
  baseManifest.policy.acceptanceWindowSeconds,
  baseManifest.policy.refundWindowSeconds,
  multisigAddress,
);
const [multisigGas, escrowGas] = await Promise.all([
  provider.estimateGas({ from: deployer, data: multisigTx.data }),
  provider.estimateGas({ from: deployer, data: escrowTx.data }),
]);

const escrowAddress = getCreateAddress({ from: deployer, nonce: nonce + 1 });
const multisigCost = multisigGas * gasPrice;
const escrowCost = escrowGas * gasPrice;
console.log(JSON.stringify({
  mode: "READ_ONLY_PREFLIGHT_NO_SIGNATURE_OR_TRANSACTION",
  network: { chainId: Number(network.chainId), name: baseManifest.network.settlement.name },
  deployer,
  deployerBalanceTctc: formatEther(balance),
  signerAddresses,
  threshold,
  pendingNonce: nonce,
  predictedContracts: { multisig: multisigAddress, governedEscrow: escrowAddress },
  gas: {
    gasPriceWei: gasPrice.toString(),
    multisigGas: multisigGas.toString(),
    governedEscrowGas: escrowGas.toString(),
    totalGas: (multisigGas + escrowGas).toString(),
    estimatedTotalTctc: formatEther(multisigCost + escrowCost),
  },
  policyBinding: {
    policyHash: baseManifest.policyHash,
    sourceContract: baseManifest.source.address,
    sourceChainKey: baseManifest.policy.sourceChainKey,
    decoderLibrary: baseManifest.decoderLibrary.address,
  },
}, null, 2));
