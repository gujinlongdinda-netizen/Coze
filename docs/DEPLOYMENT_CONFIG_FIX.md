# 部署环境配置修复指南

## 📊 问题分析

### 问题原因

**当前网站已部署为线上网页，但前端仍在请求 `http://localhost:5005`，这是导致 `ERR_CONNECTION_REFUSED` 和 `Failed to fetch` 的直接原因。**

### 根本原因

1. **前端硬编码 localhost**：多个 API 文件中硬编码了 `http://localhost:5005` 或 `http://localhost:5001`
2. **环境变量处理逻辑错误**：当 `VITE_API_BASE_URL` 为空字符串时，JavaScript 会将其视为 falsy 值，导致回退到 `localhost`
3. **生产环境配置不完整**：未正确配置环境变量，导致构建时注入了错误的默认值

### 影响范围

**受影响的文件**：
- `src/api/auth.ts`：硬编码 `http://localhost:5005`
- `src/api/invite.ts`：硬编码 `http://localhost:5005/api`
- `src/api/pay.ts`：硬编码 `http://localhost:5001`
- `src/lib/api.ts`：硬编码 `http://localhost:5005`
- `src/contexts/authContext.ts`：硬编码 `http://localhost:5005/api/auth/logout`

---

## ✅ 修复方案

### 修复 1：创建统一的 API 配置文件

**新建文件**：`src/config/api.ts`

```typescript
/**
 * API 配置文件
 * 统一管理 API_BASE_URL，确保在不同环境中正确工作
 */

/**
 * 获取 API 基础 URL
 *
 * 优先级：
 * 1. 环境变量 VITE_API_BASE_URL（非空字符串）
 * 2. 相对路径 ''（使用当前域名）
 *
 * 注意：绝不回退到 localhost，避免生产环境错误
 */
export const getApiBaseUrl = (): string => {
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;

  // 如果环境变量存在且非空，使用环境变量
  if (envApiUrl && envApiUrl.trim() !== "") {
    return envApiUrl.trim();
  }

  // 否则使用相对路径，由浏览器自动使用当前域名
  return "";
};

/**
 * API 基础 URL
 *
 * 使用示例：
 * - 开发环境：http://localhost:5006
 * - 生产环境：""（相对路径，使用当前域名 + /api）
 * - 云函数：https://your-function.vercel.app
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * 构建 API URL
 *
 * @param path - API 路径，例如 "/api/auth/send-code"
 * @returns 完整的 API URL
 */
export const buildApiUrl = (path: string): string => {
  // 确保 path 以 / 开头
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // 如果 API_BASE_URL 为空，返回相对路径
  if (API_BASE_URL === "") {
    return normalizedPath;
  }

  // 否则返回完整 URL
  return `${API_BASE_URL}${normalizedPath}`;
};
```

**关键改进**：
- ✅ 统一管理 API_BASE_URL
- ✅ 明确处理空字符串情况
- ✅ 绝不回退到 localhost
- ✅ 提供 `buildApiUrl()` 辅助函数

---

### 修复 2：更新所有 API 文件

#### 2.1 修复 `src/api/auth.ts`

```typescript
// 修改前
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5005";

// 修改后
import { API_BASE_URL, buildApiUrl } from "../config/api";

// 所有 API 调用使用 buildApiUrl()
const response = await fetch(buildApiUrl("/api/auth/send-code"), {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email }),
});
```

#### 2.2 修复 `src/api/invite.ts`

```typescript
// 修改前
const API_BASE_URL = "http://localhost:5005/api";

// 修改后
import { buildApiUrl } from "../config/api";

// 所有 API 调用使用 buildApiUrl()
const response = await fetch(buildApiUrl("/api/invite/info"), {
  credentials: "include",
});
```

#### 2.3 修复 `src/api/pay.ts`

```typescript
// 修改前
const API_BASE_URL = "http://localhost:5001";

// 修改后
import { buildApiUrl } from "../config/api";

// 所有 API 调用使用 buildApiUrl()
const response = await fetch(buildApiUrl("/api/pay/create"), {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ planType }),
});
```

#### 2.4 修复 `src/lib/api.ts`

```typescript
// 修改前
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5005";

// 修改后
import { buildApiUrl } from "../config/api";

// 所有 API 调用使用 buildApiUrl()
const url = buildApiUrl(endpoint);
const response = await fetch(url, {
  ...options,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    ...options.headers,
  },
});
```

#### 2.5 修复 `src/contexts/authContext.ts`

```typescript
// 修改前
await fetch("http://localhost:5005/api/auth/logout", {
  method: "POST",
  credentials: "include",
});

// 修改后
import { buildApiUrl } from "../config/api";

await fetch(buildApiUrl("/api/auth/logout"), {
  method: "POST",
  credentials: "include",
});
```

---

### 修复 3：更新环境变量配置

#### 3.1 开发环境配置（`.env`）

```bash
# 前端端口
PORT=5000

# 前端API地址
# 开发环境：http://localhost:5006（与后端 SERVER_PORT 保持一致）
VITE_API_BASE_URL=http://localhost:5006

# 后端端口
SERVER_PORT=5006

# 其他配置...
```

