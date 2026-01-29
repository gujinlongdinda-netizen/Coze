# 架构说明：前端调用后端 API，后端调用 Brevo

## ✅ 架构确认

**当前架构已经完全符合要求**：
- ✅ 前端只调用后端的标准 HTTP 接口（支持 CORS、OPTIONS、HTTPS）
- ✅ 后端负责调用 Brevo API（在服务器环境中，无 CORS 问题）
- ✅ Coze 只负责 UI 和调用后端接口，不再直接参与邮件发送

---

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                            │
│                                                             │
│  ┌───────────────┐                                          │
│  │   前端 UI     │  知笔论文降 AI 率网站                     │
│  │   (React)    │  - 邮箱登录                              │
│  │   端口 5000   │  - 充值支付                              │
│  │               │  - AI 文本处理                           │
│  └───────┬───────┘  - 邀请奖励                              │
│          │                                                │
│          │ HTTP 请求                                        │
│          │ /api/auth/send-code                             │
│          │ 支持 CORS、OPTIONS、HTTPS                        │
│          ↓                                                │
└──────────┼─────────────────────────────────────────────────┘
           │
           │
┌──────────┼─────────────────────────────────────────────────┐
│          ↓                                                │
│  ┌───────────────┐                                        │
│  │  反向代理层   │  server/preview.js                     │
│  │   (可选)      │  - 开发环境：前端直接请求后端             │
│  │               │  - 生产环境：/api 请求代理到后端          │
│  └───────┬───────┘                                        │
│          │                                                │
│          ↓                                                │
│  ┌───────────────┐                                        │
│  │   后端 API    │  Express + TypeScript                  │
│  │   端口 5006   │  - /api/auth/send-code                  │
│  │               │  - /api/auth/login                     │
│  │               │  - /api/process/rewrite                 │
│  │               │  - 支持 CORS：                          │
│  │               │    - origin: https://zhibishop.cn      │
│  │               │    - credentials: true                  │
│  └───────┬───────┘                                        │
│          │                                                │
│          ↓                                                │
│  ┌───────────────┐                                        │
│  │  邮件服务层   │  server/src/services/email.ts          │
│  │               │  - sendVerificationCodeEmail()          │
│  │               │  - 使用 Brevo API                      │
│  └───────┬───────┘                                        │
│          │                                                │
└──────────┼─────────────────────────────────────────────────┘
           │
           │ HTTP 请求（服务器环境，无 CORS 问题）
           │ https://api.brevo.com/v3/smtp/email
           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Brevo 邮件服务                              │
│                                                             │
│  - 发件人：gujinlongdinda@gmail.com (zhibi)                │
│  - 邮件主题：【zhibi】您的验证码                             │
│  - 邮件内容：您的验证码是：123456                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 详细流程说明

### 1. 用户点击"发送验证码"

#### 前端请求（`src/api/auth.ts`）

```typescript
export async function sendCode(email: string): Promise<void> {
  const url = `${API_BASE_URL}/api/auth/send-code`;

  console.log('=== API 请求调试 ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('完整请求 URL:', url);
  console.log('邮箱:', email);
  console.log('==================');

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  console.log('响应状态:', response.status, response.statusText);

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "发送验证码失败");
  }

  return response.json();
}
```

**关键点**：
- 前端只调用 `/api/auth/send-code` 接口
- 支持 CORS 和 OPTIONS 预检请求
- 不直接调用 Brevo API

#### 环境配置

**开发环境**（`.env`）：
```bash
VITE_API_BASE_URL=http://localhost:5006
```

**生产环境**（`.env.production`）：
```bash
VITE_API_BASE_URL=
BACKEND_URL=http://localhost:5006
```

---

### 2. 后端接收请求（`server/src/api/auth.ts`）

```typescript
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
```

---

### 3. 后端调用 Brevo API（`server/src/services/email.ts`）

```typescript
export async function sendVerificationCodeEmail(
  email: string,
  code: string
): Promise<boolean> {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "gujinlongdinda@gmail.com";
    const senderName = process.env.BREVO_SENDER_NAME || "zhibi";

    if (!brevoApiKey) {
      console.error("Brevo API Key 未配置");
      return false;
    }

    const requestBody = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: email,
          name: "用户",
        },
      ],
      subject: "【zhibi】您的验证码",
      htmlContent: `
        <html>
          <body>
            <p>您好，</p>
            <p>您的验证码是：<strong>${code}</strong></p>
            <p>验证码有效期为 5 分钟，请尽快使用。</p>
            <p>如非本人操作，请忽略此邮件。</p>
            <p>感谢您的使用！</p>
            <p>zhibi 团队</p>
          </body>
        </html>
      `,
    };

    console.log("发送验证码邮件到邮箱:", email);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("发送邮件失败:", response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log("邮件发送成功:", data.messageId);
    return true;
  } catch (error) {
    console.error("发送邮件异常:", error);
    return false;
  }
}
```

