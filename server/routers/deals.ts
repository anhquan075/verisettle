import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  appendDealEvent,
  createDeal,
  getDealByOrderId,
  getDealBySourceTxHash,
  getDealTimeline,
  listDealsForBuyer,
  updateDeal,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getProofForSourceTransaction,
  verifyEscrowDispute,
  verifyEscrowFunding,
  verifyEscrowRefund,
  verifyReleasedSettlement,
  verifySourceAcceptance,
} from "../onchain";
import { type DealStatus, REPLAY_PROTECTION_ERROR } from "../../shared/deals";

const ethereumAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Enter a valid EVM address.");
const transactionHash = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Enter a valid 32-byte transaction hash.");
const amount = z.string().regex(/^\d+(\.\d{1,18})?$/, "Enter an amount with up to 18 decimals.");
const orderIdInput = z.object({ orderId: z.string().min(1).max(32) });

function requireStatus(currentStatus: DealStatus, allowedStatuses: DealStatus[]) {
  if (!allowedStatuses.includes(currentStatus)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `This action is not available while the deal is ${currentStatus}.`,
    });
  }
}

async function getOwnedDeal(orderId: string, buyerOpenId: string) {
  const deal = await getDealByOrderId(orderId);
  if (!deal) throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found." });
  if (deal.buyerOpenId !== buyerOpenId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this deal." });
  }
  return deal;
}

async function getDealView(orderId: string, buyerOpenId: string) {
  const deal = await getOwnedDeal(orderId, buyerOpenId);
  const events = await getDealTimeline(deal.id);
  return { deal, events };
}

function asChainError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to verify the on-chain receipt.";
  return new TRPCError({ code: "BAD_REQUEST", message });
}

