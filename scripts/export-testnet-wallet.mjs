import { Wallet } from "ethers";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const sourcePath = "/home/ubuntu/.verisettle-testnet-wallet.json";
const exportPath = "/home/ubuntu/Downloads/VeriSettle-testnet-wallet.json";

if (!existsSync(sourcePath)) {
  throw new Error("The local testnet wallet is unavailable.");
}

const source = JSON.parse(readFileSync(sourcePath, "utf8"));
const wallet = new Wallet(source.privateKey);
const importPassword = randomBytes(24).toString("base64url");
const encryptedKeystore = await wallet.encrypt(importPassword);

writeFileSync(exportPath, encryptedKeystore, { mode: 0o600 });
chmodSync(exportPath, 0o600);

console.log(JSON.stringify({
  exportPath,
  address: wallet.address,
  importPassword,
  warning: "Testnet-only keystore. Do not use with mainnet assets or real funds.",
}, null, 2));
