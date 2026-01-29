# 环境变量配置指南

## 📋 快速配置清单

### 生产环境必须配置的环境变量

| 环境变量 | 值 | 说明 |
|---------|-----|------|
| `VITE_API_BASE_URL` | `/api` | 前端 API 基础路径（相对路径） |
| `BACKEND_URL` | `http://localhost:5005` | 后端服务地址（用于反向代理） |
| `BREVO_API_KEY` | `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` | Brevo 邮件服务 API Key |
| `BREVO_SENDER_EMAIL` | `gujinlongdinda@gmail.com` | 发件人邮箱 |
| `BREVO_SENDER_NAME` | `zhibi` | 发件人名称 |
| `DOUBAO_API_KEY` | `a6bdc581-5f93-4f85-b075-d3d6c320908e` | 豆包大模型 API Key |
| `SESSION_SECRET` | `zhibi-secret-key-2024` | Session 加密密钥 |
| `FRONTEND_URL` | `https://zhibishop.cn` | 前端 URL |
| `MZF_MCH_ID` | `10615` | 聚合支付商户 ID |
| `MZF_MCH_KEY` | `VNNcXCZY01JVbfwgpwyS` | 聚合支付商户密钥 |
| `MZF_PAY_URL` | `https://pay.mzfpay.com/xpay/epay/` | 聚合支付接口地址 |

### 可选的环境变量（Supabase Auth）

如果要使用 Supabase Auth，还需要配置：

| 环境变量 | 值 | 说明 |
|---------|-----|------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Supabase 服务密钥（后端用） |

---

## 🔧 详细配置说明

### 1. 前端 API 配置

#### 开发环境（.env）

```bash
# 前端端口
PORT=5000

# 前端API地址
# 使用相对路径 /api，由浏览器或反向代理自动处理
VITE_API_BASE_URL=/api

# 后端端口
SERVER_PORT=5005
```

#### 生产环境（.env.production）

```bash
# 前端端口（由部署环境自动设置）
PORT=5000

# 前端API地址
# 生产环境使用相对路径 /api
VITE_API_BASE_URL=/api

# 后端服务地址（用于前端反向代理转发）
# server/preview.js 将 /api 请求代理到这个地址
BACKEND_URL=http://localhost:5005
```

---

### 2. Brevo 邮件服务配置

```bash
# Brevo API Key
BREVO_API_KEY=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

# 发件人邮箱（必须在 Brevo 控制台中验证）
BREVO_SENDER_EMAIL=gujinlongdinda@gmail.com

# 发件人名称
BREVO_SENDER_NAME=zhibi
```

