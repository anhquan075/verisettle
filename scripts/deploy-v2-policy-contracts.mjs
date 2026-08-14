import {
  AbiCoder,
  Contract,
  ContractFactory,
  JsonRpcProvider,
  Wallet,
  ZeroAddress,
  formatEther,
  getAddress,
  getCreateAddress,
  keccak256,
  toUtf8Bytes,
} from "ethers";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = "/home/ubuntu/verisettle";
const artifactRoot = resolve(projectRoot, "contracts/artifacts");
const deploymentDirectory = resolve(projectRoot, "contracts/deployments");
const deploymentPath = resolve(deploymentDirectory, "v2-policy-cc3-testnet.json");
const policyDefaultsPath = resolve(deploymentDirectory, "v2-policy-defaults.json");
const v1DeploymentPath = resolve(deploymentDirectory, "cc3-testnet.json");
const walletPath = "/home/ubuntu/.verisettle-testnet-wallet.json";
const sepoliaRpc = "https://ethereum-sepolia-rpc.publicnode.com";
const creditcoinRpc = "https://rpc.cc3-testnet.creditcoin.network";
const coder = AbiCoder.defaultAbiCoder();
const policyDomain = keccak256(toUtf8Bytes("VERISETTLE_SETTLEMENT_POLICY"));
const orderAcceptedV2Signature = keccak256(toUtf8Bytes("OrderAcceptedV2(bytes32,address,address,bytes32,bytes32,uint64)"));

if (existsSync(deploymentPath)) {
  throw new Error(`V2 deployment manifest already exists at ${deploymentPath}. Refusing to spend testnet funds twice.`);
}

function loadArtifact(name) {
  return JSON.parse(readFileSync(resolve(artifactRoot, name), "utf8"));
}

function linkBytecode(artifact, libraryAddresses) {
  let bytecode = artifact.bytecode.slice(2);
  for (const libraries of Object.values(artifact.linkReferences ?? {})) {
    for (const [libraryName, positions] of Object.entries(libraries)) {
      const libraryAddress = libraryAddresses[libraryName];
      if (!libraryAddress) throw new Error(`Missing deployment address for linked library ${libraryName}.`);
      for (const position of positions) {
        const start = position.start * 2;
        const length = position.length * 2;
        bytecode = `${bytecode.slice(0, start)}${libraryAddress.slice(2).toLowerCase()}${bytecode.slice(start + length)}`;
      }
    }
  }
  const decoderAddress = libraryAddresses.EvmV1Decoder;
  if (decoderAddress) bytecode = bytecode.replace(/__\$[0-9a-f]{34}\$__/g, decoderAddress.slice(2).toLowerCase());
  if (bytecode.includes("__$")) throw new Error("Unresolved Solidity library link reference remains in V2 escrow bytecode.");
  return `0x${bytecode}`;
}

function buildPolicyHash({ sourceContract, sourceChainKey, termsSchemaVersion, finalityMode, minimumSourceConfirmations, acceptanceWindowSeconds, refundWindowSeconds }) {
  return keccak256(
    coder.encode(
      ["bytes32", "uint16", "uint64", "address", "bytes32", "uint16", "uint8", "uint32", "uint32", "uint32"],
      [
        policyDomain,
        2,
        sourceChainKey,
        getAddress(sourceContract),
        orderAcceptedV2Signature,
        termsSchemaVersion,
        finalityMode,
        minimumSourceConfirmations,
        acceptanceWindowSeconds,
        refundWindowSeconds,
      ]
    )
  );
}

const walletConfig = JSON.parse(readFileSync(walletPath, "utf8"));
const policyDefaults = JSON.parse(readFileSync(policyDefaultsPath, "utf8"));
const v1Deployment = JSON.parse(readFileSync(v1DeploymentPath, "utf8"));
const sourceArtifact = loadArtifact("VeriSettleSourceV2-VeriSettleSourceV2.json");
const escrowArtifact = loadArtifact("VeriSettleEscrowASCV2-VeriSettleEscrowASCV2.json");

const sepoliaProvider = new JsonRpcProvider(sepoliaRpc);
const creditcoinProvider = new JsonRpcProvider(creditcoinRpc);
const sepoliaWallet = new Wallet(walletConfig.privateKey, sepoliaProvider);
const creditcoinWallet = new Wallet(walletConfig.privateKey, creditcoinProvider);
const [sepoliaBalance, creditcoinBalance, sepoliaNonce] = await Promise.all([
  sepoliaProvider.getBalance(sepoliaWallet.address),
  creditcoinProvider.getBalance(creditcoinWallet.address),
  sepoliaProvider.getTransactionCount(sepoliaWallet.address, "pending"),
]);
if (sepoliaBalance === 0n || creditcoinBalance === 0n) throw new Error("Both funded testnet balances are required before V2 deployment.");

