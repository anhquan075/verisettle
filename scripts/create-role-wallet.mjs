import { Wallet } from "ethers";
import { chmodSync, existsSync, writeFileSync } from "node:fs";

const role = process.argv[2];

if (role !== "buyer" && role !== "seller") {
  throw new Error("Usage: node scripts/create-role-wallet.mjs buyer|seller");
}

const walletPath = `/home/ubuntu/.verisettle-${role}-testnet-wallet.json`;

if (existsSync(walletPath)) {
  throw new Error(`A local VeriSettle ${role} wallet already exists at ${walletPath}.`);
}

const wallet = Wallet.createRandom();

writeFileSync(
  walletPath,
  JSON.stringify(
    {
      purpose: `VeriSettle testnet-only ${role} wallet`,
      address: wallet.address,
      privateKey: wallet.privateKey,
      createdAt: new Date().toISOString(),
      warning: "Testnet only. Never use this key for mainnet assets or real funds.",
    },
    null,
    2
  ),
  { mode: 0o600 }
);
chmodSync(walletPath, 0o600);

console.log(`VERISETTLE_${role.toUpperCase()}_ADDRESS=${wallet.address}`);
