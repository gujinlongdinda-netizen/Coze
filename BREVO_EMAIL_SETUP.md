# Brevo 邮件服务配置指南

## 📧 Brevo (原名 Sendinblue) 邮件服务

"知笔" 项目已成功接入 Brevo 邮件服务，用于发送邮箱验证码。

## ✅ 当前配置状态

| 配置项 | 状态 | 说明 |
|--------|------|------|
| Brevo API Key | ✅ 已配置 | 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 |
| 发件人邮箱 | ✅ 已配置 | gujinlongdinda@gmail.com |
| 邮件服务 | ✅ 已恢复 | 已从 Resend 迁移至 Brevo API |
| 后端服务 | ✅ 运行中 | 端口 5005 |
| 测试发送 | ✅ 成功 | 验证码已成功发送 |

## 🚀 测试结果

**测试邮箱**: gujinlongdinda@gmail.com
**测试验证码**: 499352
**发送时间**: 2026-01-28 13:52:35
**状态**: ✅ 成功
**Message ID**: <202601281352.97259015765@smtp-relay.mailin.fr>

---

## 📝 生产环境配置指南

### 步骤 1: 登录 Brevo 控制台

访问 [Brevo 控制台](https://app.brevo.com/login)，使用您的账号登录。

### 步骤 2: 获取 API Key

1. 登录后，进入 **Account Settings** → **API & keys**
2. 点击 **"Generate a new API key"** 按钮
3. 选择权限级别（推荐选择 **"Transactional"**）
4. 复制生成的 API Key

### 步骤 3: 配置发件人域名（重要！）

Brevo 要求配置发件人域名才能发送邮件：

1. 进入 **Senders** → **Senders & IP**
2. 点击 **"Create a new sender"**
3. 填写发件人信息：
   - **Name**: zhibi
   - **Email**: gujinlongdinda@gmail.com（或您的域名邮箱）
4. 验证邮箱：
   - Brevo 会发送一封验证邮件到您的邮箱
   - 点击邮件中的验证链接完成验证

**⚠️ 注意事项**：
- 使用 Gmail 等个人邮箱每天有发送限制（约 300 封）
- 建议配置企业邮箱域名，提升发送信誉度
- 域名需要添加 SPF、DKIM、DMARC 记录

### 步骤 4: 配置环境变量

在部署环境（云函数/服务器）中，配置以下环境变量：

```bash
# Brevo API Key（步骤 2 中获取）
BREVO_API_KEY=your-brevo-api-key-here

# 发件人邮箱（步骤 3 中验证通过的邮箱）
BREVO_SENDER_EMAIL=gujinlongdinda@gmail.com

# 发件人名称
BREVO_SENDER_NAME=zhibi
```

**部署平台配置方式**：

#### Vercel
```bash
vercel env add BREVO_API_KEY production
vercel env add BREVO_SENDER_EMAIL production
vercel env add BREVO_SENDER_NAME production
```

#### 云函数（如 Serverless）
在云函数平台的「环境变量」配置页面添加上述三个变量。

### 步骤 5: 重启服务

配置完成后，重启后端服务：

```bash
# 开发环境
pnpm dev:server

# 生产环境（云函数/服务器）
# 通常会自动重启，无需手动操作
```

---

## 🧪 测试邮件发送

### 方式 1: 使用 API 测试

```bash
curl -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### 方式 2: 使用前端界面

1. 访问前端登录页面
2. 在邮箱输入框中输入您的邮箱
3. 点击"获取验证码"按钮
4. 检查邮箱是否收到验证码

### 方式 3: 使用测试脚本

创建 `test-email.js`：

```javascript
import { sendVerificationCodeEmail } from './server/src/services/email.js';

async function test() {
  const result = await sendVerificationCodeEmail('your-email@example.com', '123456');
  console.log('发送结果:', result);
}

test();
```

---

## 🔍 故障排查

### 问题 1: 邮件发送失败 - API Key 无效

**错误信息**: `401 Unauthorized` 或 `Invalid API Key`

**解决方案**:
- 检查 API Key 是否正确
- 确认 API Key 是否处于激活状态
- 检查 API Key 权限级别（需要 Transactional）

### 问题 2: 邮件发送失败 - 发件人未验证

**错误信息**: `Sender is not verified`

**解决方案**:
- 登录 Brevo 控制台，验证发件人邮箱
- 检查垃圾邮件文件夹，找到验证邮件
- 或更换为已验证的发件人邮箱

### 问题 3: 邮件进入垃圾箱

**解决方案**:
- 配置域名 SPF、DKIM、DMARC 记录
- 提升发件人信誉度
- 避免批量发送，控制发送频率

### 问题 4: 发送频率限制

**解决方案**:
- 免费版每天 300 封邮件
- 个人邮箱（Gmail）有额外限制
- 升级到付费版获得更高额度

---

## 📊 Brevo 免费版限制

| 项目 | 免费版 |
|------|--------|
| 每日邮件数量 | 300 封 |
| 每月邮件数量 | 9,000 封 |
| 同时发送 | 支持 |
| 模板数量 | 无限制 |
| API 调用 | 无限制 |
| 价格 | 免费 |

如需更高额度，请升级到付费版。

---

## 🔐 安全建议

1. **API Key 安全**
   - 不要将 API Key 提交到 Git 仓库
   - 使用环境变量管理
   - 定期更换 API Key

2. **发送频率控制**
   - 同一邮箱 60 秒内只能发送一次验证码
   - 验证码有效期 5 分钟

3. **内容安全**
   - 邮件内容符合法律法规
   - 避免敏感词汇
   - 提供退订链接（营销邮件）

---

## 📞 获取帮助

- Brevo 官方文档: https://developers.brevo.com/docs
- Brevo 支持中心: https://help.brevo.com/hc/en-us
- 知笔项目文档: https://github.com/your-repo/zhibi

---

**配置完成后，用户即可正常接收邮箱验证码！**
