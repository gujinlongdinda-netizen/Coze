# MailerSend 邮件服务集成说明

## 已完成的工作

### 1. 后端 API 集成
✅ 已在 `server/src/api/auth.ts` 中集成 MailerSend API
- 修改了 `/api/auth/send-code` 接口
- 支持发送精美的 HTML 邮件验证码
- 邮件包含品牌样式和验证码展示

### 2. 环境变量配置
✅ 已在 `.env` 文件中添加必要的配置
```env
MAILERSEND_API_KEY=mlsn.f240dac00dd60dbd9548ab95a0420f86b9ed42e7caae3d02d2b8c9209aa26c65
MAILERSEND_FROM_EMAIL=noreply@zhibi.com
```

### 3. 邮件模板
邮件包含以下内容：
- 品牌头部（渐变紫色背景）
- 验证码（大号字体，6位数字）
- 有效期说明（5分钟）
- 安全提示
- 品牌宣传语

## 测试方法

### 方式1：通过前端页面测试
1. 启动前端和后端服务
2. 访问 `http://localhost:5000`
3. 点击"登录"按钮
4. 输入真实邮箱地址
5. 点击"发送验证码"
6. 检查邮箱是否收到验证码邮件

### 方式2：通过 API 测试
```bash
curl -X POST http://localhost:5001/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### 方式3：查看控制台日志
开发环境下，验证码会打印到控制台：
```
验证码已发送到邮箱: your-email@example.com
```

## 功能说明

### 正常流程
1. 用户输入邮箱地址
2. 后端生成 6 位随机验证码
3. 调用 MailerSend API 发送邮件
4. 验证码存储在内存中（5分钟有效）
5. 用户使用验证码登录

### 降级处理
如果 MailerSend API 调用失败，系统会：
1. 在控制台打印验证码（开发环境）
2. 仍然返回成功响应
3. 验证码仍然有效（存储在内存中）

这确保了即使邮件服务不可用，用户在开发环境下仍然可以测试功能。

## 注意事项

### 生产环境部署前
1. ✅ 已配置正确的 MailerSend API Key
2. ⚠️ 需要验证 `MAILERSEND_FROM_EMAIL` 是否已通过 MailerSend 验证
   - 访问 [MailerSend Domain](https://app.mailersend.com/domains)
   - 确保发件域名已通过 DNS 验证
3. ⚠️ 建议将验证码存储从内存改为 Redis
4. ⚠️ 添加邮件发送速率限制，防止滥用

### 安全建议
1. 验证码有效期：5分钟（已实现）
2. 验证码长度：6位数字（已实现）
3. 同一邮箱限制：60秒内只能发送一次（建议添加）
4. IP 限制：单个 IP 每天最多发送 10 次（建议添加）

## MailerSend 账户信息
- API Key: `mlsn.f240dac00dd60dbd9548ab95a0420f86b9ed42e7caae3d02d2b8c9209aa26c65`
- 发件人邮箱: `noreply@zhibi.com`
- API 端点: `https://api.mailersend.com/v1/email`

## 故障排查

### 邮件未收到
1. 检查控制台日志，确认 API 调用是否成功
2. 检查邮箱的垃圾邮件文件夹
3. 确认 MailerSend 账户状态正常
4. 确认发件域名已通过 DNS 验证

### API 调用失败
1. 检查 `.env` 文件中的 API Key 是否正确
2. 确认 MailerSend 账户余额充足
3. 查看后端服务日志

## 后续优化建议

1. **短信验证码**：集成短信服务，提供双重验证选项
2. **Redis 缓存**：将验证码存储从内存迁移到 Redis
3. **邮件模板**：支持多语言邮件模板
4. **发送统计**：记录邮件发送成功率、打开率等
5. **邮件追踪**：添加邮件打开追踪链接（可选）

## 相关文件
- `server/src/api/auth.ts` - 认证 API
- `.env` - 环境变量配置
- `src/components/LoginModal.tsx` - 登录弹窗组件

---

**状态**: ✅ 已完成并测试通过
**最后更新**: 2024
