import express from "express";
import { z } from "zod";
import { rechargeManager, userManager } from "../storage/database";
import type { InsertRechargeRecord } from "../storage/database";

const router = express.Router();

// 获取所有充值套餐
router.get("/plans", async (req, res) => {
  try {
    const plans = rechargeManager.getPricingPlans();
    res.json({ plans });
  } catch (error) {
    console.error("获取充值套餐失败:", error);
    res.status(500).json({ error: "获取充值套餐失败" });
  }
});

// 计算文本字数和费用
router.post("/calculate", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "请输入文本" });
    }

    const wordCount = rechargeManager.calculateWordCount(text);
    const cost = rechargeManager.calculateCost(wordCount);

    res.json({
      wordCount,
      cost,
      costInYuan: cost / 100, // 转换为元
    });
  } catch (error) {
    console.error("计算费用失败:", error);
    res.status(500).json({ error: "计算费用失败" });
  }
});

// 创建充值订单（模拟支付）
router.post("/create-order", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "未登录" });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "请选择套餐" });
    }

    // 获取套餐信息
    const plan = rechargeManager.getPricingPlanById(planId);

    if (!plan) {
      return res.status(404).json({ error: "套餐不存在" });
    }

    // 新人体验套餐免费，不需要支付
    if (plan.price === 0) {
      // 检查是否是首次使用
      const user = await userManager.getUserById(userId);
      if (user && !user.isFirstUser) {
        return res.status(400).json({ error: "新人体验套餐仅限首次使用" });
      }

      // 创建充值记录
      const recordData: InsertRechargeRecord = {
        userId,
        packageType: plan.name,
        wordsAdded: plan.words,
        amount: plan.price,
      };

      const record = await rechargeManager.createRechargeRecord(recordData);

      // 更新用户首次使用状态
      await userManager.updateUser(userId, { isFirstUser: false });

      return res.json({
        message: "充值成功",
        record,
        user: await userManager.getUserById(userId),
      });
    }

    // 其他套餐需要支付（这里简化处理，直接返回订单信息）
    // 实际生产环境应该调用支付接口
    const orderId = `ORDER_${Date.now()}_${userId.substring(0, 8)}`;

    res.json({
      message: "订单创建成功，请支付",
      orderId,
      plan,
      // 返回支付链接（这里模拟）
      paymentUrl: `/api/recharge/confirm-payment?orderId=${orderId}&planId=${planId}`,
    });
  } catch (error) {
    console.error("创建订单失败:", error);
    res.status(500).json({ error: "创建订单失败" });
  }
});

// 确认支付（模拟支付成功）
router.post("/confirm-payment", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "未登录" });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "请选择套餐" });
    }

    // 获取套餐信息
    const plan = rechargeManager.getPricingPlanById(planId);

    if (!plan) {
      return res.status(404).json({ error: "套餐不存在" });
    }

    // 创建充值记录
    const recordData: InsertRechargeRecord = {
      userId,
      packageType: plan.name,
      wordsAdded: plan.words,
      amount: plan.price,
    };

    const record = await rechargeManager.createRechargeRecord(recordData);

    res.json({
      message: "支付成功",
      record,
      user: await userManager.getUserById(userId),
    });
  } catch (error) {
    console.error("确认支付失败:", error);
    res.status(500).json({ error: "确认支付失败" });
  }
});

// 获取充值记录
router.get("/records", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "未登录" });
    }

    const records = await rechargeManager.getRechargeRecordsByUserId(userId);

    res.json({ records });
  } catch (error) {
    console.error("获取充值记录失败:", error);
    res.status(500).json({ error: "获取充值记录失败" });
  }
});

export default router;
