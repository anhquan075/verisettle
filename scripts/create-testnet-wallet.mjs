import { Wallet } from "ethers";
import { chmodSync, existsSync, writeFileSync } from "node:fs";

const walletPath = "/home/ubuntu/.verisettle-testnet-wallet.json";

if (existsSync(walletPath)) {
  throw new Error(`A local VeriSettle testnet wallet already exists at ${walletPath}.`);
}

const wallet = Wallet.createRandom();

writeFileSync(
  walletPath,
  JSON.stringify(
    {
      purpose: "VeriSettle testnet-only deployment wallet",
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

console.log(`VERISETTLE_TESTNET_ADDRESS=${wallet.address}`);
