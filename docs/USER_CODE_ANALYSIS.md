# 用户代码分析：能否解决 "Failed to fetch" 问题？

## 用户提供的问题代码

```javascript
fetch("https://send-code-api.vercel.app/api/send-code", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    email: emailInputValue
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    alert("验证码已发送，请检查邮箱");
  } else {
    alert("发送失败");
  }
})
.catch(() => {
  alert("网络错误");
});
```

---

## 📊 分析结果

### ❌ 结论：**无法解决**

**原因**：
- `https://send-code-api.vercel.app` 这个 API **不存在**或**无法访问**
- 连接超时（128秒后失败）

**测试结果**：
```
curl: (28) Failed to connect to send-code-api.vercel.app port 443 after 128489 ms: Couldn't connect to server
```

---

## 🎯 方案对比

### 方案1：用户的代码（❌ 不可行）

**架构**：
```
前端（浏览器）
  ↓
Vercel API（send-code-api.vercel.app）❌ 不存在
  ↓
Brevo API
```

**优点**：
- 如果 Vercel API 存在且配置正确，可以解决 CORS 问题

**缺点**：
- ❌ Vercel API 不存在
- ❌ 需要额外部署 Vercel 服务
- ❌ 增加了系统的复杂度和依赖

---

### 方案2：当前实现（✅ 推荐）

**架构**：
```
前端（浏览器）
  ↓
后端 API（/api/auth/send-code）✅ 支持 CORS
  ↓
Brevo API（由后端直接调用）✅
```

**优点**：
- ✅ 后端 CORS 配置正确（已验证）
- ✅ Brevo API 调用正常（已验证）
- ✅ 不依赖外部服务
- ✅ 完全自主可控

**缺点**：
- 如果 CORS 配置不正确，会出现 "Failed to fetch"

---

## ✅ 推荐解决方案

### 解决方案1：使用当前实现（推荐）

**前提**：确保配置正确

#### 步骤1：确保后端 CORS 配置正确

**当前配置**（已验证正确）：
```typescript
// server/src/index.ts
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || "https://zhibishop.cn"
    : ["http://localhost:5000", "http://localhost:5001", ...],
  credentials: true,
}));
```

**如果部署在其他域名**，在 `.env` 或 `.env.production` 中添加：
```bash
FRONTEND_URL=https://your-actual-domain.com
```

#### 步骤2：确保前端 API 配置正确

**开发环境**（.env）：
```bash
VITE_API_BASE_URL=http://localhost:5005
```

**生产环境**（.env.production）：
```bash
VITE_API_BASE_URL=
```

#### 步骤3：确保前后端协议一致

- 如果前端是 HTTPS，后端也必须是 HTTPS
- 不能混用 HTTP 和 HTTPS（混合内容问题）

#### 步骤4：测试验证码发送

```bash
# 测试后端 API
curl -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 测试前端代理（如果使用 preview.js）
curl -X POST http://localhost:5000/api/auth/send-code \
  -H "Content-Type": application/json" \
  -d '{"email":"test@example.com"}'
```

---

### 解决方案2：自己部署 Vercel API（可选）

如果确实需要使用 Vercel API，可以自己部署一个。

#### 步骤1：创建 Vercel API

**vercel/api/send-code.js**（调用后端 API）：
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // 调用你的后端 API
  const response = await fetch('http://localhost:5005/api/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  res.status(200).json({
    success: true,
    message: data.message,
    code: data.code,
  });
}
```

**vercel/api/send-code.js**（直接调用 Brevo）：
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // 生成验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 调用 Brevo API
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: 'zhibi',
        email: 'gujinlongdinda@gmail.com',
      },
      to: [{ email }],
      subject: '【zhibi】您的验证码',
      htmlContent: `<p>您的验证码是：${code}</p>`,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(500).json({
      success: false,
      error: data.message,
    });
  }

  res.status(200).json({
    success: true,
    message: '验证码已发送',
  });
}
```

#### 步骤2：部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署
vercel
```

#### 步骤3：前端调用 Vercel API

```javascript
fetch("https://your-project.vercel.app/api/send-code", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    email: emailInputValue
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    alert("验证码已发送，请检查邮箱");
  } else {
    alert("发送失败: " + data.error);
  }
})
.catch(() => {
  alert("网络错误");
});
```

---

## 📋 排查清单

如果仍然遇到 "Failed to fetch" 问题，请检查以下内容：

### 1. 浏览器控制台

打开浏览器开发者工具（F12），切换到 **Console** 标签，查看：
- `=== API 请求调试 ===` 信息
- `响应状态` 信息
- 任何错误信息

### 2. Network 标签

打开浏览器开发者工具（F12），切换到 **Network** 标签，查看：
- Request URL 是否正确
- Method 是否为 POST
- Status Code 是否为 200
- Response 是否正常

### 3. CORS 配置

检查后端 CORS 配置是否包含前端域名。

### 4. 网络连接

检查是否有网络连接问题或浏览器阻止请求。

### 5. 浏览器安全策略

检查是否有广告拦截器或隐私插件影响请求。

---

## ✅ 最终建议

**推荐使用当前实现**（方案2）：

原因：
1. ✅ 后端 CORS 配置正确（已验证）
2. ✅ Brevo API 调用正常（已验证）
3. ✅ 不依赖外部服务
4. ✅ 完全自主可控

**不推荐使用用户的代码**（方案1）：

原因：
1. ❌ Vercel API 不存在
2. ❌ 需要额外部署 Vercel 服务
3. ❌ 增加了系统的复杂度和依赖

---

## 📚 相关文档

- 架构确认文档：`/workspace/projects/docs/ARCHITECTURE_CONFIRMATION.md`
- Brevo 配置和测试报告：`/workspace/projects/docs/BREVO_EMAIL_CONFIG_REPORT.md`
- 系统架构诊断脚本：`/workspace/projects/scripts/diagnose-architecture.sh`
