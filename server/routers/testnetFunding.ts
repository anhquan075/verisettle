import { TRPCError } from "@trpc/server";
import { JsonRpcProvider, Wallet, formatEther, isAddress, parseEther } from "ethers";
import { z } from "zod";
import { createTestnetFundingRequest, getTestnetFundingRequest, getTestnetFundingRequestForUser, getWalletIdentity, updateTestnetFundingRequest } from "../db";
import { ENV } from "../_core/env";
import { protectedProcedure, router } from "../_core/trpc";

const CC3_RPC = "https://rpc.cc3-testnet.creditcoin.network";
const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const CC3_DRIP = parseEther("0.005");
const SEPOLIA_DRIP = parseEther("0.001");
const MIN_CC3_RESERVE = parseEther("0.01");
const MIN_SEPOLIA_RESERVE = parseEther("0.002");
const addressInput = z.object({ walletAddress: z.string().refine(isAddress, "Use a valid EVM wallet address.") });

function safeFailureReason(error: unknown) {
  const text = error instanceof Error ? error.message : "The testnet funding transaction could not be completed.";
  return text.replace(/0x[a-fA-F0-9]{64}/g, "[transaction]").slice(0, 280);
}

async function requireLinkedWallet(userOpenId: string, rawAddress: string) {
  const walletAddress = rawAddress.toLowerCase();
  const identity = await getWalletIdentity(walletAddress);
  if (!identity || identity.userOpenId !== userOpenId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sign in with this wallet before requesting its one-time testnet funding." });
  }
  return walletAddress;
}

function requireSiweSession(sessionKind: string | undefined) {
  if (sessionKind !== "siwe") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in with your connected wallet before requesting or viewing its testnet funding eligibility." });
  }
}

async function fundingReadiness() {
  if (!ENV.testnetFunderPrivateKey) {
    return { configured: false, cc3Ready: false, sepoliaReady: false, fundingAddress: null, cc3Balance: "0", sepoliaBalance: "0" };
  }
  const funder = new Wallet(ENV.testnetFunderPrivateKey);
  const [cc3Balance, sepoliaBalance] = await Promise.all([
    new JsonRpcProvider(CC3_RPC).getBalance(funder.address),
    new JsonRpcProvider(SEPOLIA_RPC).getBalance(funder.address),
  ]);
  return {
    configured: true,
    fundingAddress: funder.address,
    cc3Balance: formatEther(cc3Balance),
    sepoliaBalance: formatEther(sepoliaBalance),
    cc3Ready: cc3Balance >= MIN_CC3_RESERVE,
    sepoliaReady: sepoliaBalance >= MIN_SEPOLIA_RESERVE,
  };
}

export const testnetFundingRouter = router({
  status: protectedProcedure.input(addressInput).query(async ({ ctx, input }) => {
    requireSiweSession(ctx.user.sessionKind);
    const walletAddress = await requireLinkedWallet(ctx.user.openId, input.walletAddress);
    const [walletRequest, userRequest, readiness] = await Promise.all([getTestnetFundingRequest(walletAddress), getTestnetFundingRequestForUser(ctx.user.openId), fundingReadiness()]);
    return { request: walletRequest ?? userRequest ?? null, claimedByAnotherLinkedWallet: Boolean(!walletRequest && userRequest), readiness, drip: { cc3Tctc: formatEther(CC3_DRIP), sepoliaEth: formatEther(SEPOLIA_DRIP) } };
  }),
  claim: protectedProcedure.input(addressInput).mutation(async ({ ctx, input }) => {
    requireSiweSession(ctx.user.sessionKind);
    const walletAddress = await requireLinkedWallet(ctx.user.openId, input.walletAddress);
    const [existing, existingForUser] = await Promise.all([getTestnetFundingRequest(walletAddress), getTestnetFundingRequestForUser(ctx.user.openId)]);
    if (existing || existingForUser) return { request: existing ?? existingForUser, alreadyClaimed: true };
    const readiness = await fundingReadiness();
    if (!readiness.configured || !readiness.cc3Ready || !readiness.sepoliaReady) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The VeriSettle testnet drip is temporarily unavailable. Use the official faucet links below and try again later." });
    }

    let request;
    try {
      request = await createTestnetFundingRequest({ walletAddress, userOpenId: ctx.user.openId });
    } catch {
      const concurrent = await getTestnetFundingRequest(walletAddress) ?? await getTestnetFundingRequestForUser(ctx.user.openId);
      if (concurrent) return { request: concurrent, alreadyClaimed: true };
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to reserve a one-time funding claim. Please retry." });
    }

    const cc3Signer = new Wallet(ENV.testnetFunderPrivateKey, new JsonRpcProvider(CC3_RPC));
    const sepoliaSigner = new Wallet(ENV.testnetFunderPrivateKey, new JsonRpcProvider(SEPOLIA_RPC));
    let cc3TxHash: string | undefined;
    let sepoliaTxHash: string | undefined;
    try {
      const cc3Receipt = await (await cc3Signer.sendTransaction({ to: walletAddress, value: CC3_DRIP })).wait();
      if (!cc3Receipt || cc3Receipt.status !== 1) throw new Error("The CC3 testnet drip was not mined successfully.");
      cc3TxHash = cc3Receipt.hash;
      const sepoliaReceipt = await (await sepoliaSigner.sendTransaction({ to: walletAddress, value: SEPOLIA_DRIP })).wait();
      if (!sepoliaReceipt || sepoliaReceipt.status !== 1) throw new Error("The Sepolia testnet drip was not mined successfully.");
      sepoliaTxHash = sepoliaReceipt.hash;
      const complete = await updateTestnetFundingRequest(walletAddress, { status: "complete", cc3TxHash, sepoliaTxHash });
      return { request: complete, alreadyClaimed: false };
    } catch (error) {
      const partial = await updateTestnetFundingRequest(walletAddress, {
        status: cc3TxHash || sepoliaTxHash ? "partial" : "failed",
        cc3TxHash,
        sepoliaTxHash,
        failureReason: safeFailureReason(error),
      });
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: partial?.status === "partial" ? "One testnet drip confirmed, but the second did not. Review the public receipt before requesting external faucet funds." : "The testnet drip did not complete. Use the official faucet links below and retry later." });
    }
  }),
});