export const dealsRouter = router({
  createDeal: protectedProcedure
    .input(
      z.object({
        buyerAddress: ethereumAddress,
        sellerAddress: ethereumAddress,
        amount,
        currency: z.literal("tCTC").default("tCTC"),
        description: z.string().trim().min(8).max(1_000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orderId = nanoid(14);
      const deal = await createDeal({
        orderId,
        buyerOpenId: ctx.user.openId,
        buyerAddress: input.buyerAddress,
        sellerAddress: input.sellerAddress,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        proofPolicyNonce: nanoid(18),
      });
      await appendDealEvent({
        dealId: deal.id,
        type: "created",
        title: "Purchase order created",
        detail: "Order terms are persisted. Connect a CC3 Testnet wallet to fund the native tCTC escrow.",
      });
      return getDealView(orderId, ctx.user.openId);
    }),

  listDeals: protectedProcedure.query(async ({ ctx }) => listDealsForBuyer(ctx.user.openId)),

  getDeal: protectedProcedure.input(orderIdInput).query(async ({ ctx, input }) => getDealView(input.orderId, ctx.user.openId)),

  recordFunding: protectedProcedure
    .input(orderIdInput.extend({ fundingTxHash: transactionHash }))
    .mutation(async ({ ctx, input }) => {
      const deal = await getOwnedDeal(input.orderId, ctx.user.openId);
      requireStatus(deal.status, ["draft"]);
      try {
        await verifyEscrowFunding(input.fundingTxHash, deal);
      } catch (error) {
        throw asChainError(error);
      }
      await updateDeal(deal.id, { status: "funded", fundingTxHash: input.fundingTxHash });
      await appendDealEvent({
        dealId: deal.id,
        type: "funded",
        title: "Escrow funded on Creditcoin",
        detail: "The deployed CC3 Testnet ASC emitted a matching EscrowFunded event for the persisted purchase-order terms.",
        txHash: input.fundingTxHash,
      });
      return getDealView(input.orderId, ctx.user.openId);
    }),

  submitProof: protectedProcedure
    .input(orderIdInput.extend({ sepoliaSourceTxHash: transactionHash }))
    .mutation(async ({ ctx, input }) => {
      const deal = await getOwnedDeal(input.orderId, ctx.user.openId);
      requireStatus(deal.status, ["funded"]);
      const existingSourceTxDeal = await getDealBySourceTxHash(input.sepoliaSourceTxHash);
      if (existingSourceTxDeal) {
        throw new TRPCError({
          code: "CONFLICT",
          message: existingSourceTxDeal.proofVerifiedAt
            ? REPLAY_PROTECTION_ERROR
            : "This Sepolia transaction is already reserved by an active deal.",
        });
      }
      try {
        await verifySourceAcceptance(input.sepoliaSourceTxHash, deal);
      } catch (error) {
        throw asChainError(error);
      }
      await updateDeal(deal.id, { status: "proof_pending", sepoliaSourceTxHash: input.sepoliaSourceTxHash });
      await appendDealEvent({
        dealId: deal.id,
        type: "proof_submitted",
        title: "Sepolia acceptance validated",
        detail: "The trusted source contract emitted a receipt-success OrderAccepted event that matches the stored buyer, seller, order ID, and terms hash.",
        txHash: input.sepoliaSourceTxHash,
      });
      return getDealView(input.orderId, ctx.user.openId);
    }),

  prepareProof: protectedProcedure.input(orderIdInput).mutation(async ({ ctx, input }) => {
    const deal = await getOwnedDeal(input.orderId, ctx.user.openId);
    requireStatus(deal.status, ["proof_pending"]);
    if (!deal.sepoliaSourceTxHash) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A verified Sepolia acceptance transaction is required." });
    }
    try {
      return await getProofForSourceTransaction(deal.sepoliaSourceTxHash);
    } catch (error) {
      throw asChainError(error);
    }
  }),

  recordSettlement: protectedProcedure
    .input(orderIdInput.extend({ settlementTxHash: transactionHash }))
    .mutation(async ({ ctx, input }) => {
      const deal = await getOwnedDeal(input.orderId, ctx.user.openId);
      requireStatus(deal.status, ["proof_pending"]);
      try {
        await verifyReleasedSettlement(input.settlementTxHash, deal);
      } catch (error) {
        throw asChainError(error);
      }
      await updateDeal(deal.id, { status: "released", proofVerifiedAt: new Date(), settlementTxHash: input.settlementTxHash });
      await appendDealEvent({
        dealId: deal.id,
        type: "proof_verified",
        title: "Attestcoin proof verified",
        detail: "The BlockProver accepted the proof and the ASC decoded the trusted Sepolia receipt against the protected order policy.",
        txHash: input.settlementTxHash,
      });
      await appendDealEvent({
        dealId: deal.id,
        type: "released",
        title: "Escrow released to seller",
        detail: "The deployed Creditcoin ASC emitted EscrowReleased after proof verification; the settlement is final on testnet.",
        txHash: input.settlementTxHash,
      });
      return getDealView(input.orderId, ctx.user.openId);
    }),

  recordRefund: protectedProcedure
    .input(orderIdInput.extend({ settlementTxHash: transactionHash }))
    .mutation(async ({ ctx, input }) => {
      const deal = await getOwnedDeal(input.orderId, ctx.user.openId);
      requireStatus(deal.status, ["funded"]);
      try {
        await verifyEscrowRefund(input.settlementTxHash, deal);
      } catch (error) {
        throw asChainError(error);
      }
      await updateDeal(deal.id, { status: "refunded", settlementTxHash: input.settlementTxHash });
      await appendDealEvent({
        dealId: deal.id,
        type: "refunded",
        title: "Escrow refunded on Creditcoin",
        detail: "The deployed ASC emitted EscrowRefunded after the contract refund deadline elapsed.",
        txHash: input.settlementTxHash,
      });
      return getDealView(input.orderId, ctx.user.openId);
    }),

  recordDispute: protectedProcedure
    .input(orderIdInput.extend({ reason: z.string().trim().min(8).max(500), disputeTxHash: transactionHash }))
    .mutation(async ({ ctx, input }) => {
      const deal = await getOwnedDeal(input.orderId, ctx.user.openId);
      requireStatus(deal.status, ["funded"]);
      try {
        await verifyEscrowDispute(input.disputeTxHash, deal);
      } catch (error) {
        throw asChainError(error);
      }
      await updateDeal(deal.id, { status: "disputed", settlementTxHash: input.disputeTxHash });
      await appendDealEvent({
        dealId: deal.id,
        type: "disputed",
        title: "Deal disputed on Creditcoin",
        detail: input.reason,
        txHash: input.disputeTxHash,
      });
      return getDealView(input.orderId, ctx.user.openId);
    }),

  recordReplayRejection: protectedProcedure
    .input(orderIdInput.extend({ settlementTxHash: transactionHash.optional() }))
    .mutation(async ({ ctx, input }) => {
      const deal = await getOwnedDeal(input.orderId, ctx.user.openId);
      if (!deal.proofVerifiedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Replay protection is only demonstrated after an accepted proof." });
      }
      await appendDealEvent({
        dealId: deal.id,
        type: "replay_rejected",
        title: "Replay attempt rejected",
        detail: REPLAY_PROTECTION_ERROR,
        txHash: input.settlementTxHash ?? deal.settlementTxHash ?? undefined,
      });
      throw new TRPCError({ code: "CONFLICT", message: REPLAY_PROTECTION_ERROR });
    }),
});
