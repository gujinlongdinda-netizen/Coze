# 需求确认：验证码发送架构

## 背景

当前系统架构：
```
前端（浏览器）
  ↓
后端 API（/api/auth/send-code）
  ↓
Brevo API（直接调用）
```

## 问题

用户说明：
- 在 Coze 中开发：通过 Coze 内部流程调用 Brevo 发送邮箱验证码 ✅
- 部署后：前端点击"发送验证码"会持续提示 "Failed to fetch" ❌
- 原因：浏览器无法直接访问 Coze 的后端能力

## 需要确认的问题

### 方案A：后端直接调用 Brevo（当前实现）

**架构**：
```
前端（浏览器）
  ↓
后端 API（/api/auth/send-code）✅ 标准 HTTP API，支持 CORS
  ↓
Brevo API（直接调用）
```

**优点**：
- 简单直接，不需要依赖 Coze
- 已经过测试，Brevo API 调用正常
- 符合用户建议的解决方案

**缺点**：
- 如果需要通过 Coze 的工作流来发送验证码，这个方案不符合要求

---

### 方案B：后端调用 Coze 工作流

**架构**：
```
前端（浏览器）
  ↓
后端 API（/api/auth/send-code）✅ 标准 HTTP API，支持 CORS
  ↓
Coze 工作流（通过 Coze API 调用）
  ↓
Brevo API（由 Coze 工作流调用）
```

**优点**：
- 符合 Coze 的设计理念
- 可以利用 Coze 的其他能力

**缺点**：
- 需要配置 Coze API
- 需要创建 Coze 工作流
- 增加了系统的复杂度

---

## 需要确认的信息

1. **你的 Coze 工作流是否已经配置了发送验证码的功能？**
   - [ ] 是，已经配置了
   - [ ] 否，还没有配置
   - [ ] 不确定

2. **你希望后端如何发送验证码？**
   - [ ] 方案A：后端直接调用 Brevo API（当前实现）
   - [ ] 方案B：后端调用 Coze 工作流，由 Coze 调用 Brevo

3. **如果选择方案B，你是否有以下信息？**
   - [ ] Coze 的 API Key
   - [ ] Coze 工作流的 ID
   - [ ] Coze 工作流的输入参数格式

4. **当前遇到的具体错误是什么？**
   - [ ] Failed to fetch
   - [ ] CORS 错误
   - [ ] 其他错误（请说明）

---

## 可能的快速修复（如果选择方案A）

如果选择方案A（后端直接调用 Brevo），并且仍然遇到 "Failed to fetch" 问题，可能的原因：

### 原因1：CORS 配置问题

**当前配置**（server/src/index.ts）：
```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || "https://zhibishop.cn"
    : ["http://localhost:5000", ...],
  credentials: true,
}));
```

**问题**：如果网站部署在其他域名（不是 zhibishop.cn），CORS 配置可能不正确。

**修复**：
```bash
# 在 .env 或 .env.production 中添加
FRONTEND_URL=https://your-actual-domain.com
```

### 原因2：前端 API 配置问题

**当前配置**（.env.production）：
```bash
VITE_API_BASE_URL=
```

**问题**：如果前端和后端部署在不同的服务器，这个配置可能有问题。

**修复**：
```bash
# 在 .env.production 中设置
VITE_API_BASE_URL=https://your-backend-domain.com
```

### 原因3：HTTPS 问题

**问题**：如果前端是 HTTPS，但后端是 HTTP，浏览器会阻止请求。

**修复**：确保前后端都使用 HTTPS。

---

## 下一步

请回答上述问题，我将根据你的选择提供相应的解决方案。

如果选择方案A（直接调用 Brevo），我会帮助你排查 "Failed to fetch" 的具体原因。

如果选择方案B（调用 Coze 工作流），我会帮助你实现后端调用 Coze API 的功能。