const expectedSourceAddress = getCreateAddress({ from: sepoliaWallet.address, nonce: sepoliaNonce });
const policy = { ...policyDefaults, sourceContract: expectedSourceAddress };
const policyHash = buildPolicyHash(policy);
const sourceFactory = new ContractFactory(sourceArtifact.abi, sourceArtifact.bytecode, sepoliaWallet);
const source = await sourceFactory.deploy(policyHash, policy.acceptanceWindowSeconds);
const sourceTx = source.deploymentTransaction();
await source.waitForDeployment();
const sourceAddress = await source.getAddress();
if (sourceAddress.toLowerCase() !== expectedSourceAddress.toLowerCase()) throw new Error("Predicted and deployed V2 source addresses differ; refusing to deploy escrow.");
if (await source.policyHash() !== policyHash) throw new Error("V2 source policy hash constructor check failed.");

const decoderAddress = v1Deployment.decoderLibrary.address;
const decoderCode = await creditcoinProvider.getCode(decoderAddress);
if (decoderCode === "0x") throw new Error("Recorded EvmV1Decoder library is not present on CC3 Testnet.");
const escrowBytecode = linkBytecode(escrowArtifact, { EvmV1Decoder: decoderAddress });
const escrowFactory = new ContractFactory(escrowArtifact.abi, escrowBytecode, creditcoinWallet);
const escrow = await escrowFactory.deploy(sourceAddress, policy.sourceChainKey, policyHash, policy.acceptanceWindowSeconds, policy.refundWindowSeconds);
const escrowTx = escrow.deploymentTransaction();
await escrow.waitForDeployment();
const escrowAddress = await escrow.getAddress();
const escrowRead = new Contract(escrowAddress, escrowArtifact.abi, creditcoinProvider);
const [escrowPolicyHash, escrowSource, escrowSourceChainKey, escrowAcceptanceWindow, escrowRefundWindow] = await Promise.all([
  escrowRead.policyHash(),
  escrowRead.sourceContract(),
  escrowRead.sourceChainKey(),
  escrowRead.acceptanceWindowSeconds(),
  escrowRead.refundWindowSeconds(),
]);
if (
  escrowPolicyHash !== policyHash ||
  escrowSource.toLowerCase() !== sourceAddress.toLowerCase() ||
  Number(escrowSourceChainKey) !== policy.sourceChainKey ||
  Number(escrowAcceptanceWindow) !== policy.acceptanceWindowSeconds ||
  Number(escrowRefundWindow) !== policy.refundWindowSeconds
) throw new Error("V2 escrow constructor integrity check failed.");

const [sourceCode, escrowCode] = await Promise.all([sepoliaProvider.getCode(sourceAddress), creditcoinProvider.getCode(escrowAddress)]);
const manifest = {
  manifestVersion: 1,
  policyVersion: 2,
  policyHash,
  policy,
  network: {
    source: { name: "Ethereum Sepolia", chainId: 11155111, explorer: "https://sepolia.etherscan.io", rpc: sepoliaRpc },
    settlement: { name: "Creditcoin CC3 Testnet", chainId: 102031, explorer: "https://creditcoin-testnet.blockscout.com", rpc: creditcoinRpc },
  },
  deployer: sepoliaWallet.address,
  source: {
    address: sourceAddress,
    deploymentTxHash: sourceTx?.hash,
    runtimeCodeHash: keccak256(sourceCode),
    orderAcceptedV2EventSignature: orderAcceptedV2Signature,
  },
  decoderLibrary: { address: decoderAddress, runtimeCodeHash: keccak256(decoderCode) },
  escrowAsc: {
    address: escrowAddress,
    deploymentTxHash: escrowTx?.hash,
    runtimeCodeHash: keccak256(escrowCode),
    sourceChainKey: policy.sourceChainKey,
    blockProverPrecompile: "0x0000000000000000000000000000000000000FD2",
  },
  deploymentChecks: {
    sourcePolicyHash: await source.policyHash(),
    escrowPolicyHash,
    escrowSource,
    escrowSourceChainKey: Number(escrowSourceChainKey),
    escrowAcceptanceWindowSeconds: Number(escrowAcceptanceWindow),
    escrowRefundWindowSeconds: Number(escrowRefundWindow),
  },
  balancesBeforeDeployment: { sepoliaEth: formatEther(sepoliaBalance), creditcoinTctc: formatEther(creditcoinBalance) },
  deployedAt: new Date().toISOString(),
};

mkdirSync(deploymentDirectory, { recursive: true });
writeFileSync(deploymentPath, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
