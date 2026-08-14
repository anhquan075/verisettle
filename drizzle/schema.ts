import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, uniqueIndex } from "drizzle-orm/mysql-core";
import { dealEventTypeValues, dealStatusValues } from "../shared/deals";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const deals = mysqlTable(
  "deals",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: varchar("orderId", { length: 32 }).notNull().unique(),
    buyerOpenId: varchar("buyerOpenId", { length: 64 }).notNull(),
    buyerAddress: varchar("buyerAddress", { length: 42 }).notNull(),
    sellerAddress: varchar("sellerAddress", { length: 42 }).notNull(),
    amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
    currency: varchar("currency", { length: 12 }).notNull(),
    description: text("description").notNull(),
    status: mysqlEnum("status", dealStatusValues).notNull().default("draft"),
    proofPolicyNonce: varchar("proofPolicyNonce", { length: 32 }).notNull(),
    fundingTxHash: varchar("fundingTxHash", { length: 66 }),
    sepoliaSourceTxHash: varchar("sepoliaSourceTxHash", { length: 66 }).unique(),
    proofVerifiedAt: timestamp("proofVerifiedAt"),
    settlementTxHash: varchar("settlementTxHash", { length: 66 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("deals_buyer_open_id_idx").on(table.buyerOpenId)]
);

export const dealEvents = mysqlTable(
  "deal_events",
  {
    id: int("id").autoincrement().primaryKey(),
    dealId: int("dealId").notNull(),
    sequence: int("sequence").notNull(),
    type: mysqlEnum("type", dealEventTypeValues).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    detail: text("detail").notNull(),
    txHash: varchar("txHash", { length: 66 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("deal_events_deal_id_idx").on(table.dealId),
    uniqueIndex("deal_events_deal_sequence_unique").on(table.dealId, table.sequence),
  ]
);

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;
export type DealEvent = typeof dealEvents.$inferSelect;