**关键点**：
- 后端在服务器环境中调用 Brevo API
- 不受浏览器 CORS 策略限制
- 使用环境变量配置 Brevo API Key

---

### 4. CORS 配置（`server/src/index.ts`）

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || "https://zhibishop.cn"
    : ["http://localhost:5000", "http://localhost:5001", ...],
  credentials: true,
}));
```

**支持**：
- ✅ CORS（跨域资源共享）
- ✅ OPTIONS 预检请求
- ✅ HTTPS
- ✅ credentials（携带 Cookie）

---

## 🔍 问题诊断：为什么会出现 "Failed to fetch"？

### 问题原因：端口不匹配

#### 部署环境的请求流程

**前端**：
```typescript
const url = `${API_BASE_URL}/api/auth/send-code`;
// API_BASE_URL = '' (空字符串)
// url = '/api/auth/send-code'
```

**反向代理**（`server/preview.js`）：
```javascript
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5005';
// ❌ 默认是 5005，但后端实际运行在 5006

function proxyRequest(req, res) {
  const url = new URL(req.url, BACKEND_URL);
  // url = 'http://localhost:5005/api/auth/send-code' ❌
  // 但后端实际运行在 'http://localhost:5006' ✅
  // ...
}
```

**后端**（`server/src/index.ts`）：
```typescript
const PORT = process.env.SERVER_PORT || 5006;  // 默认 5006 端口
app.listen(PORT, '0.0.0.0', () => {
  console.log(`知笔后端服务运行在端口 ${PORT}`);
});
```

### 请求失败链路

```
前端：/api/auth/send-code
  ↓
反向代理：http://localhost:5005/api/auth/send-code ❌ (端口错误)
  ↓
后端：监听端口 5006，无法响应 5005 端口的请求
  ↓
结果：Connection refused → Failed to fetch
```

---

## 🔧 解决方案

### 已修复：配置 BACKEND_URL

**修改 `.env.production`**：
```bash
# 后端服务地址（用于前端代理转发）
# server/preview.js 将 /api 请求代理到这个地址
BACKEND_URL=http://localhost:5006
```

### 正确的请求流程

```
前端：/api/auth/send-code
  ↓
反向代理：http://localhost:5006/api/auth/send-code ✅ (端口正确)
  ↓
后端：监听端口 5006，成功响应请求
  ↓
结果：验证码成功发送 ✅
```

---

## ✅ 验证步骤

### 1. 测试后端 API

```bash
curl -X POST http://localhost:5006/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**预期结果**：
```json
{
  "message": "验证码已发送",
  "code": "123456"  // 仅开发环境显示
}
```

### 2. 测试前端代理

```bash
curl -X POST http://localhost:5000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**预期结果**：
```json
{
  "message": "验证码已发送",
  "code": "123456"  // 仅开发环境显示
}
```

### 3. 浏览器测试

1. 打开浏览器开发者工具（F12）
2. 切换到 **Console** 标签
3. 输入邮箱，点击"发送验证码"
4. 查看 Console 输出：
   ```
   === API 请求调试 ===
   API_BASE_URL:
   完整请求 URL: /api/auth/send-code
   邮箱: test@example.com
   ==================
   响应状态: 200 OK
   ```

---

## 📊 架构优势

### ✅ 安全性
- Brevo API Key 仅存储在后端环境变量中
- 前端无法直接访问 Brevo API

### ✅ CORS 支持
- 后端正确配置 CORS
- 支持开发环境和生产环境的不同域名
- 支持 credentials（携带 Cookie）

### ✅ 可维护性
- 前后端分离，职责清晰
- 邮件服务集中管理
- 易于扩展和修改

### ✅ 部署友好
- 生产环境使用反向代理
- 支持静态文件托管
- 配置灵活

---

## 📚 相关文档

- **Brevo 邮件服务配置报告**：`docs/BREVO_EMAIL_CONFIG_REPORT.md`
- **用户代码分析**：`docs/USER_CODE_ANALYSIS.md`
- **架构确认文档**：`docs/ARCHITECTURE_CONFIRMATION.md`
- **系统架构诊断脚本**：`scripts/diagnose-architecture.sh`

---

## 🎯 总结

**当前架构完全符合要求**：
- ✅ 前端只调用后端的标准 HTTP 接口
- ✅ 后端负责调用 Brevo API
- ✅ 不在 Coze 前端或 Agent 中直接调用 Brevo
- ✅ 避免 CORS 和 OPTIONS 预检失败
- ✅ 支持 HTTPS

**已修复部署环境问题**：
- ✅ 配置了正确的 `BACKEND_URL=http://localhost:5006`
- ✅ 端口匹配，代理正常工作

现在，您的系统应该能够正常发送验证码了！🎉
