import { eq, and, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  users,
  inviteRecords,
  insertInviteRecordSchema,
  updateInviteRecordSchema,
} from "./shared/schema";
import type { InviteRecord, InsertInviteRecord, UpdateInviteRecord } from "./shared/schema";

export class InviteManager {
  /**
   * 生成唯一的邀请码
   */
  generateInviteCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 去除容易混淆的字符
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * 创建邀请记录
   */
  async createInviteRecord(data: InsertInviteRecord): Promise<InviteRecord> {
    const db = await getDb();
    const validated = insertInviteRecordSchema.parse(data);
    const [record] = await db.insert(inviteRecords).values(validated).returning();
    return record;
  }

  /**
   * 通过邀请码获取邀请人
   */
  async getInviterByCode(inviteCode: string): Promise<{ id: string; email: string } | null> {
    const db = await getDb();
    const [inviter] = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.inviteCode, inviteCode));
    return inviter || null;
  }

  /**
   * 获取用户的邀请记录列表
   */
  async getUserInviteRecords(userId: string): Promise<InviteRecord[]> {
    const db = await getDb();
    const records = await db
      .select()
      .from(inviteRecords)
      .where(eq(inviteRecords.inviterId, userId))
      .orderBy(inviteRecords.createdAt);
    return records;
  }

  /**
   * 获取用户邀请统计
   */
  async getUserInviteStats(userId: string) {
    const db = await getDb();
    const records = await this.getUserInviteRecords(userId);
    
    const totalInvited = records.length;
    const rewarded = records.filter(r => r.status === "completed").length;
    const pending = records.filter(r => r.status === "pending").length;
    const totalRewardedWords = records
      .filter(r => r.status === "completed")
      .reduce((sum, r) => sum + r.rewardWords, 0);

    return {
      totalInvited,
      rewarded,
      pending,
      totalRewardedWords,
    };
  }

  /**
   * 检查用户是否已被邀请（通过邀请记录表）
   */
  async isUserInvited(userId: string): Promise<boolean> {
    const db = await getDb();
    const [record] = await db
      .select()
      .from(inviteRecords)
      .where(eq(inviteRecords.invitedUserId, userId));
    return !!record;
  }

  /**
   * 获取用户被邀请的记录
   */
  async getUserInvitedRecord(userId: string): Promise<InviteRecord | null> {
    const db = await getDb();
    const [record] = await db
      .select()
      .from(inviteRecords)
      .where(eq(inviteRecords.invitedUserId, userId));
    return record || null;
  }

  /**
   * 发放邀请奖励
   */
  async grantInviteReward(recordId: string): Promise<void> {
    const db = await getDb();
    
    // 获取邀请记录
    const [record] = await db
      .select()
      .from(inviteRecords)
      .where(eq(inviteRecords.id, recordId));
    
    if (!record) {
      throw new Error("邀请记录不存在");
    }

    if (record.status === "completed") {
      return; // 已经发放过奖励
    }

    // 更新邀请人的免费字数余额
    await db
      .update(users)
      .set({
        freeWordBalance: sql`${users.freeWordBalance} + ${record.rewardWords}`,
        remainingWords: sql`${users.remainingWords} + ${record.rewardWords}`,
      })
      .where(eq(users.id, record.inviterId));

    // 更新邀请记录状态
    await db
      .update(inviteRecords)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(inviteRecords.id, recordId));
  }

  /**
   * 获取邀请人的邀请信息（用于展示）
   */
  async getInviteInfo(userId: string) {
    const db = await getDb();
    
    // 获取用户信息和邀请码
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error("用户不存在");
    }

    // 获取邀请统计
    const stats = await this.getUserInviteStats(userId);

    // 获取最近的邀请记录
    const recentRecords = await db
      .select()
      .from(inviteRecords)
      .where(eq(inviteRecords.inviterId, userId))
      .orderBy(inviteRecords.createdAt)
      .limit(10);

    return {
      inviteCode: user.inviteCode,
      stats,
      recentRecords,
    };
  }
}

export const inviteManager = new InviteManager();
