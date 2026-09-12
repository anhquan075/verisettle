import { TESTNET_NETWORKS } from "./contracts";

export type JudgeReceipt = {
  label: string;
  network: "Ethereum Sepolia" | "Creditcoin CC3";
  hash: string;
  shortHash: string;
  href: string;
  role: "funding" | "acceptance" | "release";
};

export type JudgeEvidencePack = {
  id: string;
  title: string;
  headline: string;
  buyer: string;
  seller: string;
  distinctWallets: boolean;
  policy: "v1_live" | "v2_deployed" | "v2_governed";
  orderId: string;
  evidenceFile: string;
  receipts: JudgeReceipt[];
};

function cc3(hash: string): JudgeReceipt["href"] {
  return `${TESTNET_NETWORKS.creditcoin.explorerUrl}/tx/${hash}`;
}

function sepolia(hash: string): JudgeReceipt["href"] {
  return `${TESTNET_NETWORKS.sepolia.explorerUrl}/tx/${hash}`;
}

function shortHash(hash: string) {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export const TWO_WALLET_V1_EVIDENCE: JudgeEvidencePack = {
  id: "two-wallet-v1",
  title: "Two-wallet V1 lifecycle",
  headline: "Buyer and seller are distinct wallets. Attestcoin verifies the acceptance receipt, not physical delivery.",
  buyer: "0xd0Af9b88cE5Aa93358AFB510E1cbd55C044F3620",
  seller: "0x36Ab1BBd6F9E64A35d81EE75ad039d9bdB2fDcAA",
  distinctWallets: true,
  policy: "v1_live",
  orderId: "2w8_iT1aNogY1b",
  evidenceFile: "contracts/test-runs/user-draft-attestcoin-release.json",
  receipts: [
    {
      label: "CC3 escrow funded",
      network: "Creditcoin CC3",
      hash: "0xba525e8b9c8e2416189826733a8fa26c457796beb1e10fec0a759e3acb6bf494",
      shortHash: shortHash("0xba525e8b9c8e2416189826733a8fa26c457796beb1e10fec0a759e3acb6bf494"),
      href: cc3("0xba525e8b9c8e2416189826733a8fa26c457796beb1e10fec0a759e3acb6bf494"),
      role: "funding",
    },
    {
      label: "Sepolia acceptance emitted",
      network: "Ethereum Sepolia",
      hash: "0x46d774edf8321e68020559751a03929176484749776ca419927277da9736ca7a",
      shortHash: shortHash("0x46d774edf8321e68020559751a03929176484749776ca419927277da9736ca7a"),
      href: sepolia("0x46d774edf8321e68020559751a03929176484749776ca419927277da9736ca7a"),
      role: "acceptance",
    },
    {
      label: "CC3 Attestcoin release",
      network: "Creditcoin CC3",
      hash: "0x03e3d0f78a720eb6042e72a00f62f54fe35bbfebc6dbed9f5ad591f801f54f3c",
      shortHash: shortHash("0x03e3d0f78a720eb6042e72a00f62f54fe35bbfebc6dbed9f5ad591f801f54f3c"),
      href: cc3("0x03e3d0f78a720eb6042e72a00f62f54fe35bbfebc6dbed9f5ad591f801f54f3c"),
      role: "release",
    },
  ],
};

export const SELF_DEAL_V1_EVIDENCE: JudgeEvidencePack = {
  id: "self-deal-v1",
  title: "Self-deal V1 historical run",
  headline: "Same-wallet fund → accept → release. Kept as secondary evidence of the original Attestcoin path.",
  buyer: "0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94",
  seller: "0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94",
  distinctWallets: false,
  policy: "v1_live",
  orderId: "0xf4376c974997bd09f06de4ce6b0ec7a061a1b014bb61117e2f6541b7c527067d",
  evidenceFile: "contracts/test-runs/real-proof-f4376c97.json",
  receipts: [
    {
      label: "CC3 escrow funded",
      network: "Creditcoin CC3",
      hash: "0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94",
      shortHash: "0x6975…1d94",
      href: cc3("0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94"),
      role: "funding",
    },
    {
      label: "Sepolia acceptance emitted",
      network: "Ethereum Sepolia",
      hash: "0x4b6c2c2645cea40926839e15b63c61e90d6539053a4cce3d3e68ce2f92de1d18",
      shortHash: "0x4b6c…1d18",
      href: sepolia("0x4b6c2c2645cea40926839e15b63c61e90d6539053a4cce3d3e68ce2f92de1d18"),
      role: "acceptance",
    },
    {
      label: "CC3 Attestcoin release",
      network: "Creditcoin CC3",
      hash: "0x0e8c31dc7d8d42066e4285d2362547a5f2cbcd1ca53a2a1662234d657b3dd6df",
      shortHash: "0x0e8c…d6df",
      href: cc3("0x0e8c31dc7d8d42066e4285d2362547a5f2cbcd1ca53a2a1662234d657b3dd6df"),
      role: "release",
    },
  ],
};

export const FEATURED_JUDGE_EVIDENCE = TWO_WALLET_V1_EVIDENCE;
export const SECONDARY_JUDGE_EVIDENCE = SELF_DEAL_V1_EVIDENCE;
