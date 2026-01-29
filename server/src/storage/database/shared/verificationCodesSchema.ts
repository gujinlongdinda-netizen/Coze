import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// 验证码表
export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    code: text("code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull(),
    used: boolean("used").default(false).notNull(),
  },
  (table) => ({
    emailIdx: index("verification_codes_email_idx").on(table.email),
    expiresIdx: index("verification_codes_expires_idx").on(table.expiresAt),
  })
);

// Zod schemas for validation
export const insertVerificationCodeSchema = z.object({
  email: z.string().email(),
  code: z.string(),
  expiresAt: z.coerce.date(),
  used: z.boolean().default(false),
});

// TypeScript types
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;
