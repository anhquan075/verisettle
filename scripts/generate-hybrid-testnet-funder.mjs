import { Wallet } from "ethers";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const path = "/home/ubuntu/.verisettle-hybrid-funder.json";
if (existsSync(path)) {
  const existing = JSON.parse(readFileSync(path, "utf8"));
  console.log(JSON.stringify({ address: existing.address, createdAt: existing.createdAt, reused: true }, null, 2));
  process.exit(0);
}

const wallet = Wallet.createRandom();
const record = {
  purpose: "VeriSettle hybrid faucet — dedicated testnet-only funding wallet",
  address: wallet.address,
  privateKey: wallet.privateKey,
  createdAt: new Date().toISOString(),
  warning: "TESTNET ONLY. Never send mainnet or real assets to this wallet. Private material must be placed in secure server secret storage before any public drip is enabled.",
};
writeFileSync(path, JSON.stringify(record, null, 2), { mode: 0o600 });
chmodSync(path, 0o600);
console.log(JSON.stringify({ address: wallet.address, createdAt: record.createdAt, reused: false }, null, 2));
