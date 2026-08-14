import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import solc from "solc";

const projectRoot = "/home/ubuntu/verisettle";
const contractRoot = resolve(projectRoot, "contracts");
const artifactRoot = resolve(contractRoot, "artifacts");

const sources = ["VerifierInterface.sol", "VeriSettleSource.sol", "VeriSettleEscrowASC.sol"].reduce(
  (all, filename) => ({ ...all, [`contracts/${filename}`]: { content: readFileSync(resolve(contractRoot, filename), "utf8") } }),
  {}
);

function findImports(importPath) {
  const candidates = [
    resolve(projectRoot, "node_modules", importPath),
    resolve(dirname(contractRoot), importPath),
    resolve(contractRoot, importPath),
  ];
  for (const candidate of candidates) {
    try {
      return { contents: readFileSync(candidate, "utf8") };
    } catch {
      // Try the next permitted source location.
    }
  }
  return { error: `Unable to resolve import: ${importPath}` };
}

const output = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: "Solidity",
      sources,
      settings: {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "evm.methodIdentifiers", "metadata"] } },
      },
    }),
    { import: findImports }
  )
);

const errors = (output.errors ?? []).filter(issue => issue.severity === "error");
if (errors.length) {
  throw new Error(errors.map(issue => issue.formattedMessage).join("\n"));
}

mkdirSync(artifactRoot, { recursive: true });
for (const [sourceName, contracts] of Object.entries(output.contracts)) {
  for (const [contractName, contract] of Object.entries(contracts)) {
    if (!contract.evm?.bytecode?.object) continue;
    const artifact = {
      contractName,
      sourceName,
      abi: contract.abi,
      bytecode: `0x${contract.evm.bytecode.object}`,
      deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
      linkReferences: contract.evm.bytecode.linkReferences,
      methodIdentifiers: contract.evm.methodIdentifiers,
      metadata: contract.metadata,
    };
    writeFileSync(resolve(artifactRoot, `${basename(sourceName, ".sol")}-${contractName}.json`), JSON.stringify(artifact, null, 2));
  }
}

console.log(`Compiled ${Object.keys(output.contracts).length} source units with solc ${solc.version()}.`);
