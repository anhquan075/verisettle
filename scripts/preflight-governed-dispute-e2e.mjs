import { Contract, JsonRpcProvider, Wallet, formatEther, keccak256, parseUnits, toUtf8Bytes } from "ethers";
import { readFileSync } from "node:fs";

const rpc = "https://rpc.cc3-testnet.creditcoin.network";
const governedEscrow = "0x5eB2b5d2B659f6fb434F1D4d26F3d41773201bc7";
const governance = "0x0C9b8ef45Aa36922bb3dde9AEec1BB1bAFce2849";
const deployerConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-testnet-wallet.json", "utf8"));
const buyerConfig = JSON.parse(readFileSync("/home/ubuntu/.verisettle-buyer-testnet-wallet.json", "utf8"));
const provider = new JsonRpcProvider(rpc);
const deployer = new Wallet(deployerConfig.privateKey, provider);
const buyer = new Wallet(buyerConfig.privateKey, provider);
const amount = parseUnits("0.001", 18);
const orderId = `governed-dispute-${Date.now()}`;
const orderKey = keccak256(toUtf8Bytes(orderId));
const termsCommitment = keccak256(toUtf8Bytes(`VeriSettle governance test / ${orderId}`));
const acceptanceExpiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

const escrowAbi = [
  "function fundEscrow(bytes32 orderId, address seller, bytes32 termsCommitment, uint64 acceptanceExpiresAt) payable",
  "function raiseDispute(bytes32 orderId, bytes32 evidenceHash)",
];
const governanceAbi = [
  "function nextNonce() view returns (uint256)",
  "function approveDisputeResolution(address escrow, bytes32 orderId, bool releaseToSeller, uint256 nonce)",
];
const escrow = new Contract(governedEscrow, escrowAbi, provider);
const multisig = new Contract(governance, governanceAbi, provider);
const [network, deployerBalance, buyerBalance, nextNonce, feeData] = await Promise.all([
  provider.getNetwork(),
  provider.getBalance(deployer.address),
  provider.getBalance(buyer.address),
  multisig.nextNonce(),
  provider.getFeeData(),
]);
if (Number(network.chainId) !== 102031) throw new Error("Unexpected CC3 chain ID.");
if (deployer.address.toLowerCase() === buyer.address.toLowerCase()) throw new Error("The first and second signer identities must be distinct.");
const fundData = escrow.interface.encodeFunctionData("fundEscrow", [orderKey, buyer.address, termsCommitment, acceptanceExpiresAt]);
const fundGas = await provider.estimateGas({ from: buyer.address, to: governedEscrow, data: fundData, value: amount });
const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;
if (!gasPrice) throw new Error("CC3 did not return a usable gas price.");
console.log(JSON.stringify({
  mode: "READ_ONLY_PREFLIGHT_NO_SIGNATURE_OR_TRANSACTION",
  network: { chainId: Number(network.chainId), name: "Creditcoin CC3 Testnet" },
  signerSessions: { first: deployer.address, second: buyer.address, distinct: deployer.address.toLowerCase() !== buyer.address.toLowerCase() },
  governedEscrow,
  governance,
  testOrder: { orderId, orderKey, amountTctc: formatEther(amount), acceptanceExpiresAt, outcome: "refund buyer" },
  nonce: nextNonce.toString(),
  balancesTctc: { firstSigner: formatEther(deployerBalance), secondSigner: formatEther(buyerBalance) },
  gas: { fund: fundGas.toString(), estimatedFundingTctc: formatEther(fundGas * gasPrice), laterStateDependentActions: "Dispute and both multisig approvals will be estimated after this fresh order is funded and disputed; no transaction has been submitted by this preflight." },
}, null, 2));
