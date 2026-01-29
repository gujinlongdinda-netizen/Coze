# 快速修复指南：生产环境"代理服务器错误"

## 🎯 快速诊断

您遇到的问题：部署后仍然提示"代理服务器错误"

**关键信息**：
- ✅ 本地沙箱环境测试成功
- ❌ 生产环境测试失败
- ✅ 路径正确（`/api/auth/send-code`）
- ❌ 返回 500 错误

**最可能的原因**：

---

## 🔥 原因 1：后端服务未启动或端口不对（最常见）

### 检查方法

**在部署服务器上执行**：

```bash
# 检查后端服务是否运行
ps aux | grep "node.*server"

# 检查后端端口是否监听
ss -lptn | grep :5005
```

**如果没有后端进程运行**：
```bash
# 启动后端服务
tsx server/src/index.ts

# 或使用启动脚本
pnpm dev:server
```

**如果后端端口不是 5005**：
- 检查 `SERVER_PORT` 环境变量
- 更新 `.env` 或 `.env.production` 中的配置
- 重启后端服务

---

## 🔥 原因 2：BACKEND_URL 配置错误

### 检查方法

**在部署服务器上执行**：

```bash
echo $BACKEND_URL
```

### 修复方法

**场景 A：前后端在同一台服务器**
```bash
BACKEND_URL=http://localhost:5005
```

**场景 B：前后端在不同服务器**
```bash
# 替换为实际的后端服务器 IP
BACKEND_URL=http://后端服务器IP:5005

# 例如
BACKEND_URL=http://192.168.1.100:5005
```

**场景 C：使用域名**
```bash
BACKEND_URL=https://api.yourdomain.com
```

### 更新配置

**如果使用环境变量文件**：
```bash
# 编辑 .env.production
vim .env.production

# 修改 BACKEND_URL
BACKEND_URL=http://localhost:5005

# 保存后重启服务
```

**如果使用部署平台环境变量**：
- 在部署平台（Vercel、云函数等）的环境变量配置页面
- 更新 `BACKEND_URL` 的值
- 重新部署

---

## 🔥 原因 3：前端构建文件未更新

### 修复方法

**在本地执行**：

```bash
# 停止所有服务
pkill -f "preview.js"
pkill -f "tsx watch server/src/index.ts"

# 清理旧构建
rm -rf dist/static

# 重新构建
pnpm run build:client

# 验证构建成功
ls -lh dist/static/assets/
```

**然后重新部署**：
- 提交代码到 Git
- 推送到远程仓库
- 在部署平台触发重新部署

---

## 🔥 原因 4：预览服务器未重启

### 修复方法

**在部署服务器上执行**：

```bash
# 找到预览服务进程
ps aux | grep "preview.js"

# 停止旧进程
kill -9 <PID>

# 启动新的预览服务
node server/preview.js

# 或使用启动脚本
pnpm deploy:start
```

---

## 🧪 快速测试

### 测试 1：后端服务

```bash
curl http://localhost:5005/health
```

**预期结果**：
```json
{"status":"ok","message":"知笔后端服务运行正常"}
```

**如果失败**：后端服务有问题，先解决后端问题

---

### 测试 2：后端 API

```bash
curl -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**预期结果**：
```json
{"message":"验证码已发送","code":"123456"}
```

**如果失败**：
- 检查后端日志
- 确认 Brevo 配置
- 确认数据库连接

---

### 测试 3：前端代理

```bash
curl -X POST http://localhost:5000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**预期结果**：
```json
{"message":"验证码已发送","code":"123456"}
```

**如果失败**：
- 检查 `BACKEND_URL` 配置
- 检查预览服务日志
- 确认后端服务可访问

---

## 📋 环境变量快速检查清单

### 必需的环境变量

```bash
# 前端 API 配置
VITE_API_BASE_URL=/api                    ✅ 必需

# 后端服务地址
BACKEND_URL=http://localhost:5005           ✅ 必需（需根据实际情况调整）

# Brevo 邮件服务
BREVO_API_KEY=xkeysib-...                 ✅ 必需
BREVO_SENDER_EMAIL=gujinlongdinda@gmail.com ✅ 必需
BREVO_SENDER_NAME=zhibi                    ✅ 必需

# 豆包大模型
DOUBAO_API_KEY=a6bdc581-...              ✅ 必需

# Session
SESSION_SECRET=zhibi-secret-key-2024       ✅ 必需

# 前端 URL
FRONTEND_URL=https://zhibishop.cn          ✅ 必需

# 聚合支付
MZF_MCH_ID=10615                          ✅ 必需
MZF_MCH_KEY=VNNcXCZY01JVbfwgpwyS          ✅ 必需
MZF_PAY_URL=https://pay.mzfpay.com/xpay/epay/ ✅ 必需
```

