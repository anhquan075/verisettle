import { JsonRpcProvider, toBeHex } from "ethers";

const provider = new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
const deployer = "0xc7774720d1c14b9da1c656b796a2a092d0b9d1c9";
const startBlock = 11_479_600;
const endBlock = 11_479_822;

const blockNumbers = Array.from({ length: endBlock - startBlock + 1 }, (_, index) => startBlock + index);

for (let offset = 0; offset < blockNumbers.length; offset += 20) {
  const batch = blockNumbers.slice(offset, offset + 20);
  const blocks = await Promise.all(
    batch.map(async blockNumber => ({
      blockNumber,
      block: await provider.send("eth_getBlockByNumber", [toBeHex(blockNumber), true]),
    }))
  );
  const match = blocks.find(({ block }) =>
    block.transactions.some(
      transaction =>
        transaction.from?.toLowerCase() === deployer &&
        transaction.to === null &&
        BigInt(transaction.nonce) === 0n
    )
  );
  if (match) {
    const creation = match.block.transactions.find(
      transaction =>
        transaction.from?.toLowerCase() === deployer &&
        transaction.to === null &&
        BigInt(transaction.nonce) === 0n
    );
    console.log(JSON.stringify({ sourceDeploymentTxHash: creation.hash, sourceDeploymentBlock: match.blockNumber }, null, 2));
    process.exit(0);
  }
}

throw new Error(`No nonce-zero contract creation by ${deployer} found between ${startBlock} and ${endBlock}.`);
