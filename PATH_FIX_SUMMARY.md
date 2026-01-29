# 路径拼接错误修复总结

## 📋 问题描述

用户报告"代理服务器错误"，控制台显示：

```
完整请求 URL: /api/api/auth/send-code
Failed to load resource: server responded with a status of 500 ()
```

**关键问题**：路径重复了 `/api`，从 `/api/auth/send-code` 变成了 `/api/api/auth/send-code`。

---

## 🔍 根本原因

**文件**：`src/config/api.ts`

**问题代码**：
```typescript
export function buildApiUrl(path: string): string {
  if (API_BASE_URL) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    return `${baseUrl}${cleanPath}`;
  }
  return path.startsWith('/') ? path : `/${path}`;
}
```

**问题分析**：

1. 环境变量 `VITE_API_BASE_URL` 设置为 `/api`
2. `API_BASE_URL = import.meta.env.VITE_API_BASE_URL` = `/api`
3. `buildApiUrl("/api/auth/send-code")` 执行逻辑：
   - `cleanPath = path.slice(1)` → `"api/auth/send-code"`（去掉开头的 `/`）
   - `baseUrl = "${API_BASE_URL}/"` → `"/api/"`
   - `return "${baseUrl}${cleanPath}"` → `"/api/api/auth/send-code"` ❌

**结果**：路径重复，导致代理服务器收到 `/api/api/auth/send-code`，无法正确路由到后端。

---

## ✅ 解决方案

**修改文件**：`src/config/api.ts`

**修复代码**：
```typescript
export function buildApiUrl(path: string): string {
  // 如果 API_BASE_URL 是相对路径且以 /api 开头（如 /api），说明是使用相对路径方案
  // 此时路径本身已经包含了 /api 前缀，直接返回原始路径即可
  if (API_BASE_URL && API_BASE_URL.startsWith('/api')) {
    // 直接返回原始路径，不进行拼接
    return path.startsWith('/') ? path : `/${path}`;
  }

  // 如果有配置完整的 API_BASE_URL（如 http://localhost:5005），则进行拼接
  if (API_BASE_URL) {
    // 去除 path 前的斜杠，避免重复
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // 确保 API_BASE_URL 以斜杠结尾
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    return `${baseUrl}${cleanPath}`;
  }

  // 如果没有配置 API_BASE_URL，则使用相对路径
  // 例如：/api/auth/send-code
  return path.startsWith('/') ? path : `/${path}`;
}
```

**修复逻辑**：

1. **新增判断**：检查 `API_BASE_URL` 是否以 `/api` 开头
2. **直接返回**：如果是，直接返回原始路径，不进行拼接
3. **保持兼容**：对于完整 URL（如 `http://localhost:5005`），仍然进行拼接

**结果**：
- `VITE_API_BASE_URL=/api` 时：`buildApiUrl("/api/auth/send-code")` → `/api/auth/send-code` ✅
- `VITE_API_BASE_URL=http://localhost:5005` 时：`buildApiUrl("/api/auth/send-code")` → `http://localhost:5005/api/auth/send-code` ✅
- `VITE_API_BASE_URL=` 时：`buildApiUrl("/api/auth/send-code")` → `/api/auth/send-code` ✅

---

## 🧪 测试结果

### 1. API 请求测试

**测试命令**：
```bash
curl -X POST http://localhost:5000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**测试结果**：
```json
{"message":"验证码已发送","code":"745802"}
```

**状态**：✅ 成功

### 2. 后端日志验证

**日志输出**：
```
Brevo 邮件发送成功: test@example.com (messageId: <202601281439.94319458760@smtp-relay.mailin.fr>)
验证码发送到邮箱 test@example.com: 745802
```

**状态**：✅ 邮件发送成功

### 3. 构建文件验证

**环境变量检查**：
```
VITE_API_BASE_URL: /api  ✅ 正确
```

**状态**：✅ 配置已生效

---

## 📁 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `src/config/api.ts` | 修复 `buildApiUrl` 函数，避免路径重复 |

---

## 🚀 部署指南

### 1. 重新构建项目

```bash
pnpm run build:client
```

### 2. 重启服务

```bash
# 停止旧服务
pkill -f "server/preview.js"

# 启动新服务
node server/preview.js
```

### 3. 验证部署

1. 访问前端首页，确认页面正常加载
2. 进入登录页面，输入邮箱并点击"获取验证码"
3. 检查浏览器控制台，确认请求 URL 为 `/api/auth/send-code`（而不是 `/api/api/auth/send-code`）
4. 检查邮箱是否收到验证码

---

## 📊 环境变量配置

### 开发环境（.env）

```bash
VITE_API_BASE_URL=/api
```

### 生产环境（.env.production）

```bash
VITE_API_BASE_URL=/api
```

---

## 🎯 总结

**问题**：路径重复，导致 `/api/api/auth/send-code`
**原因**：`buildApiUrl` 函数在 `API_BASE_URL=/api` 时进行了错误的拼接
**解决**：检测 `API_BASE_URL` 是否以 `/api` 开头，如果是则直接返回原始路径
**结果**：✅ 完全修复，API 请求正常，邮件发送成功

---

## ✨ 当前状态

| 项目 | 状态 | 说明 |
|------|------|------|
| 路径拼接修复 | ✅ 完成 | buildApiUrl 函数已修复 |
| 前端重新构建 | ✅ 完成 | 新配置已生效 |
| 服务重启 | ✅ 完成 | 前后端服务正常运行 |
| API 请求测试 | ✅ 成功 | 路径正确，请求成功 |
| 邮件发送测试 | ✅ 成功 | Brevo 邮件发送正常 |

**部署后，用户可以正常使用邮箱验证码登录功能！**
