import { readFileSync, writeFileSync, chmodSync } from "node:fs";

const wallet = JSON.parse(readFileSync("/home/ubuntu/.verisettle-hybrid-funder.json", "utf8"));
const output = "/home/ubuntu/Downloads/verisettle-hybrid-funder.env";
writeFileSync(output, `VERISETTLE_TESTNET_FUNDER_PRIVATE_KEY=${wallet.privateKey}\n`, { mode: 0o600 });
chmodSync(output, 0o600);
console.log(output);
