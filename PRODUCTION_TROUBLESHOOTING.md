# 生产环境"代理服务器错误"排查指南

## 📋 问题现状

**用户报告**：
- 部署后的网站提示"代理服务器错误"
- 浏览器控制台显示 500 错误
- 错误 URL：`/api/auth/send-code`

**关键观察**：
- ✅ 沙箱本地环境测试成功
- ❌ 部署环境测试失败
- ✅ 路径正确（`/api/auth/send-code`）
- ❌ 返回 500 错误

---

## 🔍 问题分析

### 可能原因 1：BACKEND_URL 配置错误

**问题**：生产环境的 `BACKEND_URL` 仍然是 `http://localhost:5005`

**影响**：
- 如果前后端部署在同一台服务器，应该可以工作
- 如果部署在不同服务器或容器中，`localhost` 无法访问后端

**解决方案**：
- 同服务器部署：`BACKEND_URL=http://localhost:5005`（如果后端运行在 5005 端口）
- 不同服务器部署：`BACKEND_URL=http://your-backend-server-ip:5005`
- 域名部署：`BACKEND_URL=https://api.yourdomain.com`

---

### 可能原因 2：后端服务未启动或端口不对

**问题**：生产环境中后端服务没有启动，或运行在错误的端口

**症状**：
- 代理请求发送到 `http://localhost:5005`
- 但没有服务监听该端口
- 导致连接失败，返回 500 错误

**解决方案**：
1. 确认后端服务已启动
2. 确认后端服务运行在正确的端口
3. 更新 `BACKEND_URL` 配置以匹配实际端口

---

### 可能原因 3：前端构建文件未更新

**问题**：生产环境使用的构建文件是旧版本，不包含最新的修复

**症状**：
- 本地代码已修复
- 但部署的构建文件是旧的
- 仍然使用有 Bug 的代码

**解决方案**：
1. 重新构建项目：`pnpm run build:client`
2. 确认新构建文件已生成
3. 重新部署所有文件

---

### 可能原因 4：预览服务器未重启

**问题**：预览服务器仍在使用旧代码

**症状**：
- 构建文件已更新
- 但预览服务器没有重启
- 仍然使用旧代码处理请求

**解决方案**：
重启预览服务器以加载新代码

---

## 🛠️ 逐步排查步骤

### 步骤 1：检查后端服务状态

**在部署服务器上执行**：

```bash
# 检查后端服务是否运行
ps aux | grep "node.*server"

# 检查后端端口是否监听
ss -lptn | grep :5005

# 测试后端服务是否可访问
curl http://localhost:5005/health
```

**预期结果**：
- 有后端进程运行
- 端口 5005 正在监听
- `curl` 返回 `{"status":"ok","message":"知笔后端服务运行正常"}`

**如果失败**：
- 启动后端服务：`tsx server/src/index.ts`
- 或者使用启动脚本：`pnpm dev:server`

---

### 步骤 2：检查前端服务状态

**在部署服务器上执行**：

```bash
# 检查前端预览服务是否运行
ps aux | grep "preview.js"

# 检查前端端口是否监听
ss -lptn | grep :5000

# 测试前端服务是否可访问
curl http://localhost:5000/
```

**预期结果**：
- 有预览服务进程运行
- 端口 5000 正在监听
- `curl` 返回 HTML 内容

**如果失败**：
- 启动预览服务：`node server/preview.js`
- 或者使用启动脚本：`pnpm deploy:start`

---

### 步骤 3：检查环境变量配置

**在部署服务器上执行**：

```bash
# 检查环境变量
echo $BACKEND_URL
echo $VITE_API_BASE_URL
```

**预期结果**：
- `BACKEND_URL=http://localhost:5005`（或实际的后端地址）
- `VITE_API_BASE_URL=/api`

**如果不符合**：
- 更新环境变量配置
- 重启服务使配置生效

---

### 步骤 4：测试后端 API 直接访问

**在部署服务器上执行**：

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
- 检查后端日志：`tail -n 50 /app/work/logs/bypass/dev.log`
- 确认 Brevo 配置正确
- 确认数据库连接正常

---

### 步骤 5：测试前端代理

**在部署服务器上执行**：

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
- 检查预览服务日志：`tail -n 50 /app/work/logs/bypass/preview.log`
- 确认 `BACKEND_URL` 配置正确
- 确认后端服务可访问

---

### 步骤 6：检查浏览器控制台

在浏览器中打开开发者工具（F12），查看：

1. **Console** 标签：
   - 查看是否有 JavaScript 错误
   - 查看环境变量输出