---

## 🚀 最快的解决方案

如果您不确定是什么问题，请按照以下步骤操作：

### 步骤 1：确认部署环境

**问题**：前后端是否在同一台服务器？

- **是**：继续步骤 2
- **否**：转到"不同服务器部署"部分

---

### 步骤 2：检查后端服务

```bash
# SSH 到部署服务器
ssh user@your-server

# 检查后端服务
ps aux | grep "node.*server"

# 如果没有后端进程
tsx server/src/index.ts

# 或
pnpm dev:server
```

---

### 步骤 3：检查 BACKEND_URL

```bash
# 查看当前配置
echo $BACKEND_URL

# 如果是 http://localhost:5005，继续步骤 4
# 如果不是，更新为 http://localhost:5005
export BACKEND_URL=http://localhost:5005
```

---

### 步骤 4：测试后端 API

```bash
curl -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**如果成功**：后端没问题，继续步骤 5

**如果失败**：检查后端日志，解决后端问题

---

### 步骤 5：重启预览服务

```bash
# 找到预览服务进程
ps aux | grep "preview.js"

# 停止旧进程
kill -9 <PID>

# 启动新的预览服务
node server/preview.js

# 或
pnpm deploy:start
```

---

### 步骤 6：测试前端代理

```bash
curl -X POST http://localhost:5000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**如果成功**：问题已解决！

**如果失败**：检查预览服务日志

```bash
tail -n 50 /app/work/logs/bypass/preview.log
```

---

### 不同服务器部署

如果前后端在不同服务器：

**前端服务器**：
- IP：`1.2.3.4`
- 端口：5000

**后端服务器**：
- IP：`5.6.7.8`
- 端口：5005

**在前端服务器上**：
```bash
# 更新 BACKEND_URL
export BACKEND_URL=http://5.6.7.8:5005

# 重启预览服务
node server/preview.js
```

**在后端服务器上**：
```bash
# 确保后端允许外部访问
# 检查 server/src/index.ts 中的监听地址

# 应该是：
app.listen(process.env.SERVER_PORT || 5005, '0.0.0.0', () => {
  console.log(`后端服务运行在端口 ${port}`);
});

# 而不是：
app.listen(process.env.SERVER_PORT || 5005, '127.0.0.1', () => {
  // ❌ 这只允许本地访问
});
```

---

## 📞 如果仍然无法解决

请提供以下信息，以便进一步诊断：

1. **部署环境**：
   - 操作系统版本
   - 部署方式（Vercel、云函数、自建服务器）
   - 前后端是否在同一台服务器

2. **服务状态**：
   - 后端服务是否运行？
   - 前端服务是否运行？
   - 端口是否正确监听？

3. **环境变量**：
   - `BACKEND_URL` 的值
   - `VITE_API_BASE_URL` 的值

4. **错误日志**：
   - 后端日志（`dev.log`）
   - 前端日志（`preview.log`）
   - 浏览器控制台错误

---

## ✅ 成功标志

当问题解决后，您应该看到：

1. **浏览器控制台**：
   - 无 500 错误
   - API 请求返回 200 OK

2. **浏览器**：
   - 可以点击"获取验证码"
   - 邮箱收到验证码

3. **服务器日志**：
   - 预览服务显示请求日志
   - 后端服务显示发送邮件日志

---

## 🎯 关键提醒

**最重要的配置**：
```bash
BACKEND_URL=http://localhost:5005  # ⚠️ 必须与后端实际地址匹配！
VITE_API_BASE_URL=/api              # 前端使用相对路径
```

**最常见错误**：
- ❌ 后端服务未启动
- ❌ `BACKEND_URL` 配置错误
- ❌ 后端监听在 `127.0.0.1` 而不是 `0.0.0.0`
- ❌ 防火墙阻止了端口访问

**正确流程**：
1. 确认后端服务运行在正确的端口
2. 确认 `BACKEND_URL` 配置正确
3. 确认后端允许外部访问（如果需要）
4. 重启前端预览服务
5. 测试
