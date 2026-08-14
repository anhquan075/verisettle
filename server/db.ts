import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { dealEvents, deals, InsertDeal, InsertUser, users } from "../drizzle/schema";
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
