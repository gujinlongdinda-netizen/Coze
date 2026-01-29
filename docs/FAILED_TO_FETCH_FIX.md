# "Failed to fetch" 问题修复说明

## 问题描述

部署后点击"发送验证码"按钮，浏览器提示"Failed to fetch"，并且无法收到验证码。

---

## 问题根源

### 错误的配置

**`.env` 文件（修复前）**：
```bash
VITE_API_BASE_URL=http://localhost:5005/api  # ❌ 错误！
```

### 错误的请求 URL

**前端代码**（`src/api/auth.ts`）：
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5005";
const url = `${API_BASE_URL}/api/auth/send-code`;
```

**实际请求 URL**：
```
API_BASE_URL = http://localhost:5005/api
url = http://localhost:5005/api + /api/auth/send-code
    = http://localhost:5005/api/api/auth/send-code  ❌ 错误！
```

**问题**：
- 路径中 `/api` 重复了两次
- 后端没有这个路由：`/api/api/auth/send-code`
- 请求 404 Not Found
- 浏览器提示 "Failed to fetch"

---

## 修复方法

### 修改 `.env` 文件

**修复前**：
```bash
VITE_API_BASE_URL=http://localhost:5005/api  # ❌ 错误
```

**修复后**：
```bash
VITE_API_BASE_URL=http://localhost:5005  # ✅ 正确
```

### 正确的请求 URL

```
API_BASE_URL = http://localhost:5005
url = http://localhost:5005 + /api/auth/send-code
    = http://localhost:5005/api/auth/send-code  ✅ 正确！
```

---

## 环境变量配置说明

### 开发环境（`.env`）

```bash
VITE_API_BASE_URL=http://localhost:5005
NODE_ENV=development
```

**请求方式**：
- 前端直接请求后端
- URL: `http://localhost:5005/api/auth/send-code`

### 生产环境（`.env.production`）

```bash
VITE_API_BASE_URL=
NODE_ENV=production
```

**请求方式**：
- 前端使用相对路径请求
- URL: `/api/auth/send-code`
- 由 `server/preview.js` 代理到后端

---

## 配置对比表

| 环境 | 文件 | VITE_API_BASE_URL | 实际请求 URL |
|------|------|-------------------|-------------|
| **开发** | `.env` | `http://localhost:5005` | `http://localhost:5005/api/auth/send-code` |
| **生产** | `.env.production` | ``（空字符串） | `/api/auth/send-code` |

---

## 修复后的测试步骤

### 1. 清除浏览器缓存

**Chrome/Edge**：
1. 按 `Ctrl + Shift + Delete`
2. 选择"缓存的图片和文件"
3. 点击"清除数据"

**Firefox**：
1. 按 `Ctrl + Shift + Delete`
2. 选择"缓存"
3. 点击"立即清除"

### 2. 强制刷新页面

1. 访问 `http://localhost:5000`
2. 按 `Ctrl + F5` 强制刷新

### 3. 测试验证码

1. 输入邮箱地址
2. 点击"发送验证码"
3. 检查结果

### 4. 检查浏览器开发者工具

**打开开发者工具**：
- 按 `F12` 键

**检查 Console 标签**：
```
=== API 请求调试 ===
API_BASE_URL: http://localhost:5005
完整请求 URL: http://localhost:5005/api/auth/send-code
邮箱: test@example.com
==================
```

**检查 Network 标签**：
- 找到 `send-code` 请求
- 检查：
  - **Method**: POST
  - **URL**: `http://localhost:5005/api/auth/send-code`
  - **Status**: 200 OK

**预期响应**：
```json
{
  "message": "验证码已发送",
  "code": "657564"
}
```

---

## 后端路由说明

### 后端路由配置（`server/src/index.ts`）

```typescript
// API 路由
app.use("/api/auth", authRouter);
```

### 可用的 API 端点

| 端点 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 发送验证码 | POST | `/api/auth/send-code` | 发送邮箱验证码 |
| 登录 | POST | `/api/auth/login` | 使用验证码登录 |
| 获取用户信息 | GET | `/api/auth/me` | 获取当前用户信息 |
| 退出登录 | POST | `/api/auth/logout` | 退出登录 |

---

## 常见问题排查

### 问题1：仍然提示 "Failed to fetch"

**检查清单**：

1. **确认服务运行**
   ```bash
   ss -tlnp | grep -E "5000|5005"
   ```

2. **确认环境变量**
   ```bash
   cat .env | grep VITE_API_BASE_URL
   # 应该输出：VITE_API_BASE_URL=http://localhost:5005
   ```

3. **清除浏览器缓存**
   - 按 `Ctrl + Shift + Delete`
   - 清除缓存

4. **强制刷新页面**
   - 按 `Ctrl + F5`

5. **检查 Network 标签**
   - 查看请求 URL
   - 确认是 `http://localhost:5005/api/auth/send-code`
   - 而不是 `http://localhost:5005/api/api/auth/send-code`

### 问题2：请求 URL 仍然是错误的

**可能原因**：浏览器缓存了旧的 JavaScript 文件

**解决方案**：
1. 清除浏览器缓存
2. 或者使用隐私模式/无痕模式测试

### 问题3：后端返回 404 Not Found

**检查后端路由**：
```typescript
// server/src/api/auth.ts
router.post("/send-code", async (req, res) => {
  // ...
});

// server/src/index.ts
app.use("/api/auth", authRouter);
```

**完整路径**：
```
http://localhost:5005/api/auth/send-code
```

### 问题4：CORS 错误

**检查 CORS 配置**（`server/src/index.ts`）：
```typescript
app.use(cors({
  origin: [
    "http://localhost:5000",
    "http://localhost:5001",
    // ...
  ],
  credentials: true,
}));
```

**确认前端域名在允许列表中**。

---

## 部署环境验证

### 构建生产版本

```bash
# 构建（自动读取 .env.production）
pnpm deploy:build
```

### 启动生产版本

```bash
# 启动
pnpm deploy:start
```

### 测试生产版本

**访问**：`http://localhost:5000`

**Network 标签检查**：
- URL: `/api/auth/send-code`（相对路径）
- Status: 200 OK

---

## 总结

### 问题根源
- `.env` 文件配置错误：`VITE_API_BASE_URL=http://localhost:5005/api`
- 导致请求 URL 重复 `/api` 路径

### 修复方法
- 修改 `.env` 文件：`VITE_API_BASE_URL=http://localhost:5005`

### 验证步骤
1. 清除浏览器缓存
2. 强制刷新页面（Ctrl + F5）
3. 测试验证码功能
4. 检查 Network 标签确认请求 URL 正确

---

## 相关文档

- 部署验证说明：`/workspace/projects/docs/DEPLOY_VERIFICATION.md`
- 快速修复脚本：`/workspace/projects/scripts/failed-to-fetch-fix.sh`
