import { pgTable, index, varchar, integer, timestamp, text, unique, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { z } from "zod"

export const rechargeRecords = pgTable("recharge_records", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	packageType: varchar("package_type", { length: 50 }).notNull(),
	wordsAdded: integer("words_added").notNull(),
	amount: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("recharge_records_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const textProcessingRecords = pgTable("text_processing_records", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	originalText: text("original_text").notNull(),
	processedText: text("processed_text"),
	wordCount: integer("word_count").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("text_processing_records_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const users = pgTable("users", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	remainingWords: integer("remaining_words").default(0).notNull(),
	totalWordsUsed: integer("total_words_used").default(0).notNull(),
	isFirstUser: boolean("is_first_user").default(true).notNull(),
	inviteCode: varchar("invite_code", { length: 16 }).notNull(),
	invitedBy: varchar("invited_by", { length: 36 }),
	freeWordBalance: integer("free_word_balance").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("users_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("users_email_unique").on(table.email),
	unique("users_invite_code_unique").on(table.inviteCode),
	index("users_invited_by_idx").using("btree", table.invitedBy.asc().nullsLast().op("text_ops")),
]);

export const inviteRecords = pgTable("invite_records", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	inviterId: varchar("inviter_id", { length: 36 }).notNull(),
	invitedUserId: varchar("invited_user_id", { length: 36 }).notNull(),
	rewardWords: integer("reward_words").default(500).notNull(),
	status: varchar("status", { length: 20 }).default("pending").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("invite_records_inviter_id_idx").using("btree", table.inviterId.asc().nullsLast().op("text_ops")),
	unique("invite_records_invited_user_id_unique").on(table.invitedUserId),
]);

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  inviteCode: z.string().optional(),
});

export const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
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
