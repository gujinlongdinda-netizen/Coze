import { eq, desc } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  rechargeRecords,
  insertRechargeRecordSchema,
} from "./shared/schema";
import type { RechargeRecord, InsertRechargeRecord } from "./shared/schema";
import { userManager } from "./userManager";

export class RechargeManager {
  async createRechargeRecord(
    data: InsertRechargeRecord
  ): Promise<RechargeRecord> {
    const db = await getDb();
    const validated = insertRechargeRecordSchema.parse(data);

    // 创建充值记录
    const [record] = await db
      .insert(rechargeRecords)
      .values(validated)
      .returning();

    // 增加用户剩余字数
    await userManager.increaseRemainingWords(
      validated.userId,
      validated.wordsAdded
    );

    return record;
  }

  async getRechargeRecordsByUserId(userId: string): Promise<RechargeRecord[]> {
    const db = await getDb();
    return db
      .select()
      .from(rechargeRecords)
      .where(eq(rechargeRecords.userId, userId))
      .orderBy(desc(rechargeRecords.createdAt));
  }

  /**
   * 获取充值套餐配置
   */
  getPricingPlans() {
    return [
      {
        id: "newbie",
        name: "新人体验",
        description: "首次试用 建立信任，零成本体验",
        price: 0,
        words: 500,
        badge: "新人",
      },
      {
        id: "emergency",
        name: "单次应急",
        description: "结尾/摘要修改 随买随走，灵活方便",
        price: 600, // 6元 = 600分
        words: 500,
        unitPrice: 1.2, // 0.012元/字 = 1.2分/字
      },
      {
        id: "value",
        name: "超值套餐",
        description: "核心章节降重 主推款，单价仅 4.8 元",
        price: 2900, // 29元 = 2900分
        words: 3000,
        unitPrice: 0.967, // 29元/3000字 ≈ 0.0097元/字
        badge: "推荐",
      },
      {
        id: "full",
        name: "全篇包干",
        description: "整篇初稿降重 适合大篇幅一次性处理",
        price: 9900, // 99元 = 9900分
        words: 15000,
        unitPrice: 0.66, // 99元/15000字 = 0.0066元/字
      },
      {
        id: "unlimited",
        name: "七日无限",
        description: "深度返修/工作室 顶级权限，闭眼无限改",
        price: 49900, // 499元 = 49900分
        words: 999999, // 无限字数
        badge: "👑",
      },
    ];
  }

  /**
   * 根据套餐ID获取套餐信息
   */
  getPricingPlanById(id: string) {
    const plans = this.getPricingPlans();
    return plans.find((plan) => plan.id === id) || null;
  }

  /**
   * 计算文本字数（500字起步）
   */
  calculateWordCount(text: string): number {
    const count = text.length;
    return count < 500 ? 500 : count;
  }

  /**
   * 计算费用（每字0.012元，返回单位为分）
   */
  calculateCost(wordCount: number): number {
    return Math.ceil(wordCount * 0.012 * 100); // 转换为分
  }
}

export const rechargeManager = new RechargeManager();
