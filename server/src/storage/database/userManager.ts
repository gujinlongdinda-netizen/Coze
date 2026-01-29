import { eq, and, SQL, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  users,
  insertUserSchema,
  updateUserSchema,
} from "./shared/schema";
import type { User, InsertUser, UpdateUser } from "./shared/schema";

export class UserManager {
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

  async createUser(data: InsertUser): Promise<User> {
    const db = await getDb();
    // 自动生成邀请码
    const inviteCode = this.generateInviteCode();
    const validated = insertUserSchema.parse({ ...data, inviteCode });
    const [user] = await db.insert(users).values(validated).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async updateUser(id: string, data: UpdateUser): Promise<User | null> {
    const db = await getDb();
    const validated = updateUserSchema.parse(data);
    const [user] = await db
      .update(users)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  }

  /**
   * 减少用户剩余字数
   */
  async decreaseRemainingWords(
    userId: string,
    words: number
  ): Promise<User | null> {
    const db = await getDb();
    const [user] = await db
      .update(users)
      .set({
        remainingWords: sql`${users.remainingWords} - ${words}`,
        totalWordsUsed: sql`${users.totalWordsUsed} + ${words}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user || null;
  }

  /**
   * 增加用户剩余字数
   */
  async increaseRemainingWords(
    userId: string,
    words: number
  ): Promise<User | null> {
    const db = await getDb();
    const [user] = await db
      .update(users)
      .set({
        remainingWords: sql`${users.remainingWords} + ${words}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user || null;
  }

  /**
   * 检查用户是否有足够的字数
   */
  async hasEnoughWords(userId: string, requiredWords: number): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    return user.remainingWords >= requiredWords;
  }
}

export const userManager = new UserManager();
