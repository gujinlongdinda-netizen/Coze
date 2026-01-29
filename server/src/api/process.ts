import express from "express";
import { LLMClient, Config } from "coze-coding-dev-sdk";
import { userManager, rechargeManager, textProcessingManager } from "../storage/database";
import type { InsertTextProcessingRecord } from "../storage/database";

const router = express.Router();

// AI处理提示词
const SYSTEM_PROMPT = `你不是在"改写文本"，而是在模拟一名真实写作者对原文进行再表达。

请严格遵循以下规则处理输入文本：

1. 主动打破 AI 常见的论述结构。不要使用"首先、其次、再次、最后、因此、综上所述"等典型总结与递进模板。 不要保持原文段落的逻辑顺序，可在不改变核心含义的前提下调整句子先后。

2. 改变表达路径，而不仅是替换词语。对同一观点，优先使用不同的叙述方式、不同的切入角度，而不是同义词替换。允许出现略微跳跃、非完全对称的逻辑连接，这是正常人类写作的特征。

3. 调整语序与句式节奏。将部分长句拆为短句。将部分短句合并为偏口语或偏叙述的复合句。长短句比例保持不均衡，避免整体节奏过于一致。

4. 保留信息，但弱化"解释感"。保留原文中的事实、概念与核心观点，不要删减关键信息。但减"解释为什么正确"的语气，让内容更像自然陈述，而非教学或论证。

5. 避免 AI 风格特征。不要出现"本文认为""可以看出""需要注意的是"等典型 AI 论文式表达。 不要在段落结尾进行机械总结。

6. 输出要求：只输出处理后的文本。不要添加任何说明、标题或处理过程。`;

// 检查字数和费用
router.post("/check", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "未登录" });
    }

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "请输入文本" });
    }

    // 计算字数
    const wordCount = rechargeManager.calculateWordCount(text);

    // 获取用户信息
    const user = await userManager.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }

    // 检查是否有足够的字数
    const hasEnough = await userManager.hasEnoughWords(userId, wordCount);

    // 计算费用
    const cost = rechargeManager.calculateCost(wordCount);

    res.json({
      wordCount,
      hasEnough,
      remainingWords: user.remainingWords,
      cost,
      costInYuan: cost / 100,
      needRecharge: !hasEnough,
    });
  } catch (error) {
    console.error("检查字数失败:", error);
    res.status(500).json({ error: "检查字数失败" });
  }
});

// 处理文本（流式输出）
router.post("/process", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "未登录" });
    }

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "请输入文本" });
    }

    // 计算字数
    const wordCount = rechargeManager.calculateWordCount(text);

    // 检查是否有足够的字数
    const hasEnough = await userManager.hasEnoughWords(userId, wordCount);

    if (!hasEnough) {
      return res.status(400).json({
        error: "字数不足，请先充值",
        wordCount,
        remainingWords: (await userManager.getUserById(userId))?.remainingWords || 0,
      });
    }

    // 创建处理记录
    const recordData: InsertTextProcessingRecord = {
      userId,
      originalText: text,
      processedText: null,
      wordCount,
    };

    const record = await textProcessingManager.createTextProcessingRecord(
      recordData
    );

    // 扣除用户字数
    await userManager.decreaseRemainingWords(userId, wordCount);

    // 设置流式响应头
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Transfer-Encoding", "chunked");

    // 初始化豆包大模型客户端（API Key自动从环境变量加载）
    const config = new Config();
    const client = new LLMClient(config);

    // 准备消息
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: text },
    ];

    let fullProcessedText = "";

    try {
      // 流式输出
      const stream = client.stream(messages, {
        model: "doubao-seed-1-8-251228",
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        if (chunk.content) {
          const content = chunk.content.toString();
          fullProcessedText += content;

          // 发送数据块
          res.write(`data: ${JSON.stringify({ content })}\n\n`);

          // 更新处理记录
          await textProcessingManager.updateTextProcessingRecord(
            record.id,
            fullProcessedText
          );
        }
      }

      // 发送完成信号
      res.write(`data: ${JSON.stringify({ done: true, recordId: record.id })}\n\n`);
      res.end();
    } catch (error) {
      console.error("AI处理失败:", error);

      // 如果处理失败，退还字数
      await userManager.increaseRemainingWords(userId, wordCount);

      res.write(
        `data: ${JSON.stringify({ error: "AI处理失败，已退还字数" })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    console.error("处理文本失败:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "处理文本失败" });
    }
  }
});

// 获取处理记录
router.get("/records", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "未登录" });
    }

    const records = await textProcessingManager.getTextProcessingRecordsByUserId(
      userId
    );

    res.json({ records });
  } catch (error) {
    console.error("获取处理记录失败:", error);
    res.status(500).json({ error: "获取处理记录失败" });
  }
});

// 获取单个处理记录
router.get("/records/:id", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "未登录" });
    }

    const { id } = req.params;

    const record = await textProcessingManager.getTextProcessingRecordById(id);

    if (!record) {
      return res.status(404).json({ error: "记录不存在" });
    }

    // 检查权限
    if (record.userId !== userId) {
      return res.status(403).json({ error: "无权访问此记录" });
    }

    res.json({ record });
  } catch (error) {
    console.error("获取处理记录失败:", error);
    res.status(500).json({ error: "获取处理记录失败" });
  }
});

export default router;
