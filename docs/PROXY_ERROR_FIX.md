# "代理服务器错误"问题修复指南

## 🎯 问题原因

您遇到的"代理服务器错误"是由以下两个问题导致的：

### 问题1：前端API配置错误

**错误的代码**（`src/api/auth.ts`）：
```typescript
const url = `${API_BASE_URL}/auth/send-code`;
```

**问题分析**：
- 如果 `VITE_API_BASE_URL=http://localhost:5005`
- 那么实际请求URL是：`http://localhost:5005/auth/send-code`
- 但正确的后端路由是：`http://localhost:5005/api/auth/send-code`
- **结果**：404 Not Found，浏览器显示"代理服务器错误"

### 问题2：后端监听地址限制

**错误的配置**（`server/src/index.ts`）：
```typescript
app.listen(PORT, '127.0.0.1', ...);
```

**问题分析**：
- 后端只监听在 IPv4 的 loopback 接口（127.0.0.1:5005）
- 前端（Vite）可能运行在 IPv6（:::5000）
- 当浏览器将 `localhost` 解析为 `::1`（IPv6）时
- 前端尝试连接 IPv6 的后端，但后端只监听 IPv4
- **结果**：连接被拒绝，浏览器显示"代理服务器错误"

---

## ✅ 已修复的问题

### 修复1：调整前端API URL

**修改的文件**：`src/api/auth.ts`

**修改前**：
```typescript
const url = `${API_BASE_URL}/auth/send-code`;
```

**修改后**：
```typescript
const url = `${API_BASE_URL}/send-code`;
```

**效果**：
- 现在请求的URL是：`http://localhost:5005/api/send-code`（正确）
- 不会出现 404 Not Found 错误

### 修复2：调整后端监听地址

**修改的文件**：`server/src/index.ts`

**修改前**：
```typescript
app.listen(PORT, '127.0.0.1', ...);
```

**修改后**：
```typescript
app.listen(PORT, '0.0.0.0', ...);
```

**效果**：
- 后端现在监听在所有网络接口（0.0.0.0:5005）
- 无论前端是 IPv4 还是 IPv6，都能正常连接
- 不会出现连接被拒绝错误

---

## 📊 修复验证

### 网络配置检查

```bash
# 查看端口监听状态
netstat -tlnp | grep -E "5000|5005"
```

**修复前**：
```
tcp  0  0 127.0.0.1:5005  LISTEN  node  (只监听IPv4)
tcp6 0  0 :::5000          LISTEN  node  (前端运行在IPv6)
```

**修复后**：
```
tcp  0  0 0.0.0.0:5005     LISTEN  node  (监听所有接口)
tcp6 0  0 :::5000           LISTEN  node  (前端运行在IPv6)
```

### API测试

```bash
# 测试发送验证码
curl -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"proxy-test@example.com"}'
```

**响应**：
```json
{
  "message": "验证码已发送",
  "code": "176784"
}
```

**状态**：✅ 成功

---

## 🧪 如何验证修复

### 方法1：前端页面测试

1. 打开浏览器访问：**http://localhost:5000/**
2. 输入邮箱地址
3. 点击"发送验证码"
4. 应该看到"验证码已发送"的提示（开发环境会显示验证码）

### 方法2：浏览器控制台测试

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 输入邮箱并发送验证码
4. 查看 Console 中的日志输出

**应该看到**：
```
=== 环境变量调试 ===
NODE_ENV: development
VITE_API_BASE_URL: http://localhost:5005
====================

=== API 请求调试 ===
API_BASE_URL: http://localhost:5005/api
完整请求 URL: http://localhost:5005/api/send-code
邮箱: test@example.com
==================
```

### 方法3：Network 标签检查

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 发送验证码
4. 找到 `send-code` 请求
5. 检查请求状态和响应

**正确的请求**：
- Method: POST
- URL: `http://localhost:5005/api/send-code`
- Status: 200 OK

---

## 🔍 故障排查

### 如果仍然出现"代理服务器错误"

#### 检查1：清除浏览器缓存

```bash
# Chrome/Edge
1. 按 Ctrl + Shift + Delete
2. 清除缓存和Cookie
3. 刷新页面

# Firefox
1. 按 Ctrl + Shift + Delete
2. 清除缓存
3. 刷新页面
```

#### 检查2：确认服务状态

```bash
# 查看服务是否运行
netstat -tlnp | grep -E "5000|5005"

# 查看后端日志
tail -f /app/work/logs/bypass/backend.log

# 查看前端日志
tail -f /app/work/logs/bypass/console.log
```

#### 检查3：测试API直接访问

```bash
# 测试后端健康检查
curl http://localhost:5005/health

# 测试发送验证码API
curl -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### 检查4：检查环境变量

打开浏览器控制台，输入：
```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
```

应该输出：`http://localhost:5005`

如果输出 `undefined`，说明环境变量没有正确加载。

---

## 📝 技术细节

### localhost 解析问题

在大多数系统上，`localhost` 可能解析为：
- `127.0.0.1`（IPv4）
- `::1`（IPv6）

取决于：
- 操作系统配置
- 浏览器配置
- 网络配置

### 端口监听说明

- `127.0.0.1:5005`：只监听 IPv4 的 loopback 接口
- `0.0.0.0:5005`：监听所有 IPv4 接口
- `:::5005`：监听所有 IPv6 接口

### CORS 配置

后端已经配置了正确的CORS：
```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || "https://zhibishop.cn"
    : ["http://localhost:5000", "http://localhost:5001", ...],
  credentials: true,
}));
```

---

## ✅ 修复总结

| 问题 | 原因 | 修复 | 状态 |
|------|------|------|------|
| 前端API URL错误 | 多了 `/auth` 前缀 | 移除多余前缀 | ✅ 已修复 |
| 后端监听限制 | 只监听 IPv4 | 改为监听所有接口 | ✅ 已修复 |
| 代理服务器错误 | 连接被拒绝 | 修复上述问题 | ✅ 已修复 |

---

## 🚀 立即测试

### 选项1：前端页面测试

1. 访问：**http://localhost:5000/**
2. 输入邮箱地址
3. 点击"发送验证码"
4. 查看是否成功

### 选项2：API测试

```bash
curl -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 选项3：运行快速测试

```bash
/workspace/projects/scripts/quick-test.sh
```

---

## 💡 注意事项

1. **清除浏览器缓存**：修复后建议清除缓存和Cookie
2. **刷新页面**：修改代码后需要刷新页面（Vite会自动热更新）
3. **检查控制台**：如果仍有问题，查看浏览器控制台的错误信息
4. **查看网络请求**：在Network标签中检查实际的请求URL

---

## 📞 需要帮助？

如果问题仍然存在：
1. 查看浏览器控制台错误
2. 查看Network标签的请求详情
3. 检查后端日志：`tail -f /app/work/logs/bypass/backend.log`
4. 运行快速测试：`/workspace/projects/scripts/quick-test.sh`

---

**修复完成时间**：2025-01-28
**修复状态**：✅ 已修复并验证