**关键点**：
- ✅ 开发环境使用 `http://localhost:5006`
- ✅ 与后端 `SERVER_PORT` 保持一致
- ✅ 明确指定完整的 localhost URL

#### 3.2 生产环境配置（`.env.production`）

```bash
# 生产环境配置

# 前端端口（由部署环境自动设置，这里仅为说明）
PORT=5000

# 前端API地址（重要配置）
#
# 方案1：使用相对路径（推荐，适用于前后端同域名部署）
# - 留空：使用相对路径，由浏览器自动使用当前域名
# - 示例：用户访问 https://zhibishop.cn，前端请求 /api/auth/send-code
# - 前端反向代理将 /api 请求转发到后端服务
#
# 方案2：使用完整的云函数地址（适用于前后端分离部署）
# - 填写完整的云函数地址，例如：https://your-api.vercel.app
# - 前端直接请求云函数，不经过反向代理
# - 示例：VITE_API_BASE_URL=https://your-api.vercel.app
#
# 方案3：使用完整的后端域名（适用于前后端同服务器不同端口）
# - 填写完整的后端地址，例如：https://api.zhibishop.cn
# - 前端直接请求后端域名
# - 示例：VITE_API_BASE_URL=https://api.zhibishop.cn
#
# 注意：不能使用 localhost 或 127.0.0.1，因为用户电脑上不存在该服务
VITE_API_BASE_URL=

# 后端服务地址（用于前端反向代理转发）
# 仅在方案1（使用相对路径）时需要
# server/preview.js 将 /api 请求代理到这个地址
BACKEND_URL=http://localhost:5006

# 环境
NODE_ENV=production

# Brevo 邮件服务配置
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=gujinlongdinda@gmail.com
BREVO_SENDER_NAME=zhibi
```

**关键点**：
- ✅ 方案1：`VITE_API_BASE_URL=`（空字符串，使用相对路径）
- ✅ 方案2：`VITE_API_BASE_URL=https://your-api.vercel.app`
- ✅ 方案3：`VITE_API_BASE_URL=https://api.zhibishop.cn`
- ✅ **绝不使用 localhost 或 127.0.0.1**

---

## 🚀 部署配置方案

### 方案1：前后端同域名部署（推荐）

**架构**：
```
用户浏览器
  ↓
https://zhibishop.cn（前端）
  ↓ /api/* 请求
server/preview.js（反向代理）
  ↓ http://localhost:5006
后端服务（5006端口）
```

**配置**：
```bash
# .env.production
VITE_API_BASE_URL=
BACKEND_URL=http://localhost:5006
```

**优点**：
- ✅ 无需额外的云函数服务
- ✅ 部署简单，只需一个域名
- ✅ 自动处理 CORS 问题

**缺点**：
- ⚠️ 需要确保后端服务在同一服务器上运行

**适用场景**：
- 适用于云服务器部署（如阿里云、腾讯云）
- 适用于前后端在同一服务器上运行

---

### 方案2：云函数部署（前后端分离）

**架构**：
```
用户浏览器
  ↓
https://zhibishop.cn（前端）
  ↓
https://your-api.vercel.app（云函数 API）
  ↓
后端服务
```

**配置**：
```bash
# .env.production
VITE_API_BASE_URL=https://your-api.vercel.app
```

**优点**：
- ✅ 前后端完全分离
- ✅ 云函数可以自动扩缩容
- ✅ 可以使用不同的域名

**缺点**：
- ⚠️ 需要部署额外的云函数服务
- ⚠️ 需要处理 CORS 问题（云函数需要配置 CORS）
- ⚠️ 部署稍微复杂一些

**适用场景**：
- 适用于前后端部署在不同平台
- 适用于需要云函数自动扩缩容的场景

---

### 方案3：独立后端域名

**架构**：
```
用户浏览器
  ↓
https://zhibishop.cn（前端）
  ↓
https://api.zhibishop.cn（后端 API）
```

**配置**：
```bash
# .env.production
VITE_API_BASE_URL=https://api.zhibishop.cn
```

**优点**：
- ✅ 前后端完全分离
- ✅ 可以独立扩展后端服务
- ✅ 可以使用不同的域名

**缺点**：
- ⚠️ 需要配置额外的域名和 SSL 证书
- ⚠️ 需要处理 CORS 问题（后端需要配置 CORS）
- ⚠️ 需要确保后端服务高可用

**适用场景**：
- 适用于前后端独立部署
- 适用于需要独立扩展后端的场景

---

## 📋 部署检查清单

### 构建前检查

- [ ] 确认所有 API 文件已更新，移除了硬编码的 localhost
- [ ] 确认 `.env.production` 中的 `VITE_API_BASE_URL` 配置正确
- [ ] 确认 `VITE_API_BASE_URL` 不为 `localhost` 或 `127.0.0.1`
- [ ] 确认 `BACKEND_URL` 配置正确（仅方案1需要）
- [ ] 确认所有环境变量都已正确配置

