import { describe, expect, it } from "vitest";
import { toTermsHash } from "../shared/contracts";

const baseTerms = {
  orderId: "vs_demo_order_001",
  buyerAddress: "0xc7774720D1C14B9dA1c656b796a2a092D0b9D1c9",
  sellerAddress: "0x1111111111111111111111111111111111111111",
  amount: "0.01",
  currency: "tCTC",
  description: "VeriSettle acceptance milestone",
};

describe("toTermsHash", () => {
  it("is deterministic for the same protected commercial terms", () => {
    expect(toTermsHash(baseTerms)).toBe(toTermsHash({ ...baseTerms }));
  });

  it.each([
    ["seller", { sellerAddress: "0x2222222222222222222222222222222222222222" }],
    ["amount", { amount: "0.02" }],
    ["currency", { currency: "USDC" }],
    ["description", { description: "Different acceptance milestone" }],
    ["order ID", { orderId: "vs_demo_order_002" }],
  ])("changes when the %s changes", (_label, change) => {
    expect(toTermsHash({ ...baseTerms, ...change })).not.toBe(toTermsHash(baseTerms));
  });
});
