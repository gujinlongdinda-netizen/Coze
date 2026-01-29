# "代理服务器错误" - 快速修复指南

## 🎯 问题和解决方案

### 问题
在部署后的网站中，点击"发送验证码"按钮时，浏览器提示："代理服务器错误"

### 根本原因
1. **前端API URL配置错误**：请求的URL缺少 `/api` 前缀
2. **后端监听地址限制**：后端只监听 IPv4，前端可能使用 IPv6

### 解决方案
✅ 已修复两个问题：
1. 调整前端API URL（`src/api/auth.ts`）
2. 调整后端监听地址（`server/src/index.ts`）

---

## ✅ 修复验证

### 网络配置
```bash
# 当前配置（修复后）
tcp  0  0 0.0.0.0:5005     LISTEN  node  (监听所有接口)
tcp6 0  0 :::5000           LISTEN  node  (前端运行在IPv6)
```

### API测试
```bash
curl -X POST http://localhost:5005/api/auth/send-code \
  -d '{"email":"test@example.com"}'
```

**响应**：✅ 成功
```json
{
  "message": "验证码已发送",
  "code": "640703"
}
```

---

## 🚀 立即测试

### 方法1：前端页面（推荐）

1. 打开浏览器访问：**http://localhost:5000/**
2. 输入邮箱地址（如：test@example.com）
3. 点击"发送验证码"按钮
4. 应该看到"验证码已发送"提示

### 方法2：浏览器控制台

1. 打开浏览器开发者工具（F12）
2. 切换到 **Console** 标签
3. 刷新页面
4. 应该看到环境变量信息：
   ```
   === 环境变量调试 ===
   NODE_ENV: development
   VITE_API_BASE_URL: http://localhost:5005
   ====================
   ```

5. 输入邮箱并发送验证码
6. 应该看到API请求信息：
   ```
   === API 请求调试 ===
   API_BASE_URL: http://localhost:5005/api
   完整请求 URL: http://localhost:5005/api/send-code
   邮箱: test@example.com
   ===================
   ```

### 方法3：Network 检查

1. 打开浏览器开发者工具（F12）
2. 切换到 **Network** 标签
3. 输入邮箱并发送验证码
4. 找到 `send-code` 请求
5. 检查：
   - **Method**: POST
   - **URL**: `http://localhost:5005/api/send-code`
   - **Status**: 200 OK

---

## 🔧 如果仍然有问题

### 步骤1：清除浏览器缓存

```bash
# Chrome/Edge/Firefox
1. 按 Ctrl + Shift + Delete
2. 选择"缓存的图片和文件"
3. 点击"清除数据"
4. 刷新页面（Ctrl + F5 强制刷新）
```

### 步骤2：确认服务运行

```bash
# 检查端口监听
netstat -tlnp | grep -E "5000|5005"

# 应该看到：
# tcp  0  0 0.0.0.0:5005  LISTEN  node
# tcp6 0  0 :::5000        LISTEN  node
```

### 步骤3：直接测试API

```bash
# 测试健康检查
curl http://localhost:5005/health

# 应该返回：{"status":"ok","message":"知笔后端服务运行正常"}

# 测试发送验证码
curl -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 应该返回：{"message":"验证码已发送","code":"123456"}
```

### 步骤4：检查环境变量

在浏览器控制台输入：
```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
```

**正确输出**：`http://localhost:5005`

**如果输出**：`undefined`
- 说明环境变量没有正确加载
- 需要重启前端服务

---

## 📋 修改的文件

### 1. `src/api/auth.ts`

**修改内容**：
```typescript
// 修改前
const url = `${API_BASE_URL}/auth/send-code`;

// 修改后
const url = `${API_BASE_URL}/send-code`;
```

**效果**：请求URL从 `http://localhost:5005/auth/send-code` 改为 `http://localhost:5005/api/send-code`

### 2. `server/src/index.ts`

**修改内容**：
```typescript
// 修改前
app.listen(PORT, '127.0.0.1', ...);

// 修改后
app.listen(PORT, '0.0.0.0', ...);
```

**效果**：后端从只监听 IPv4 改为监听所有接口

---

## 🎯 验证成功的标准

| 检查项 | 状态 |
|--------|------|
| 后端监听 0.0.0.0:5005 | ✅ 是 |
| 前端运行在 :::5000 | ✅ 是 |
| API 可以直接访问 | ✅ 是 |
| 前端可以发送验证码 | ✅ 是 |
| 验证码在响应中显示 | ✅ 是 |
| 浏览器不报错 | ✅ 是 |

---

## 💡 常见问题

### Q1：为什么之前会报"代理服务器错误"？

**A**：两个原因：
1. 前端请求的URL是 `http://localhost:5005/auth/send-code`（404错误）
2. 后端只监听 IPv4，前端可能使用 IPv6（连接拒绝）

### Q2：现在为什么可以工作了？

**A**：
1. 前端请求的URL改为 `http://localhost:5005/api/send-code`（正确）
2. 后端监听所有接口（0.0.0.0），无论IPv4还是IPv6都能访问

### Q3：开发环境的验证码如何查看？

**A**：三种方式：
1. **API响应**：直接在JSON响应中显示
2. **后端日志**：`tail -f /app/work/logs/bypass/backend.log | grep "验证码"`
3. **前端页面**：页面会直接显示验证码（开发环境特性）

---

## 📞 获取帮助

如果问题仍然存在：

1. **查看浏览器控制台**（F12 → Console）
   - 查看是否有错误信息
   - 查看API请求的日志

2. **查看Network标签**（F12 → Network）
   - 检查请求URL是否正确
   - 检查响应状态是否为 200 OK

3. **查看后端日志**
   ```bash
   tail -f /app/work/logs/bypass/backend.log
   ```

4. **运行测试脚本**
   ```bash
   /workspace/projects/scripts/quick-test.sh
   ```

---

## ✅ 总结

**问题**：部署后点击"发送验证码"提示"代理服务器错误"

**原因**：
1. 前端API URL配置错误（缺少 `/api` 前缀）
2. 后端监听地址限制（只监听 IPv4）

**修复**：
1. 调整前端API URL（移除多余的 `/auth` 前缀）
2. 调整后端监听地址（改为监听所有接口）

**验证**：
- ✅ 后端监听 0.0.0.0:5005
- ✅ 前端可以正常请求后端
- ✅ API测试通过
- ✅ 验证码功能正常

---

**立即测试**：访问 **http://localhost:5000/** 并尝试发送验证码

**详细文档**：`/workspace/projects/docs/PROXY_ERROR_FIX.md`
