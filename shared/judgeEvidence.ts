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
  id: "two-wallet-v1-f0a16e83",
  title: "Two-wallet V1 lifecycle",
  headline: "Buyer and seller are distinct wallets. Attestcoin verifies the acceptance receipt, not physical delivery.",
  buyer: "0xABe59F7557214907c9C8Ce1D5Ac25f302B7523A3",
  seller: "0x26321500F14eE013cBD9580120040014343C6AD5",
  distinctWallets: true,
  policy: "v1_live",
  orderId: "0xf0a16e834330693f346da92251a5b6abee36c0c9923c820f03f54419b7bdd0e5",
  evidenceFile: "contracts/test-runs/two-wallet-f0a16e83.json",
  receipts: [
    {
      label: "CC3 escrow funded",
      network: "Creditcoin CC3",
      hash: "0x804d1c2675a2ae747947961685b910db8276b1643df42bd9a299c5fdabbef372",
      shortHash: shortHash("0x804d1c2675a2ae747947961685b910db8276b1643df42bd9a299c5fdabbef372"),
      href: cc3("0x804d1c2675a2ae747947961685b910db8276b1643df42bd9a299c5fdabbef372"),
      role: "funding",
    },
    {
      label: "Sepolia acceptance emitted",
      network: "Ethereum Sepolia",
      hash: "0x71970aa7dfd99754ceb2b4ce73b6a874072325f57c9af7aed9bdf24b1b31b46a",
      shortHash: shortHash("0x71970aa7dfd99754ceb2b4ce73b6a874072325f57c9af7aed9bdf24b1b31b46a"),
      href: sepolia("0x71970aa7dfd99754ceb2b4ce73b6a874072325f57c9af7aed9bdf24b1b31b46a"),
      role: "acceptance",
    },
    {
      label: "CC3 Attestcoin release",
      network: "Creditcoin CC3",
      hash: "0x100f44bf75709e2395645cb6e348c101dde5f3c6cafde21c50bd5fb89a7a8a97",
      shortHash: shortHash("0x100f44bf75709e2395645cb6e348c101dde5f3c6cafde21c50bd5fb89a7a8a97"),
      href: cc3("0x100f44bf75709e2395645cb6e348c101dde5f3c6cafde21c50bd5fb89a7a8a97"),
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

export const TWO_WALLET_V2_EVIDENCE: JudgeEvidencePack = {
  id: "two-wallet-v2-38e0f2e2",
  title: "Two-wallet V2 EscrowReleasedV2",
  headline: "Policy-pinned V2 release. Buyer and seller are distinct. Attestcoin verifies OrderAcceptedV2, not physical delivery.",
  buyer: "0xABe59F7557214907c9C8Ce1D5Ac25f302B7523A3",
  seller: "0x26321500F14eE013cBD9580120040014343C6AD5",
  distinctWallets: true,
  policy: "v2_deployed",
  orderId: "0x38e0f2e26eb88f024c2ee087fb129e84ec2f9d2d280ec556e61200f4a990d582",
  evidenceFile: "contracts/test-runs/v2-two-wallet-38e0f2e2.json",
  receipts: [
    {
      label: "CC3 V2 escrow funded",
      network: "Creditcoin CC3",
      hash: "0xe104db9bb173c702662af216b58b7eaad93e1e6dacb2c582bb496533f753c512",
      shortHash: shortHash("0xe104db9bb173c702662af216b58b7eaad93e1e6dacb2c582bb496533f753c512"),
      href: cc3("0xe104db9bb173c702662af216b58b7eaad93e1e6dacb2c582bb496533f753c512"),
      role: "funding",
    },
    {
      label: "Sepolia OrderAcceptedV2",
      network: "Ethereum Sepolia",
      hash: "0x771d35f76ca3dba527c649f065ff63f84e6dc1f2eec80b26c320a15440ffb381",
      shortHash: shortHash("0x771d35f76ca3dba527c649f065ff63f84e6dc1f2eec80b26c320a15440ffb381"),
      href: sepolia("0x771d35f76ca3dba527c649f065ff63f84e6dc1f2eec80b26c320a15440ffb381"),
      role: "acceptance",
    },
    {
      label: "CC3 EscrowReleasedV2",
      network: "Creditcoin CC3",
      hash: "0xd3b47603f9948352199f5532a3967fff0875e2daf6c8eb2f4e46a5e4f33cda62",
      shortHash: shortHash("0xd3b47603f9948352199f5532a3967fff0875e2daf6c8eb2f4e46a5e4f33cda62"),
      href: cc3("0xd3b47603f9948352199f5532a3967fff0875e2daf6c8eb2f4e46a5e4f33cda62"),
      role: "release",
    },
  ],
};

export const FEATURED_JUDGE_EVIDENCE = TWO_WALLET_V1_EVIDENCE;
export const SECONDARY_JUDGE_EVIDENCE = SELF_DEAL_V1_EVIDENCE;
