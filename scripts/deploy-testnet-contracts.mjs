import { ContractFactory, JsonRpcProvider, Wallet, formatEther, getCreateAddress } from "ethers";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = "/home/ubuntu/verisettle";
const artifactRoot = resolve(projectRoot, "contracts/artifacts");
const deploymentDirectory = resolve(projectRoot, "contracts/deployments");
const deploymentPath = resolve(deploymentDirectory, "cc3-testnet.json");
const walletPath = "/home/ubuntu/.verisettle-testnet-wallet.json";

if (existsSync(deploymentPath)) {
  throw new Error(`Deployment manifest already exists at ${deploymentPath}. Refusing to spend testnet funds twice.`);
}

const walletConfig = JSON.parse(readFileSync(walletPath, "utf8"));
const sourceArtifact = JSON.parse(readFileSync(resolve(artifactRoot, "VeriSettleSource-VeriSettleSource.json"), "utf8"));
const escrowArtifact = JSON.parse(readFileSync(resolve(artifactRoot, "VeriSettleEscrowASC-VeriSettleEscrowASC.json"), "utf8"));
const decoderArtifact = JSON.parse(readFileSync(resolve(artifactRoot, "EvmV1Decoder-EvmV1Decoder.json"), "utf8"));

const sepoliaProvider = new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
const creditcoinProvider = new JsonRpcProvider("https://rpc.cc3-testnet.creditcoin.network");
const sepoliaWallet = new Wallet(walletConfig.privateKey, sepoliaProvider);
const creditcoinWallet = new Wallet(walletConfig.privateKey, creditcoinProvider);

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
  if (decoderAddress) {
    bytecode = bytecode.replace(/__\$[0-9a-f]{34}\$__/g, decoderAddress.slice(2).toLowerCase());
  }
  if (bytecode.includes("__$")) throw new Error("Unresolved Solidity library link reference remains in escrow bytecode.");
  return `0x${bytecode}`;
}

async function existingDeploymentAtNonce(provider, deployer, nonce) {
  const address = getCreateAddress({ from: deployer, nonce });
  const code = await provider.getCode(address);
  return code === "0x" ? null : address;
}

const [sepoliaBalance, creditcoinBalance] = await Promise.all([
  sepoliaProvider.getBalance(sepoliaWallet.address),
  creditcoinProvider.getBalance(creditcoinWallet.address),
]);

if (sepoliaBalance === 0n || creditcoinBalance === 0n) {
  throw new Error("Both funded testnet balances are required before deployment.");
}

console.log(`Deploying from ${sepoliaWallet.address}`);
console.log(`Sepolia balance: ${formatEther(sepoliaBalance)} ETH`);
console.log(`Creditcoin balance: ${formatEther(creditcoinBalance)} tCTC`);

let sourceAddress = await existingDeploymentAtNonce(sepoliaProvider, sepoliaWallet.address, 0);
let sourceDeploymentTransaction = null;
if (sourceAddress) {
  console.log(`Reusing source contract deployed at nonce 0: ${sourceAddress}`);
} else {
  const sourceFactory = new ContractFactory(sourceArtifact.abi, sourceArtifact.bytecode, sepoliaWallet);
  const sourceContract = await sourceFactory.deploy();
  sourceDeploymentTransaction = sourceContract.deploymentTransaction();
  await sourceContract.waitForDeployment();
  sourceAddress = await sourceContract.getAddress();
}

let decoderAddress = await existingDeploymentAtNonce(creditcoinProvider, creditcoinWallet.address, 0);
let decoderDeploymentTransaction = null;
if (decoderAddress) {
  console.log(`Reusing EvmV1Decoder deployed at nonce 0: ${decoderAddress}`);
} else {
  const decoderFactory = new ContractFactory(decoderArtifact.abi, decoderArtifact.bytecode, creditcoinWallet);
  const decoderContract = await decoderFactory.deploy();
  decoderDeploymentTransaction = decoderContract.deploymentTransaction();
  await decoderContract.waitForDeployment();
  decoderAddress = await decoderContract.getAddress();
}

const escrowBytecode = linkBytecode(escrowArtifact, { EvmV1Decoder: decoderAddress });
const escrowFactory = new ContractFactory(escrowArtifact.abi, escrowBytecode, creditcoinWallet);
const escrowContract = await escrowFactory.deploy(sourceAddress, 1);
const escrowDeploymentTransaction = escrowContract.deploymentTransaction();
await escrowContract.waitForDeployment();

const manifest = {
  network: {
    source: { name: "Ethereum Sepolia", chainId: 11155111, explorer: "https://sepolia.etherscan.io" },
    settlement: { name: "Creditcoin CC3 Testnet", chainId: 102031, explorer: "https://creditcoin-testnet.blockscout.com" },
  },
  deployer: sepoliaWallet.address,
  source: {
    address: sourceAddress,
    deploymentTxHash: sourceDeploymentTransaction?.hash,
  },
  decoderLibrary: {
    address: decoderAddress,
    deploymentTxHash: decoderDeploymentTransaction?.hash,
  },
  escrowAsc: {
    address: await escrowContract.getAddress(),
    deploymentTxHash: escrowDeploymentTransaction?.hash,
    sourceChainKey: 1,
    blockProverPrecompile: "0x0000000000000000000000000000000000000FD2",
  },
  deployedAt: new Date().toISOString(),
};

mkdirSync(deploymentDirectory, { recursive: true });
writeFileSync(deploymentPath, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