### 构建后检查

```bash
# 检查构建产物中是否包含 localhost
grep -r "localhost:5005\|localhost:5001" dist/static/
```

**预期结果**：无匹配项（或仅包含注释中的 localhost）

### 部署后检查

#### 1. 检查前端资源

打开浏览器开发者工具（F12），切换到 **Console** 标签，查看：
```
=== API 请求调试 ===
API_BASE_URL: (应该显示正确的值，而不是 localhost)
完整请求 URL: /api/auth/send-code 或 https://your-api.vercel.app/api/auth/send-code
邮箱: test@example.com
==================
```

#### 2. 检查 Network 标签

打开浏览器开发者工具（F12），切换到 **Network** 标签：
- 找到 `send-code` 请求
- 检查 Request URL：
  - 方案1：`https://zhibishop.cn/api/auth/send-code` ✅
  - 方案2：`https://your-api.vercel.app/api/auth/send-code` ✅
  - 方案3：`https://api.zhibishop.cn/api/auth/send-code` ✅
  - ❌ 错误：`http://localhost:5005/api/auth/send-code`

#### 3. 测试验证码发送

1. 输入邮箱地址
2. 点击"发送验证码"
3. 检查：
   - Console 中是否显示正确的 API 请求 URL
   - Network 标签中请求是否成功（Status: 200）
   - 是否收到验证码邮件

#### 4. 测试其他 API

测试以下功能，确保所有 API 调用都正常：
- [ ] 用户登录
- [ ] 获取用户信息
- [ ] 文本处理
- [ ] 充值套餐
- [ ] 邀请功能
- [ ] 支付功能

---

## 🔍 故障排查

### 问题1：仍然请求 localhost

**症状**：
- Console 显示：`API_BASE_URL: http://localhost:5005`
- Network 标签显示：Request URL 为 `http://localhost:5005/...`

**原因**：
- 环境变量未正确注入到构建产物中

**解决方案**：
1. 检查 `.env.production` 是否存在
2. 检查 `VITE_API_BASE_URL` 配置是否正确
3. 重新构建前端：
   ```bash
   pnpm run build
   ```
4. 清除浏览器缓存后重新测试

---

### 问题2：ERR_CONNECTION_REFUSED

**症状**：
- Network 标签显示：`ERR_CONNECTION_REFUSED`
- 无法连接到 API 服务器

**原因**：
- 后端服务未启动
- 反向代理配置错误

**解决方案**：
1. 检查后端服务是否启动：
   ```bash
   curl http://localhost:5006/health
   ```
2. 检查反向代理配置（仅方案1）：
   ```bash
   curl http://localhost:5000/api/auth/send-code \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```
3. 检查防火墙配置

---

### 问题3：CORS 错误

**症状**：
- Console 显示：`Access-Control-Allow-Origin` 错误
- Network 标签显示：CORS 错误

**原因**：
- 前后端域名不一致
- 后端 CORS 配置错误

**解决方案**：
1. 检查后端 CORS 配置（`server/src/index.ts`）：
   ```typescript
   app.use(cors({
     origin: process.env.FRONTEND_URL || "https://zhibishop.cn",
     credentials: true,
   }));
   ```
2. 检查 `.env` 或 `.env.production` 中的 `FRONTEND_URL`
3. 确保前端和后端使用相同的域名或正确配置 CORS

---

### 问题4：验证码发送失败

**症状**：
- Console 显示：`发送验证码失败`
- Network 标签显示：Status 500

**原因**：
- Brevo API Key 未配置或无效
- 邮箱格式错误

**解决方案**：
1. 检查 `.env` 或 `.env.production` 中的 `BREVO_API_KEY`
2. 检查邮箱格式是否正确
3. 查看后端日志（`/app/work/logs/bypass/app.log`）

---

## 📚 相关文档

- **架构说明文档**：`docs/ARCHITECTURE_EXPLANATION.md`
- **Brevo 邮件服务配置报告**：`docs/BREVO_EMAIL_CONFIG_REPORT.md`
- **用户代码分析**：`docs/USER_CODE_ANALYSIS.md`

---

## ✅ 总结

### 修复内容

1. ✅ 创建统一的 API 配置文件（`src/config/api.ts`）
2. ✅ 修复所有 API 文件中的 localhost 硬编码
3. ✅ 更新环境变量配置（`.env` 和 `.env.production`）
4. ✅ 修复环境变量处理逻辑
5. ✅ 提供三种部署配置方案

### 关键改进

- ✅ 统一管理 API_BASE_URL
- ✅ 绝不回退到 localhost
- ✅ 支持多种部署方案
- ✅ 完整的部署检查清单
- ✅ 详细的故障排查指南

### 下一步

1. 选择合适的部署方案（推荐方案1）
2. 更新 `.env.production` 配置
3. 重新构建前端：
   ```bash
   pnpm run build
   ```
4. 部署到生产环境
5. 按照检查清单进行验证

---

**修复完成后，您的网站应该能够正常工作了！** 🎉
