import { Wallet } from "ethers";
import { readFileSync } from "node:fs";

const role = process.argv[2];
const password = process.env.KEYSTORE_PASSWORD;

if (role !== "buyer" && role !== "seller") {
  throw new Error("Usage: KEYSTORE_PASSWORD=... node scripts/verify-role-wallet.mjs buyer|seller");
}
if (!password) {
  throw new Error("KEYSTORE_PASSWORD is required for local verification.");
}

const encryptedKeystore = readFileSync(`/home/ubuntu/Downloads/VeriSettle-${role}-testnet-wallet.json`, "utf8");
const wallet = await Wallet.fromEncryptedJson(encryptedKeystore, password);
console.log(`VERIFIED_${role.toUpperCase()}_ADDRESS=${wallet.address}`);
