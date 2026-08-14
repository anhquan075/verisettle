import { Wallet } from "ethers";
import { readFileSync } from "node:fs";

const password = process.env.KEYSTORE_PASSWORD;
if (!password) throw new Error("KEYSTORE_PASSWORD is required for local verification.");

const encryptedKeystore = readFileSync("/home/ubuntu/Downloads/VeriSettle-testnet-wallet.json", "utf8");
const wallet = await Wallet.fromEncryptedJson(encryptedKeystore, password);
console.log(`VERIFIED_TESTNET_ADDRESS=${wallet.address}`);
