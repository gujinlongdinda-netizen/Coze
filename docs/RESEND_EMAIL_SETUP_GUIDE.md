# Resend 邮件服务配置指南

## 📧 邮件服务接入完成

### 已完成的工作

1. ✅ 安装了 `nodemailer` 依赖
2. ✅ 修改了邮件服务代码（使用 Resend SMTP）
3. ✅ 配置了环境变量
4. ✅ 重启了后端服务
5. ✅ 后端服务正常运行

---

## 🚀 下一步：配置 Resend API Key

### 步骤1：注册 Resend 账号

1. 访问 Resend 官网：https://resend.com
2. 点击右上角的 **"Sign Up"**
3. 填写注册信息：
   - 邮箱地址
   - 密码
   - 全名
4. 验证邮箱（Resend 会发送验证邮件）
5. 登录账号

---

### 步骤2：获取 API Key

1. 登录后，访问：https://resend.com/api-keys
2. 点击 **"Create API Key"**
3. 填写 API Key 名称：例如 `zhibi-production`
4. 点击 **"Create"**
5. 复制生成的 API Key（只显示一次，请妥善保存）

**API Key 格式**：
```
re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 步骤3：配置环境变量

#### 开发环境（`.env`）

**修改前**：
```bash
RESEND_API_KEY=your-resend-api-key-here
```

**修改后**：
```bash
# 将 your-resend-api-key-here 替换为实际的 API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_SENDER_EMAIL=gujinlongdinda@gmail.com
RESEND_SENDER_NAME=zhibi
```

#### 生产环境（`.env.production`）

**修改前**：
```bash
RESEND_API_KEY=your-resend-api-key-here
```

**修改后**：
```bash
# 将 your-resend-api-key-here 替换为实际的 API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_SENDER_EMAIL=gujinlongdinda@gmail.com
RESEND_SENDER_NAME=zhibi
```

---

### 步骤4：重启后端服务

```bash
# 找到后端进程
ss -lptn 'sport = :5005'

# 杀掉旧进程
kill -9 <pid>

# 重新启动
cd /workspace/projects/server
nohup npm run dev > /app/work/logs/bypass/dev.log 2>&1 &
```

---

## ✅ 测试邮件发送

### 测试命令

```bash
curl -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 预期结果

```json
{
  "message": "验证码已发送",
  "code": "123456"
}
```

### 验证日志

```bash
tail -n 20 /app/work/logs/bypass/dev.log
```

**预期日志**：
```
邮件发送成功: test@example.com (messageId: <xxxx@resend.com>)
验证码发送到邮箱 test@example.com: 123456
```

---

## 📧 Resend 服务特性

### 免费额度

- 每月：3,000 封邮件
- 无需信用卡
- 适合小型项目和测试

### 付费计划

- **Starter**：$20/月，50,000 封邮件
- **Growth**：$80/月，300,000 封邮件
- **Scale**：$250/月，1,000,000 封邮件

### SMTP 配置

```
Host: smtp.resend.com
Port: 465
Secure: Yes
User: resend
Password: RESEND_API_KEY
```

---

## 🔒 安全建议

### API Key 安全

1. ✅ 不要将 API Key 提交到 Git
2. ✅ 使用环境变量存储 API Key
3. ✅ 定期轮换 API Key
4. ✅ 限制 API Key 的权限

### Git 忽略配置

确保 `.gitignore` 包含：
```
.env
.env.local
.env.production
```

---

## 📊 邮件模板

### 验证码邮件模板

邮件服务已经配置了精美的验证码邮件模板，包含：
- ✅ 品牌标识（zhibi）
- ✅ 验证码显示（大字体、渐变背景）
- ✅ 有效期提示（5 分钟）
- ✅ 安全提示（勿泄露、非本人操作忽略）
- ✅ 专业的页脚信息

### 自定义邮件模板

如果需要自定义邮件模板，可以修改 `server/src/services/email.ts` 中的 `sendVerificationCodeEmail` 函数。

---

## 🚀 部署配置

### 生产环境部署

1. 确保生产环境变量正确配置：
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   RESEND_SENDER_EMAIL=gujinlongdinda@gmail.com
   RESEND_SENDER_NAME=zhibi
   ```

2. 重新构建前端：
   ```bash
   pnpm run build
   ```

3. 部署到生产环境

4. 验证邮件发送功能

---

## 📋 故障排查

### 问题1：邮件发送失败

**错误信息**：
```
RESEND_API_KEY 未配置
```

**解决方案**：
1. 检查环境变量是否正确配置
2. 确保 API Key 格式正确（`re_xxxxx...`）
3. 重启后端服务

---

### 问题2：邮件发送超时

**错误信息**：
```
邮件发送失败: timeout
```

**解决方案**：
1. 检查网络连接
2. 检查防火墙设置
3. 确认 SMTP 端口（465）未被阻止

---

### 问题3：邮件被标记为垃圾邮件

**解决方案**：
1. 配置正确的 SPF 记录
2. 配置 DKIM 签名
3. 配置 DMARC 策略
4. 避免垃圾邮件触发词
5. 使用真实的发件人域名

---

### 问题4：API Key 无效

**错误信息**：
```
邮件发送失败: Invalid API key
```

**解决方案**：
1. 检查 API Key 是否正确
2. 确认 API Key 未过期
3. 重新生成 API Key

---

## 🎯 下一步

### 1. 配置 Resend API Key

- 注册 Resend 账号
- 获取 API Key
- 配置环境变量
- 重启后端服务

### 2. 测试邮件发送

- 使用测试邮箱发送验证码
- 检查邮件是否正常送达
- 验证邮件内容是否正确

### 3. 部署到生产环境

- 配置生产环境变量
- 重新构建和部署
- 验证生产环境邮件发送

---

## 📄 相关文档

- **部署错误修复报告（语法错误）**：`docs/DEPLOY_ERROR_FIX_REPORT.md`
- **部署错误修复报告（模块解析错误）**：`docs/DEPLOY_ERROR_FIX_REPORT_V2.md`
- **页面样式修复报告**：`docs/PAGE_STYLE_FIX_REPORT.md`
- **部署配置修复指南**：`docs/DEPLOYMENT_CONFIG_FIX.md`
- **架构说明文档**：`docs/ARCHITECTURE_EXPLANATION.md`

---

## ✅ 总结

**邮件服务接入完成！**

- ✅ 安装了 `nodemailer` 依赖
- ✅ 实现了 Resend SMTP 邮件发送
- ✅ 配置了环境变量
- ✅ 后端服务正常运行
- ✅ 提供了完整的配置指南

**下一步**：
1. 注册 Resend 账号
2. 获取 API Key
3. 配置环境变量
4. 重启后端服务
5. 测试邮件发送

---

**配置时间**：2025-01-28
**配置人员**：通用网页搭建专家
