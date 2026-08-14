import { JsonRpcProvider, formatEther } from "ethers";
import { readFileSync } from "node:fs";

const wallet = JSON.parse(readFileSync("/home/ubuntu/.verisettle-testnet-wallet.json", "utf8"));

const networks = [
  { name: "Ethereum Sepolia", rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com" },
  { name: "Creditcoin CC3 Testnet", rpcUrl: "https://rpc.cc3-testnet.creditcoin.network" },
];

for (const network of networks) {
  const provider = new JsonRpcProvider(network.rpcUrl);
  const balance = await provider.getBalance(wallet.address);
  console.log(`${network.name}: ${formatEther(balance)} (${wallet.address})`);
}
