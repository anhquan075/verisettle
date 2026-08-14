import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { dealEvents, deals, InsertDeal, InsertUser, siweNonces, users, walletIdentities } from "../drizzle/schema";
import type { DealEventType, DealStatus } from "../shared/deals";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createSiweNonce(input: { nonce: string; address: string; message: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(siweNonces).values(input);
}

export async function getActiveSiweNonce(nonce: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [record] = await db.select().from(siweNonces).where(and(eq(siweNonces.nonce, nonce), isNull(siweNonces.usedAt), gt(siweNonces.expiresAt, new Date()))).limit(1);
  return record;
}

export async function consumeSiweNonce(input: { nonce: string; address: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [result] = await db
    .update(siweNonces)
    .set({ usedAt: new Date() })
    .where(and(eq(siweNonces.nonce, input.nonce), eq(siweNonces.address, input.address), eq(siweNonces.message, input.message), isNull(siweNonces.usedAt), gt(siweNonces.expiresAt, new Date())));
  return result.affectedRows === 1;
}

export async function getWalletIdentity(address: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [identity] = await db.select().from(walletIdentities).where(eq(walletIdentities.address, address)).limit(1);
  return identity;
}

export async function linkWalletIdentity(input: { address: string; userOpenId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await getWalletIdentity(input.address);
  if (existing && existing.userOpenId !== input.userOpenId) {
    throw new Error("This wallet is already linked to another VeriSettle account.");
  }
  if (existing) {
    await db.update(walletIdentities).set({ lastVerifiedAt: new Date() }).where(eq(walletIdentities.id, existing.id));
    return existing;
  }
  await db.insert(walletIdentities).values(input);
  const created = await getWalletIdentity(input.address);
  if (!created) throw new Error("Failed to link wallet identity");
  return created;
}

export async function createDeal(deal: Omit<InsertDeal, "id" | "createdAt" | "updatedAt" | "status">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(deals).values({ ...deal, status: "draft" });
  const [created] = await db.select().from(deals).where(eq(deals.orderId, deal.orderId)).limit(1);
  if (!created) throw new Error("Failed to create deal");
  return created;
}

export async function listDealsForBuyer(buyerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(deals).where(eq(deals.buyerOpenId, buyerOpenId)).orderBy(desc(deals.createdAt));
}

export async function getDealByOrderId(orderId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [deal] = await db.select().from(deals).where(eq(deals.orderId, orderId)).limit(1);
  return deal;
}

export async function getDealBySourceTxHash(sepoliaSourceTxHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [deal] = await db
    .select()
    .from(deals)
    .where(eq(deals.sepoliaSourceTxHash, sepoliaSourceTxHash))
    .limit(1);
  return deal;
}

export async function updateDeal(
  dealId: number,
  update: Partial<Pick<InsertDeal, "status" | "fundingTxHash" | "sepoliaSourceTxHash" | "proofVerifiedAt" | "settlementTxHash">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(deals).set(update).where(eq(deals.id, dealId));
}

export async function appendDealEvent(input: {
  dealId: number;
  type: DealEventType;
  title: string;
  detail: string;
  txHash?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [sequenceResult] = await db
    .select({ highestSequence: sql<number>`coalesce(max(${dealEvents.sequence}), 0)` })
    .from(dealEvents)
    .where(eq(dealEvents.dealId, input.dealId));
  const sequence = Number(sequenceResult?.highestSequence ?? 0) + 1;
  await db.insert(dealEvents).values({ ...input, sequence });
}

export async function getDealTimeline(dealId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(dealEvents).where(eq(dealEvents.dealId, dealId)).orderBy(dealEvents.sequence);
}
