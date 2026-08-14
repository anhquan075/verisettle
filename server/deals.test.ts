import { beforeEach, describe, expect, it, vi } from "vitest";
import { REPLAY_PROTECTION_ERROR } from "../shared/deals";

type MemoryDeal = {
  id: number; orderId: string; buyerOpenId: string; buyerAddress: string; sellerAddress: string;
  amount: string; currency: "tCTC"; description: string; status: "draft" | "funded" | "proof_pending" | "released" | "refunded" | "disputed";
  proofPolicyNonce: string; fundingTxHash: string | null; sepoliaSourceTxHash: string | null;
  proofVerifiedAt: Date | null; settlementTxHash: string | null; createdAt: Date; updatedAt: Date;
};
type MemoryEvent = { id: number; dealId: number; sequence: number; type: string; title: string; detail: string; txHash: string | null; createdAt: Date };

let deals: MemoryDeal[] = [];
let events: MemoryEvent[] = [];
let nextDealId = 1;
let nextEventId = 1;

vi.mock("./db", () => ({
  createDeal: async (input: Omit<MemoryDeal, "id" | "status" | "fundingTxHash" | "sepoliaSourceTxHash" | "proofVerifiedAt" | "settlementTxHash" | "createdAt" | "updatedAt">) => {
    const now = new Date();
    const deal: MemoryDeal = { ...input, id: nextDealId++, status: "draft", fundingTxHash: null, sepoliaSourceTxHash: null, proofVerifiedAt: null, settlementTxHash: null, createdAt: now, updatedAt: now };
    deals.push(deal); return deal;
  },
  listDealsForBuyer: async (buyerOpenId: string) => deals.filter(deal => deal.buyerOpenId === buyerOpenId),
  getDealByOrderId: async (orderId: string) => deals.find(deal => deal.orderId === orderId),
  getDealBySourceTxHash: async (txHash: string) => deals.find(deal => deal.sepoliaSourceTxHash === txHash),
  updateDeal: async (dealId: number, update: Partial<MemoryDeal>) => { const deal = deals.find(candidate => candidate.id === dealId); if (!deal) throw new Error("Deal not found"); Object.assign(deal, update, { updatedAt: new Date() }); },
  appendDealEvent: async (input: Omit<MemoryEvent, "id" | "sequence" | "createdAt" | "txHash"> & { txHash?: string }) => { const sequence = events.filter(event => event.dealId === input.dealId).length + 1; events.push({ ...input, id: nextEventId++, sequence, txHash: input.txHash ?? null, createdAt: new Date() }); },
  getDealTimeline: async (dealId: number) => events.filter(event => event.dealId === dealId).sort((a, b) => a.sequence - b.sequence),
}));

vi.mock("./onchain", () => ({
  verifyEscrowFunding: vi.fn(async () => ({ status: 1 })),
  verifySourceAcceptance: vi.fn(async () => ({ status: 1 })),
  verifyReleasedSettlement: vi.fn(async () => ({ status: 1 })),
  verifyEscrowRefund: vi.fn(async () => ({ status: 1 })),
  verifyEscrowDispute: vi.fn(async () => ({ status: 1 })),
  getProofForSourceTransaction: vi.fn(async () => ({ chainKey: 1, headerNumber: 123, txBytes: "0x", merkleProof: { root: "0x", siblings: [] }, continuityProof: { lowerEndpointDigest: "0x", roots: [] } })),
}));

import { dealsRouter } from "./routers/deals";

const buyer = { id: 1, openId: "buyer-open-id", name: "Buyer", email: "buyer@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const otherBuyer = { ...buyer, id: 2, openId: "other-buyer-open-id", email: "other@example.com", name: "Other Buyer" };
const address = (character: string) => `0x${character.repeat(40)}`;
const hash = (character: string) => `0x${character.repeat(64)}`;
const caller = () => dealsRouter.createCaller({ user: buyer } as never);
const callerFor = (user: typeof buyer | null) => dealsRouter.createCaller({ user } as never);

async function makeDeal() {
  return caller().createDeal({ buyerAddress: address("a"), sellerAddress: address("b"), amount: "2.5", currency: "tCTC", description: "Test purchase order for receipt-backed Attestcoin validation." });
}
async function fundedDeal() {
  const created = await makeDeal();
  await caller().recordFunding({ orderId: created.deal.orderId, fundingTxHash: hash("c") });
  return created;
}
async function proofPendingDeal() {
  const created = await fundedDeal();
  await caller().submitProof({ orderId: created.deal.orderId, sepoliaSourceTxHash: hash("d") });
  return created;
}

beforeEach(() => { deals = []; events = []; nextDealId = 1; nextEventId = 1; });

describe("VeriSettle receipt-backed deal lifecycle", () => {
  it("creates a nanoid Draft with native-tCTC terms and its first immutable event", async () => {
    const created = await makeDeal();
    expect(created.deal.orderId).toMatch(/^[A-Za-z0-9_-]{14}$/);
    expect(created.deal.status).toBe("draft");
    expect(created.deal.currency).toBe("tCTC");
    expect(created.events.map(event => event.type)).toEqual(["created"]);
  });

  it("moves from Draft to Funded only after a matching Creditcoin funding receipt is verified", async () => {
    const created = await makeDeal();
    const result = await caller().recordFunding({ orderId: created.deal.orderId, fundingTxHash: hash("c") });
    expect(result.deal.status).toBe("funded");
    expect(result.deal.fundingTxHash).toBe(hash("c"));
    expect(result.events.at(-1)).toMatchObject({ type: "funded", title: "Escrow funded on Creditcoin" });
  });

  it("records a release only after the real-proof settlement receipt is verified", async () => {
    const created = await proofPendingDeal();
    const released = await caller().recordSettlement({ orderId: created.deal.orderId, settlementTxHash: hash("e") });
    expect(released.deal.status).toBe("released");
    expect(released.deal.proofVerifiedAt).toBeInstanceOf(Date);
    expect(released.events.map(event => event.sequence)).toEqual([1, 2, 3, 4, 5]);
    expect(released.events.at(-1)).toMatchObject({ type: "released" });
  });

  it("rejects a source transaction already used by a settled deal with the exact replay reason", async () => {
    const first = await proofPendingDeal();
    await caller().recordSettlement({ orderId: first.deal.orderId, settlementTxHash: hash("e") });
    const second = await fundedDeal();
    await expect(caller().submitProof({ orderId: second.deal.orderId, sepoliaSourceTxHash: hash("d") })).rejects.toMatchObject({ code: "CONFLICT", message: REPLAY_PROTECTION_ERROR });
  });

  it("blocks unauthenticated callers and cross-user deal access", async () => {
    const created = await makeDeal();
    await expect(callerFor(null).listDeals()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(callerFor(otherBuyer).getDeal({ orderId: created.deal.orderId })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor(otherBuyer).recordFunding({ orderId: created.deal.orderId, fundingTxHash: hash("c") })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