**重要提示**：
- 确保邮箱 `gujinlongdinda@gmail.com` 已在 [Brevo 控制台](https://app.brevo.com/login) 中验证
- 如需更换发件人邮箱，请先在 Brevo 控制台验证新邮箱

---

### 3. 豆包大模型配置

```bash
# 豆包大模型 API Key
DOUBAO_API_KEY=a6bdc581-5f93-4f85-b075-d3d6c320908e
```

---

### 4. Session 配置

```bash
# Session 密钥（用于加密 Session Cookie）
SESSION_SECRET=zhibi-secret-key-2024
```

**安全建议**：
- 生产环境请使用强随机字符串（至少 32 位）
- 可以使用以下命令生成：
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

### 5. 前端 URL 配置

```bash
# 前端 URL（生产环境）
FRONTEND_URL=https://zhibishop.cn
```

**说明**：
- 用于 Session Cookie 的域名设置
- 确保与实际部署的域名一致

---

### 6. 聚合支付配置

```bash
# 聚合支付商户 ID
MZF_MCH_ID=10615

# 聚合支付商户密钥
MZF_MCH_KEY=VNNcXCZY01JVbfwgpwyS

# 聚合支付接口地址
MZF_PAY_URL=https://pay.mzfpay.com/xpay/epay/
```

---

### 7. 数据库配置（自动注入）

```bash
# 数据库连接（集成服务自动注入）
# PGDATABASE_URL=...
```

**说明**：
- 使用集成服务自动注入的数据库连接
- 无需手动配置

---

### 8. Supabase 配置（可选）

如果要使用 Supabase Auth，需要配置以下环境变量：

#### 前端使用（VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY）

```bash
# Supabase 项目 URL
VITE_SUPABASE_URL=https://your-project.supabase.co

# Supabase 匿名密钥（前端使用）
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**获取方式**：
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入项目 → Settings → API
3. 复制 Project URL 和 anon public key

#### 后端使用（SUPABASE_SERVICE_ROLE_KEY）

```bash
# Supabase 服务密钥（后端使用）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**获取方式**：
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入项目 → Settings → API
3. 复制 service_role key
4. **重要**：此密钥具有管理员权限，请妥善保管

---

## 📋 完整的环境变量文件

### 开发环境（.env）

```bash
# 前端端口
PORT=5000

# 前端API地址
VITE_API_BASE_URL=/api

# 后端端口
SERVER_PORT=5005

# 豆包大模型API密钥
DOUBAO_API_KEY=a6bdc581-5f93-4f85-b075-d3d6c320908e

# Session密钥
SESSION_SECRET=zhibi-secret-key-2024

# 前端URL（生产环境）
FRONTEND_URL=https://zhibishop.cn

# 环境
NODE_ENV=development

# 数据库连接（集成服务自动注入）
# PGDATABASE_URL=...

# 聚合支付配置
MZF_MCH_ID=10615
MZF_MCH_KEY=VNNcXCZY01JVbfwgpwyS
MZF_PAY_URL=https://pay.mzfpay.com/xpay/epay/

# Brevo 邮件服务配置
BREVO_API_KEY=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
BREVO_SENDER_EMAIL=gujinlongdinda@gmail.com
BREVO_SENDER_NAME=zhibi

# Supabase 配置（可选，用于用户认证）
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 生产环境（.env.production）

```bash
# 前端端口（由部署环境自动设置）
PORT=5000

# 前端API地址
VITE_API_BASE_URL=/api

# 后端服务地址（用于前端反向代理转发）
BACKEND_URL=http://localhost:5005

# 环境
NODE_ENV=production

# Brevo 邮件服务配置
BREVO_API_KEY=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
BREVO_SENDER_EMAIL=gujinlongdinda@gmail.com
BREVO_SENDER_NAME=zhibi

# 豆包大模型API密钥
DOUBAO_API_KEY=a6bdc581-5f93-4f85-b075-d3d6c320908e

# Session密钥
SESSION_SECRET=zhibi-secret-key-2024

# 前端URL（生产环境）
FRONTEND_URL=https://zhibishop.cn

# 聚合支付配置
MZF_MCH_ID=10615
MZF_MCH_KEY=VNNcXCZY01JVbfwgpwyS
MZF_PAY_URL=https://pay.mzfpay.com/xpay/epay/

# Supabase 配置（可选，用于用户认证）
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🚀 部署平台配置指南

### Vercel

在 Vercel Dashboard 中配置环境变量：

1. 进入项目设置 → Environment Variables
2. 添加以下环境变量：
   - `VITE_API_BASE_URL` = `/api`
   - `BREVO_API_KEY` = `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`
   - `BREVO_SENDER_EMAIL` = `gujinlongdinda@gmail.com`
   - `BREVO_SENDER_NAME` = `zhibi`
   - `DOUBAO_API_KEY` = `a6bdc581-5f93-4f85-b075-d3d6c320908e`
   - `SESSION_SECRET` = `zhibi-secret-key-2024`
   - `FRONTEND_URL` = `https://zhibishop.cn`
   - `MZF_MCH_ID` = `10615`
   - `MZF_MCH_KEY` = `VNNcXCZY01JVbfwgpwyS`
   - `MZF_PAY_URL` = `https://pay.mzfpay.com/xpay/epay/`

### 服务器部署

在服务器上配置环境变量：

1. **方法 1：创建 .env 文件**
   ```bash
   cd /path/to/project
   cp .env.production .env
   # 编辑 .env 文件，填写环境变量
   ```

2. **方法 2：使用 export 命令**
   ```bash
   export VITE_API_BASE_URL=/api
   export BREVO_API_KEY=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
   # ... 其他环境变量
   ```

3. **方法 3：使用 systemd 服务**
   ```ini
   [Service]
   Environment="VITE_API_BASE_URL=/api"
   Environment="BREVO_API_KEY=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"
   # ... 其他环境变量
   ```

---

## ⚠️ 安全注意事项

1. **不要提交敏感信息到 Git**
   ```bash
   # 确认 .gitignore 包含以下内容
   .env
   .env.local
   .env.production.local
   ```

2. **生产环境使用强随机密钥**
   ```bash
   # 生成强随机密钥
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **定期更换 API Key 和密钥**
   - Brevo API Key
   - 豆包大模型 API Key
   - Session 密钥

4. **限制 API Key 权限**
   - Brevo: 使用 Transactional 权限
   - Supabase: 仅使用 anon key 在前端

---

## ✅ 配置检查清单

部署前，请确认以下配置：

- [ ] `VITE_API_BASE_URL` 设置为 `/api`
- [ ] `BREVO_API_KEY` 已配置
- [ ] `BREVO_SENDER_EMAIL` 已在 Brevo 控制台验证
- [ ] `DOUBAO_API_KEY` 已配置
- [ ] `SESSION_SECRET` 已设置强随机字符串
- [ ] `FRONTEND_URL` 与部署域名一致
- [ ] 聚合支付配置正确
- [ ] 如使用 Supabase，相关环境变量已配置

---

## 📞 获取帮助

- Brevo 官方文档: https://developers.brevo.com/docs
- Supabase 官方文档: https://supabase.com/docs
- 豆包大模型文档: https://www.volcengine.com/docs/82379

---

## 📝 总结

**生产环境必须配置的环境变量**：

1. ✅ `VITE_API_BASE_URL=/api` - 前端 API 基础路径
2. ✅ `BACKEND_URL=http://localhost:5005` - 后端服务地址
3. ✅ `BREVO_API_KEY` - Brevo 邮件服务
4. ✅ `BREVO_SENDER_EMAIL=gujinlongdinda@gmail.com` - 发件人邮箱
5. ✅ `BREVO_SENDER_NAME=zhibi` - 发件人名称
6. ✅ `DOUBAO_API_KEY` - 豆包大模型
7. ✅ `SESSION_SECRET` - Session 加密密钥
8. ✅ `FRONTEND_URL=https://zhibishop.cn` - 前端 URL
9. ✅ `MZF_MCH_ID` - 聚合支付商户 ID
10. ✅ `MZF_MCH_KEY` - 聚合支付商户密钥
11. ✅ `MZF_PAY_URL` - 聚合支付接口地址

**可选的环境变量**（Supabase Auth）：

- `VITE_SUPABASE_URL` - Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务密钥
