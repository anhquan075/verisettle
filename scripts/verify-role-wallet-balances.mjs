import { JsonRpcProvider, formatEther } from "ethers";

const wallets = {
  buyer: "0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620",
  seller: "0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA",
};

const sepolia = new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
const cc3 = new JsonRpcProvider("https://rpc.cc3-testnet.creditcoin.network");

const results = await Promise.all(Object.entries(wallets).map(async ([role, address]) => {
  const [sepoliaBalance, cc3Balance] = await Promise.all([sepolia.getBalance(address), cc3.getBalance(address)]);
  return { role, address, sepoliaEth: formatEther(sepoliaBalance), cc3Tctc: formatEther(cc3Balance) };
}));

console.log(JSON.stringify(results, null, 2));
