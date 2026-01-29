# 本地邮件服务器配置说明

## 当前配置状态

Postfix已安装并配置，可以发送本地邮件。但由于以下限制，**外部邮件可能无法到达**：

### 已完成的配置
- ✅ Postfix已安装并启动
- ✅ 邮件服务已集成到系统
- ✅ 验证码生成和验证功能正常
- ✅ 开发环境可以在日志中查看验证码

### 限制条件
- ❌ 没有配置真实的域名（当前使用zhibishop.cn）
- ❌ 缺少DNS记录（MX、SPF、DKIM、DMARC）
- ❌ 邮件可能被收件服务器标记为垃圾邮件
- ❌ 沙箱环境网络限制

## 发送状态检查

### 检查邮件队列
```bash
mailq
```

### 查看邮件日志
```bash
# 查看Postfix日志
tail -f /var/log/mail.log

# 或者使用journalctl
journalctl -u postfix -f
```

### 清理邮件队列
```bash
# 删除所有邮件
postsuper -d ALL

# 删除特定邮件
postsuper -d <queue-id>
```

## 测试验证码发送

### 方式1：使用API测试
```bash
curl -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### 方式2：使用邮件命令测试
```bash
echo "Test email" | mail -s "Test Subject" your-email@example.com
```

## 生产环境部署指南

如果需要在生产环境中使用Postfix发送邮件，请完成以下配置：

### 1. 配置真实的域名
编辑 `/etc/postfix/main.cf`：
```bash
postconf -e 'myhostname=mail.yourdomain.com'
postconf -e 'mydomain=yourdomain.com'
postconf -e 'myorigin=$mydomain'
```

### 2. 配置DNS记录

#### MX记录
```
Type: MX
Name: yourdomain.com
Value: mail.yourdomain.com
Priority: 10
```

#### SPF记录
```
Type: TXT
Name: yourdomain.com
Value: v=spf1 mx -all
```

#### DKIM记录
安装并配置opendkim：
```bash
apt-get install opendkim opendkim-tools
```

生成DKIM密钥：
```bash
opendkim-genkey -b 2048 -d yourdomain.com -s mail
opendkim-genkey -b 2048 -d yourdomain.com -s default
```

添加DKIM TXT记录到DNS：
```
Type: TXT
Name: default._domainkey.yourdomain.com
Value: k=rsa; p=<公钥内容>
```

#### DMARC记录
```
Type: TXT
Name: _dmarc.yourdomain.com
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

### 3. 重启服务
```bash
service postfix restart
service opendkim restart
```

### 4. 测试发送
```bash
echo "Test email from production" | mail -s "Test" your-email@example.com
```

### 5. 检查邮件状态
```bash
# 查看邮件队列
mailq

# 查看发送状态
tail -f /var/log/mail.log
```

## 常见问题

### 1. 邮件无法发送
检查：
```bash
# 检查Postfix状态
service postfix status

# 检查端口监听
netstat -tlnp | grep :25

# 检查防火墙
iptables -L -n | grep 25
```

### 2. 邮件被标记为垃圾邮件
- 确保SPF、DKIM、DMARC配置正确
- 使用专业的邮件托管服务（如Mailgun、SendGrid）
- 建立良好的发送信誉

### 3. 地址解析失败
```
Error: address resolver failure
```
解决方案：
- 检查DNS配置
- 确认mydomain配置正确
- 测试DNS解析：`dig yourdomain.com`

## 开发环境使用

在开发环境中，验证码会在以下位置显示：

### 1. 后端日志
```bash
tail -f /app/work/logs/bypass/backend.log | grep "验证码"
```

### 2. API响应
开发环境下，API响应会包含验证码：
```json
{
  "message": "验证码已发送",
  "code": "123456"  // 开发环境显示
}
```

### 3. 邮件队列
```bash
mailq
# 可以看到待发送的邮件
```

## 替代方案

如果自建邮件服务器存在困难，可以考虑：

### 1. 使用免费邮件服务
- Gmail SMTP（免费限额）
- Outlook SMTP（免费限额）
- SendGrid（免费100封/天）
- Mailgun（免费5000封/月）

### 2. 使用短信验证码
- 更高的到达率
- 更好的用户体验
- 成本可控（0.05-0.1元/条）

### 3. 使用第三方登录
- 微信/QQ/GitHub登录
- 无需验证码
- 用户体验最佳

## 当前配置摘要

```ini
# /etc/postfix/main.cf 关键配置
myhostname = mail.zhibishop.cn
mydomain = zhibishop.cn
myorigin = $mydomain
mydestination = $myhostname, /etc/mailname, zhibishop.cn, localhost.localdomain, localhost
relayhost = 
inet_interfaces = all
inet_protocols = all
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
home_mailbox = Maildir/
smtp_generic_maps = hash:/etc/postfix/generic
```

## 验证码测试

已测试邮箱：
- 317297445@qq.com：验证码 192192

## 注意事项

⚠️ **重要提示**：
1. 当前配置适用于开发环境
2. 生产环境需要配置真实的域名和DNS记录
3. 自建邮件服务器可能被标记为垃圾邮件
4. 建议使用专业的邮件服务以确保送达率
5. 定期检查邮件队列和日志，确保邮件正常发送
