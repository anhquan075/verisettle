import { COOKIE_NAME } from "@shared/const";
import { TESTNET_NETWORKS } from "@shared/contracts";
import { TRPCError } from "@trpc/server";
import { getAddress, verifyMessage } from "ethers";
import { randomBytes } from "node:crypto";
import type { Request } from "express";
import { z } from "zod";
import {
  consumeSiweNonce,
  createSiweNonce,
  getActiveSiweNonce,
  getUserByOpenId,
  getWalletIdentity,
  linkWalletIdentity,
  upsertUser,
} from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { publicProcedure, router } from "../_core/trpc";

const SIWE_TTL_MS = 5 * 60 * 1000;
const SIWE_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const addressInput = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Enter a valid EVM address.");
const signatureInput = z.string().regex(/^0x[a-fA-F0-9]{130}$/, "Wallet signature is invalid.");
const allowedChainIds = [TESTNET_NETWORKS.creditcoin.chainId, TESTNET_NETWORKS.sepolia.chainId] as const;

function normalizeOrigin(origin: string) {
  const parsed = new URL(origin);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Wallet sign-in requires a secure origin." });
  }
  return parsed.origin;
}

function requestOrigin(req: Request) {
  const suppliedOrigin = req.headers.origin;
  if (typeof suppliedOrigin !== "string") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Wallet sign-in requires a browser origin." });
  }

  const origin = normalizeOrigin(suppliedOrigin);
  const requestHost = req.headers.host;
  if (!requestHost || new URL(origin).host !== requestHost) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Wallet sign-in origin does not match this application." });
  }

  const configuredOrigin = process.env.VERISETTLE_APP_ORIGIN;
  if (configuredOrigin && normalizeOrigin(configuredOrigin) !== origin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Wallet sign-in is not enabled for this origin." });
  }
  return origin;
}

function buildSiweMessage(input: { address: string; origin: string; chainId: number; nonce: string; issuedAt: Date; expiresAt: Date }) {
  const domain = new URL(input.origin).host;
  return `${domain} wants you to sign in with your Ethereum account:\n${input.address}\n\nSign in to VeriSettle. This signature does not authorize a transaction.\n\nURI: ${input.origin}\nVersion: 1\nChain ID: ${input.chainId}\nNonce: ${input.nonce}\nIssued At: ${input.issuedAt.toISOString()}\nExpiration Time: ${input.expiresAt.toISOString()}`;
}

function walletOpenId(address: string) {
  return `wallet:${address.toLowerCase()}`;
}

function walletName(address: string) {
  return `Wallet ${address.slice(0, 6)}…${address.slice(-4)}`;
}

export const walletAuthRouter = router({
  requestNonce: publicProcedure
    .input(z.object({ address: addressInput, chainId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (!allowedChainIds.includes(input.chainId as (typeof allowedChainIds)[number])) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Use Creditcoin CC3 Testnet or Ethereum Sepolia to sign in." });
      }
      const address = getAddress(input.address);
      const origin = requestOrigin(ctx.req);
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime() + SIWE_TTL_MS);
      const nonce = randomBytes(24).toString("hex");
      const message = buildSiweMessage({ address, origin, chainId: input.chainId, nonce, issuedAt, expiresAt });
      await createSiweNonce({ nonce, address, message, expiresAt });
      return { nonce, message, expiresAt, address };
    }),

  verify: publicProcedure
    .input(z.object({ address: addressInput, nonce: z.string().min(16).max(96), signature: signatureInput }))
    .mutation(async ({ ctx, input }) => {
      const address = getAddress(input.address);
      const challenge = await getActiveSiweNonce(input.nonce);
      if (!challenge || challenge.address !== address) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "This wallet sign-in challenge is unavailable or expired." });
      }

      let recoveredAddress: string;
      try {
        recoveredAddress = getAddress(verifyMessage(challenge.message, input.signature));
      } catch {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Wallet signature could not be verified." });
      }
      if (recoveredAddress !== address) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Wallet signature does not match the requested address." });
      }

      const consumed = await consumeSiweNonce({ nonce: challenge.nonce, address, message: challenge.message });
      if (!consumed) {
        throw new TRPCError({ code: "CONFLICT", message: "This wallet sign-in challenge was already used." });
      }

      const existingIdentity = await getWalletIdentity(address);
      const userOpenId = ctx.user?.openId ?? existingIdentity?.userOpenId ?? walletOpenId(address);
      if (!existingIdentity && !ctx.user) {
        await upsertUser({ openId: userOpenId, name: walletName(address), loginMethod: "siwe", lastSignedIn: new Date() });
      }
      await linkWalletIdentity({ address, userOpenId });
      const user = await getUserByOpenId(userOpenId);
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Wallet session could not be created." });

      const token = await sdk.createSessionToken(userOpenId, {
        name: user.name || walletName(address),
        expiresInMs: SIWE_SESSION_TTL_MS,
        sessionKind: "siwe",
      });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: SIWE_SESSION_TTL_MS });
      return { user, address, linked: Boolean(ctx.user) };
    }),
});

export const __walletAuthTestUtils = { buildSiweMessage, normalizeOrigin, walletOpenId, SIWE_SESSION_TTL_MS };
