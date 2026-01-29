import express from "express";
import { z } from "zod";
import { userManager, verificationCodesManager } from "../storage/database";
import { sendVerificationCodeEmail } from "../services/email";
import type { User } from "../storage/database";

const router = express.Router();

// 发送验证码
router.post("/send-code", async (req, res) => {
  try {
    const { email } = req.body;

    // 验证邮箱格式
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "请输入有效的邮箱地址" });
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    // 使用数据库存储验证码
    await verificationCodesManager.createVerificationCode({
      email,
      code,
      expiresAt,
      used: false,
    });

    // 发送验证码邮件
    const emailSent = await sendVerificationCodeEmail(email, code);

    if (!emailSent) {
      console.error(`发送邮件失败: ${email}`);
      // 生产环境返回错误
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: "发送验证码失败，请稍后重试" });
      }
      // 开发环境打印验证码，但仍然返回成功（便于测试）
      console.log(`开发环境验证码: ${email} - ${code}`);
    }

    console.log(`验证码发送到邮箱 ${email}: ${code}`);

    res.json({
      message: "验证码已发送",
      // 开发环境返回验证码，生产环境不返回
      code: process.env.NODE_ENV === "development" ? code : undefined,
    });
  } catch (error) {
    console.error("发送验证码失败:", error);
    res.status(500).json({ error: "发送验证码失败" });
  }
});

// 验证验证码并登录/注册
router.post("/login", async (req, res) => {
  try {
    const { email, code, inviteCode } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "请提供邮箱和验证码" });
    }

    // 验证验证码
    const storedCode = await verificationCodesManager.findValidCode(email, code);
    if (!storedCode) {
      return res.status(400).json({ error: "验证码已过期或不存在" });
    }

    // 标记验证码为已使用
    await verificationCodesManager.markAsUsed(storedCode.id);

    // 删除已使用的验证码（可选，也可以保留用于审计）
    await verificationCodesManager.deleteUsedCode(storedCode.id);

    // 查找或创建用户
    let user = await userManager.getUserByEmail(email);

    if (!user) {
      // 创建新用户，首次用户免费500字
      const { inviteManager } = await import("../storage/database");
      let inviterId: string | null = null;

      // 处理邀请逻辑
      if (inviteCode) {
        const inviter = await inviteManager.getInviterByCode(inviteCode);
        if (inviter) {
          inviterId = inviter.id;
        }
      }

      user = await userManager.createUser({
        email,
      });

      // 记录邀请关系
      if (inviterId) {
        await inviteManager.createInviteRecord({
          inviterId,
          invitedUserId: user.id,
          rewardWords: 500,
          status: "pending",
        });

        // 更新用户的invitedBy字段
        await userManager.updateUser(user.id, {
          invitedBy: inviterId,
        });
      }

      // 首次用户免费赠送500字
      await userManager.increaseRemainingWords(user.id, 500);
      user = await userManager.getUserById(user.id);
    }

    // 设置会话（这里简化处理，生产环境应该使用JWT）
    req.session = req.session || {};
    req.session.userId = user.id;

    res.json({
      message: "登录成功",
      user: {
        id: user.id,
        email: user.email,
        remainingWords: user.remainingWords,
        totalWordsUsed: user.totalWordsUsed,
        isFirstUser: user.isFirstUser,
        inviteCode: user.inviteCode,
        freeWordBalance: user.freeWordBalance,
      },
    });
  } catch (error) {
    console.error("登录失败:", error);
    res.status(500).json({ error: "登录失败" });
  }
});

// 获取当前用户信息
router.get("/me", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "未登录" });
    }

    const user = await userManager.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        remainingWords: user.remainingWords,
        totalWordsUsed: user.totalWordsUsed,
        isFirstUser: user.isFirstUser,
      },
    });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    res.status(500).json({ error: "获取用户信息失败" });
  }
});

// 退出登录
router.post("/logout", async (req, res) => {
  try {
    req.session = null;
    res.json({ message: "退出登录成功" });
  } catch (error) {
    console.error("退出登录失败:", error);
    res.status(500).json({ error: "退出登录失败" });
  }
});

export default router;
