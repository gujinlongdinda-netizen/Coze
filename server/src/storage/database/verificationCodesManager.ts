import { sql, eq, and } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { verificationCodes } from "./shared/verificationCodesSchema";
import type { InsertVerificationCode, VerificationCode } from "./shared/verificationCodesSchema";

export const verificationCodesManager = {
  /**
   * 创建验证码
   */
  async createVerificationCode(data: InsertVerificationCode): Promise<void> {
    const db = await getDb();
    await db.insert(verificationCodes).values(data);
  },

  /**
   * 查找有效的验证码
   */
  async findValidCode(email: string, code: string): Promise<VerificationCode | null> {
    const db = await getDb();
    const result = await db
      .select()
      .from(verificationCodes)
      .where(and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.code, code),
        eq(verificationCodes.used, false),
        sql`${verificationCodes.expiresAt} > NOW()`
      ))
      .limit(1);

    return result[0] || null;
  },

  /**
   * 标记验证码为已使用
   */
  async markAsUsed(id: string): Promise<void> {
    const db = await getDb();
    await db
      .update(verificationCodes)
      .set({ used: true })
      .where(eq(verificationCodes.id, id));
  },

  /**
   * 清理过期验证码（可以定期执行）
   */
  async cleanExpiredCodes(): Promise<void> {
    const db = await getDb();
    await db
      .delete(verificationCodes)
      .where(sql`${verificationCodes.expiresAt} < NOW()`);
  },

  /**
   * 删除已使用的验证码
   */
  async deleteUsedCode(id: string): Promise<void> {
    const db = await getDb();
    await db
      .delete(verificationCodes)
      .where(eq(verificationCodes.id, id));
  },
};
