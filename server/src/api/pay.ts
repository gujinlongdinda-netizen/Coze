import express from "express";
import { z } from "zod";
import crypto from "crypto";
import { rechargeManager, userManager } from "../storage/database";

const router = express.Router();

// 套餐价格配置（单位：元）
const PRICING_PLANS = {
  "500words": { price: 6, name: "500字套餐", words: 500 },
  "3000words": { price: 29, name: "3,000字套餐", words: 3000 },
  "15000words": { price: 99, name: "15,000字套餐", words: 15000 },
  "7days": { price: 499, name: "7天不限字数套餐", words: 0, days: 7 },
};

// 生成 MD5 签名
function generateMD5Sign(params: {
  mch_id: string;
  out_trade_no: string;
  total_fee: string;
}): string {
  const { mch_id, out_trade_no, total_fee } = params;
  const key = process.env.MZF_MCH_KEY;

  if (!key) {
    throw new Error("MZF_MCH_KEY 未配置");
  }

  // 按照顺序拼接参数：mch_id + out_trade_no + total_fee + key
  const signStr = `${mch_id}${out_trade_no}${total_fee}${key}`;

  // 生成 MD5 签名
  return crypto.createHash("md5").update(signStr).digest("hex").toLowerCase();
}

// 生成唯一订单号
function generateOrderNo(userId: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ZB${userId.substring(0, 6)}${timestamp}${random}`;
}

// 创建支付订单
router.post("/create", async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "未登录，请先登录" });
    }

    if (!planType) {
      return res.status(400).json({ error: "请选择套餐" });
    }

    // 验证套餐类型
    const plan = PRICING_PLANS[planType as keyof typeof PRICING_PLANS];
    if (!plan) {
      return res.status(400).json({ error: "无效的套餐类型" });
    }

    // 获取配置
    const mchId = process.env.MZF_MCH_ID;
    const payUrl = process.env.MZF_PAY_URL;

    if (!mchId || !payUrl) {
      return res.status(500).json({ error: "支付配置不完整" });
    }

    // 生成订单号
    const outTradeNo = generateOrderNo(userId);

    // 价格（单位：元，保留2位小数）
    const totalFee = plan.price.toFixed(2);

    // 生成签名
    const sign = generateMD5Sign({
      mch_id: mchId,
      out_trade_no: outTradeNo,
      total_fee: totalFee,
    });

    // 构建请求参数
    const requestBody = {
      mch_id: mchId,
      out_trade_no: outTradeNo,
      total_fee: totalFee,
      body: plan.name,
      attach: JSON.stringify({
        userId,
        planType,
        words: plan.words,
        days: plan.days || 0,
      }),
      sign,
    };

    console.log("发起支付请求:", {
      mchId,
      outTradeNo,
      totalFee,
      planName: plan.name,
    });

    // 发送 POST 请求到聚合支付平台
    const response = await fetch(payUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    console.log("支付平台响应:", responseData);

    if (!response.ok) {
      console.error("支付平台请求失败:", responseData);
      return res.status(500).json({ error: "支付平台请求失败" });
    }

    // 检查返回结果
    if (responseData.code !== 0 && responseData.status !== "success") {
      console.error("支付平台返回错误:", responseData);
      return res.status(500).json({
        error: "支付平台返回错误",
        message: responseData.msg || responseData.message,
      });
    }

    // 返回支付链接
    res.json({
      success: true,
      pay_url: responseData.pay_url || responseData.url,
      order_no: outTradeNo,
      amount: totalFee,
      plan: plan,
    });
  } catch (error) {
    console.error("创建支付订单失败:", error);
    res.status(500).json({ error: "创建支付订单失败" });
  }
});

// 支付回调接口（Webhook）
router.post("/callback", async (req, res) => {
  try {
    console.log("收到支付回调:", req.body);

    const { out_trade_no, trade_status, total_fee, attach, sign } = req.body;

    // 验证签名（这里简化处理，生产环境需要验证）
    const key = process.env.MZF_MCH_KEY;
    const mchId = process.env.MZF_MCH_ID;

    if (!key || !mchId) {
      return res.status(500).json({ error: "配置不完整" });
    }

    // 生成签名进行验证
    const expectedSign = generateMD5Sign({
      mch_id: mchId,
      out_trade_no: out_trade_no,
      total_fee: total_fee,
    });

    if (sign !== expectedSign) {
      console.error("签名验证失败");
      return res.status(400).json({ error: "签名验证失败" });
    }

    // 检查支付状态
    if (trade_status !== "success" && trade_status !== "TRADE_SUCCESS") {
      return res.json({ code: 1, message: "支付未成功" });
    }

    // 解析附加信息
    const attachData = JSON.parse(attach);
    const { userId, planType, words, days } = attachData;

    // 获取套餐信息
    const plan = PRICING_PLANS[planType as keyof typeof PRICING_PLANS];

    if (!plan) {
      return res.status(400).json({ error: "套餐不存在" });
    }

    // 创建充值记录
    const recordData = {
      userId,
      packageType: plan.name,
      wordsAdded: words,
      amount: parseInt(totalFee) * 100, // 转换为分
      days: days || 0,
      tradeNo: out_trade_no,
    };

    await rechargeManager.createRechargeRecord(recordData);

    console.log("充值记录已创建:", recordData);

    res.json({ code: 0, message: "处理成功" });
  } catch (error) {
    console.error("支付回调处理失败:", error);
    res.status(500).json({ error: "处理失败" });
  }
});

// 查询订单状态
router.get("/query/:orderNo", async (req, res) => {
  try {
    const { orderNo } = req.params;

    // 查询数据库中的订单状态
    // 这里简化处理，实际应该查询数据库
    res.json({
      orderNo,
      status: "pending", // pending, success, failed
    });
  } catch (error) {
    console.error("查询订单状态失败:", error);
    res.status(500).json({ error: "查询订单状态失败" });
  }
});

export default router;
