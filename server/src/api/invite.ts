import express from "express";
import QRCode from "qrcode";
import { inviteManager } from "../storage/database";

const router = express.Router();

// 检查是否登录的中间件
const requireLogin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: "未登录" });
  }
  next();
};

// 获取邀请信息（邀请链接、邀请记录、统计）
router.get("/info", requireLogin, async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    const inviteInfo = await inviteManager.getInviteInfo(userId);

    // 生成邀请链接
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5000";
    const inviteLink = `${frontendUrl}?invite=${inviteInfo.inviteCode}`;

    res.json({
      inviteCode: inviteInfo.inviteCode,
      inviteLink,
      stats: inviteInfo.stats,
      recentRecords: inviteInfo.recentRecords,
    });
  } catch (error) {
    console.error("获取邀请信息失败:", error);
    res.status(500).json({ error: "获取邀请信息失败" });
  }
});

// 生成邀请二维码
router.get("/qrcode", requireLogin, async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    const inviteInfo = await inviteManager.getInviteInfo(userId);

    // 生成邀请链接
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5000";
    const inviteLink = `${frontendUrl}?invite=${inviteInfo.inviteCode}`;

    // 生成二维码（带文字水印）
    const qrCodeOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    };

    // 生成二维码数据URL
    const qrCodeDataUrl = await QRCode.toDataURL(inviteLink, qrCodeOptions);

    res.json({
      qrCodeDataUrl,
      inviteLink,
    });
  } catch (error) {
    console.error("生成二维码失败:", error);
    res.status(500).json({ error: "生成二维码失败" });
  }
});

// 发放邀请奖励（当被邀请人完成首次处理后调用）
router.post("/grant-reward", requireLogin, async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    const { recordId } = req.body;

    if (!recordId) {
      return res.status(400).json({ error: "请提供邀请记录ID" });
    }

    // 检查记录是否属于当前用户
    const record = await inviteManager.getUserInvitedRecord(userId);
    if (!record || record.id !== recordId) {
      return res.status(400).json({ error: "邀请记录不存在" });
    }

    // 发放奖励
    await inviteManager.grantInviteReward(recordId);

    res.json({
      message: "奖励发放成功",
    });
  } catch (error) {
    console.error("发放邀请奖励失败:", error);
    res.status(500).json({ error: "发放邀请奖励失败" });
  }
});

// 获取邀请统计
router.get("/stats", requireLogin, async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    const stats = await inviteManager.getUserInviteStats(userId);

    res.json(stats);
  } catch (error) {
    console.error("获取邀请统计失败:", error);
    res.status(500).json({ error: "获取邀请统计失败" });
  }
});

export default router;
