import { AbiCoder, getAddress, keccak256, parseUnits, toUtf8Bytes, ZeroAddress } from "ethers";

export type DealPolicyVersion = "v1_live" | "v2_draft" | "v2_deployed";

export const V2_POLICY_VERSION = 2;
export const V2_TERMS_SCHEMA_VERSION = 2;
export const V2_FINALITY_MODE_ATTESTED_CONFIRMATIONS = 1;
export const V2_POLICY_DOMAIN_SEPARATOR = keccak256(toUtf8Bytes("VERISETTLE_SETTLEMENT_POLICY"));
export const V2_TERMS_DOMAIN_SEPARATOR = keccak256(toUtf8Bytes("VERISETTLE_TERMS_COMMITMENT"));
export const V2_ORDER_ACCEPTED_EVENT_SIGNATURE = keccak256(
  toUtf8Bytes("OrderAcceptedV2(bytes32,address,address,bytes32,bytes32,uint64)")
);
export const V2_POLICY_DEFAULTS = {
  sourceChainKey: 1,
  termsSchemaVersion: V2_TERMS_SCHEMA_VERSION,
  finalityMode: V2_FINALITY_MODE_ATTESTED_CONFIRMATIONS,
  minimumSourceConfirmations: 12,
  acceptanceWindowSeconds: 7 * 24 * 60 * 60,
  refundWindowSeconds: 30 * 24 * 60 * 60,
} as const;

const coder = AbiCoder.defaultAbiCoder();

function sourceAddress(value?: string) {
  const normalized = value?.trim();
  return normalized ? getAddress(normalized) : ZeroAddress;
}

export function isUnassignedV2Source(value?: string | null) {
  return !value || value.toLowerCase() === ZeroAddress.toLowerCase();
}

export type V2PolicyInput = {
  sourceContract?: string;
  sourceChainKey: number;
  termsSchemaVersion: number;
  finalityMode: number;
  minimumSourceConfirmations: number;
  acceptanceWindowSeconds: number;
  refundWindowSeconds: number;
};

export function toV2PolicyHash(input: V2PolicyInput) {
  return keccak256(
    coder.encode(
      ["bytes32", "uint16", "uint64", "address", "bytes32", "uint16", "uint8", "uint32", "uint32", "uint32"],
      [
        V2_POLICY_DOMAIN_SEPARATOR,
        V2_POLICY_VERSION,
        input.sourceChainKey,
        sourceAddress(input.sourceContract),
        V2_ORDER_ACCEPTED_EVENT_SIGNATURE,
        input.termsSchemaVersion,
        input.finalityMode,
        input.minimumSourceConfirmations,
        input.acceptanceWindowSeconds,
        input.refundWindowSeconds,
      ]
    )
  );
}

export type V2TermsCommitmentInput = {
  policyHash: string;
  orderId: string;
  buyerAddress: string;
  sellerAddress: string;
  assetKind: string;
  amount: string;
  acceptanceExpiresAt: Date;
  refundWindowSeconds: number;
  commercialDescription: string;
};

export function toV2TermsCommitmentHash(input: V2TermsCommitmentInput) {
  return keccak256(
    coder.encode(
      ["bytes32", "bytes32", "bytes32", "address", "address", "bytes32", "uint256", "uint64", "uint32", "bytes32"],
      [
        V2_TERMS_DOMAIN_SEPARATOR,
        input.policyHash,
        keccak256(toUtf8Bytes(input.orderId)),
        getAddress(input.buyerAddress),
        getAddress(input.sellerAddress),
        keccak256(toUtf8Bytes(input.assetKind.toUpperCase())),
        parseUnits(input.amount, 18),
        Math.floor(input.acceptanceExpiresAt.getTime() / 1000),
        input.refundWindowSeconds,
        keccak256(toUtf8Bytes(input.commercialDescription.trim())),
      ]
    )
  );
}

export function buildV2PolicyDraft(input: Partial<V2PolicyInput> = {}) {
  const policy: V2PolicyInput = {
    ...V2_POLICY_DEFAULTS,
    ...input,
    sourceContract: input.sourceContract?.trim() || ZeroAddress,
  };
  return { ...policy, sourceContract: sourceAddress(policy.sourceContract), policyHash: toV2PolicyHash(policy) };
}