2. **Network** 标签：
   - 找到 `/api/auth/send-code` 请求
   - 查看请求 URL：应该是 `/api/auth/send-code`
   - 查看响应状态：应该是 200 OK
   - 如果是 500，查看响应内容

---

## 🚀 常见部署场景

### 场景 1：单服务器部署（前后端同一台服务器）

**环境变量配置**：
```bash
BACKEND_URL=http://localhost:5005
VITE_API_BASE_URL=/api
```

**启动命令**：
```bash
# 启动后端
tsx server/src/index.ts

# 启动前端预览服务
node server/preview.js
```

**优点**：
- 配置简单
- 无需额外网络配置

---

### 场景 2：不同服务器部署

**前端服务器**：
- IP：`1.2.3.4`
- 端口：5000

**后端服务器**：
- IP：`5.6.7.8`
- 端口：5005

**环境变量配置**：
```bash
BACKEND_URL=http://5.6.7.8:5005
VITE_API_BASE_URL=/api
```

**注意**：
- 确保两台服务器可以互相访问
- 检查防火墙规则
- 确保后端服务器允许外部访问（不绑定到 127.0.0.1）

---

### 场景 3：容器化部署（Docker）

**docker-compose.yml**：
```yaml
version: '3'
services:
  backend:
    build: .
    command: tsx server/src/index.ts
    ports:
      - "5005:5005"
    environment:
      - DATABASE_URL=postgresql://...

  frontend:
    build: .
    command: node server/preview.js
    ports:
      - "5000:5000"
    depends_on:
      - backend
    environment:
      - BACKEND_URL=http://backend:5005
      - VITE_API_BASE_URL=/api
```

**注意**：
- 使用容器名称作为主机名（`backend`）
- 确保服务之间的网络连接

---

## 🔄 重新部署步骤

如果您确定代码已修复，但部署后仍然有问题，请按照以下步骤重新部署：

### 1. 本地重新构建

```bash
# 停止所有服务
pkill -f "preview.js"
pkill -f "tsx watch server/src/index.ts"

# 清理旧构建
rm -rf dist/static

# 重新构建
pnpm run build:client
```

### 2. 验证本地环境

```bash
# 启动后端
pnpm dev:server

# 启动前端预览
node server/preview.js

# 测试
curl -X POST http://localhost:5000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**确保本地环境工作正常后再部署！**

### 3. 部署到生产环境

**方式 1：使用 Git**
```bash
# 提交更改
git add .
git commit -m "fix: 修复反向代理问题"

# 推送到远程仓库
git push origin main

# 在部署平台触发部署
```

**方式 2：手动部署**
```bash
# 上传构建文件
rsync -avz dist/static/* user@server:/path/to/static/

# 上传 server 文件
rsync -avz server/* user@server:/path/to/server/

# SSH 到服务器
ssh user@server

# 重启服务
pm2 restart all
# 或
systemctl restart zhibi
```

### 4. 验证部署

```bash
# 在部署服务器上测试
curl -X POST http://localhost:5000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

然后访问网站，在浏览器中测试。

---

## 📞 获取帮助

如果按照以上步骤仍然无法解决问题，请提供以下信息：

1. **部署环境信息**：
   - 服务器操作系统
   - 部署平台（Vercel、云函数、自建服务器等）
   - 前后端是否在同一台服务器

2. **环境变量配置**：
   - `BACKEND_URL` 的值
   - `VITE_API_BASE_URL` 的值

3. **服务状态**：
   - 后端服务是否运行
   - 前端服务是否运行
   - 端口是否正确监听

4. **错误日志**：
   - 后端日志（`dev.log`）
   - 前端日志（`preview.log`）
   - 浏览器控制台错误

---

## ✅ 检查清单

部署前，请确认：

- [ ] 后端服务运行在正确的端口（5005）
- [ ] 前端服务运行在正确的端口（5000）
- [ ] `BACKEND_URL` 配置正确
- [ ] `VITE_API_BASE_URL` 配置为 `/api`
- [ ] 代码已重新构建
- [ ] 服务已重启
- [ ] 本地测试通过
- [ ] 防火墙规则允许访问

---

## 🎯 关键提示

**最重要的配置**：
```bash
BACKEND_URL=http://localhost:5005  # 确保与后端实际地址匹配
VITE_API_BASE_URL=/api              # 前端使用相对路径
```

**如果前后端在同一台服务器**：
- `BACKEND_URL=http://localhost:5005` 是正确的

**如果前后端在不同服务器**：
- `BACKEND_URL=http://后端服务器IP:5005`
- 例如：`BACKEND_URL=http://192.168.1.100:5005`

**如果使用域名**：
- `BACKEND_URL=https://api.yourdomain.com`
