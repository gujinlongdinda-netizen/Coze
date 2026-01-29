import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// 用户表
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).unique(),
    phone: varchar("phone", { length: 11 }).unique(),
    remainingWords: integer("remaining_words").notNull().default(0),
    totalWordsUsed: integer("total_words_used").notNull().default(0),
    isFirstUser: boolean("is_first_user").notNull().default(true),
    inviteCode: varchar("inviteCode", { length: 16 }).default(""),
    invitedBy: varchar("invitedBy", { length: 36 }),
    freeWordBalance: integer("freeWordBalance").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    phoneIdx: index("users_phone_idx").on(table.phone),
    invitedByIdx: index("users_invitedBy_idx").on(table.invitedBy),
  })
);

// 充值记录表
export const rechargeRecords = pgTable(
  "recharge_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    packageType: varchar("package_type", { length: 50 }).notNull(), // 套餐类型
    wordsAdded: integer("words_added").notNull(), // 添加的字数
    amount: integer("amount").notNull(), // 金额（分）
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("recharge_records_user_id_idx").on(table.userId),
  })
);

// 文本处理记录表
export const textProcessingRecords = pgTable(
  "text_processing_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    originalText: text("original_text").notNull(),
    processedText: text("processed_text"),
    wordCount: integer("word_count").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("text_processing_records_user_id_idx").on(table.userId),
  })
);

// 邀请记录表
export const inviteRecords = pgTable(
  "invite_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    inviterId: varchar("inviter_id", { length: 36 }).notNull(),
    invitedUserId: varchar("invited_user_id", { length: 36 }).notNull(),
    rewardWords: integer("reward_words").default(500).notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    inviterIdIdx: index("invite_records_inviter_id_idx").on(table.inviterId),
    invitedUserUnique: unique("invite_records_invited_user_id_unique").on(table.invitedUserId),
  })
);

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().length(11).optional().or(z.literal("")),
  inviteCode: z.string().optional(),
});

export const updateUserSchema = z
  .object({
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().length(11).optional().or(z.literal("")),
    remainingWords: z.number().optional(),
    totalWordsUsed: z.number().optional(),
    isFirstUser: z.boolean().optional(),
    inviteCode: z.string().optional(),
    invitedBy: z.string().optional(),
    freeWordBalance: z.number().optional(),
  })
  .partial();

export const insertRechargeRecordSchema = z.object({
  userId: z.string().uuid(),
  packageType: z.string(),
  wordsAdded: z.number(),
  amount: z.number(),
});

export const insertTextProcessingRecordSchema = z.object({
  userId: z.string().uuid(),
  originalText: z.string(),
  processedText: z.string().nullable(),
  wordCount: z.number(),
});

export const insertInviteRecordSchema = z.object({
  inviterId: z.string().uuid(),
  invitedUserId: z.string().uuid(),
  rewardWords: z.number().optional(),
  status: z.string().optional(),
});

export const updateInviteRecordSchema = z.object({
  status: z.string().optional(),
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type RechargeRecord = typeof rechargeRecords.$inferSelect;
export type InsertRechargeRecord = z.infer<typeof insertRechargeRecordSchema>;
export type TextProcessingRecord =
  typeof textProcessingRecords.$inferSelect;
export type InsertTextProcessingRecord = z.infer<
  typeof insertTextProcessingRecordSchema
>;
export type InviteRecord = typeof inviteRecords.$inferSelect;
export type InsertInviteRecord = z.infer<typeof insertInviteRecordSchema>;
export type UpdateInviteRecord = z.infer<typeof updateInviteRecordSchema>;
