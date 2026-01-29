# 邮件验证码功能验证指南

## 🎯 快速验证方案

### 方案A：开发环境验证（推荐）

在开发环境中，验证码会直接显示在以下位置，**无需等待邮件送达**：

#### 1. 查看API响应

```bash
curl -X POST http://127.0.0.1:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

响应示例：
```json
{
  "message": "验证码已发送",
  "code": "671064"  // ← 这里就是验证码
}
```

#### 2. 查看后端日志

```bash
tail -f /app/work/logs/bypass/backend.log | grep "验证码"
```

输出示例：
```
[1] 本地邮件发送成功: test@example.com
[1] 验证码发送到邮箱 test@example.com: 671064
```

#### 3. 前端显示

访问 http://localhost:5000/，输入邮箱后，页面会显示验证码（开发环境特性）

**验证步骤**：
```bash
# 1. 发送验证码
curl -X POST http://127.0.0.1:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"dev-test@example.com"}'

# 假设返回：{"message":"验证码已发送","code":"123456"}

# 2. 使用验证码登录
curl -X POST http://127.0.0.1:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev-test@example.com","code":"123456"}'

# 3. 验证登录成功
# 返回：{"message":"登录成功","user":{...}}
```

### 方案B：生产环境真实邮件验证

如果需要在生产环境中验证邮件是否真正送达，需要完成以下配置：

#### 前置条件

1. **配置DNS记录**

登录域名管理控制台（如阿里云、腾讯云），添加以下记录：

```
# MX记录
类型: MX
主机记录: @
记录值: mail.zhibishop.cn
优先级: 10

# SPF记录
类型: TXT
主机记录: @
记录值: v=spf1 mx -all

# A记录（可选）
类型: A
主机记录: mail
记录值: <服务器公网IP>
```

2. **验证DNS配置**

```bash
# 等待DNS生效（通常需要5-60分钟）
dig +short MX zhibishop.cn
dig +short TXT zhibishop.cn
```

3. **测试邮件发送**

```bash
# 使用真实邮箱测试
curl -X POST http://127.0.0.1:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"your-real-email@qq.com"}'
```

4. **检查邮件送达**

- 查看邮箱收件箱
- 检查垃圾邮件/垃圾箱
- 等待时间：1-5分钟

5. **使用验证码登录**

```bash
# 使用邮箱中收到的验证码登录
curl -X POST http://127.0.0.1:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-real-email@qq.com","code":"123456"}'
```

## 🔍 验证失败诊断

### 问题：验证码收不到

#### 步骤1：检查Postfix日志

```bash
# 查看最近的邮件发送日志
tail -n 50 /var/log/mail.log | grep -E "from=|to=|status="
```

常见状态：
- `status=sent` - 邮件已发送
- `status=deferred` - 邮件延迟发送
- `status=bounced` - 邮件被退回

#### 步骤2：检查邮件队列

```bash
# 查看队列中的邮件
mailq

# 查看具体邮件详情
postcat -q <queue-id>
```

#### 步骤3：测试DNS解析

```bash
# 测试MX记录
dig +short MX zhibishop.cn

# 测试域名解析
dig +short zhibishop.cn

# 测试反向DNS
dig +short -x <服务器公网IP>
```

#### 步骤4：检查端口

```bash
# 检查25端口是否开放
netstat -tlnp | grep :25

# 从外部测试25端口
telnet mail.zhibishop.cn 25
```

### 问题：邮件进入垃圾箱

#### 解决方案1：添加SPF记录

```
类型: TXT
主机记录: @
记录值: v=spf1 mx -all
```

#### 解决方案2：添加DKIM签名

```bash
# 安装opendkim
apt-get install opendkim opendkim-tools

# 生成DKIM密钥
opendkim-genkey -b 2048 -d zhibishop.cn -s mail

# 配置Postfix
postconf -e 'milter_protocol=2'
postconf -e 'milter_default_action=accept'
postconf -e 'smtpd_milters=inet:localhost:8891'
postconf -e 'non_smtpd_milters=inet:localhost:8891'

# 配置opendkim
cat >> /etc/opendkim.conf << EOF
KeyTable           refile:/etc/opendkim/KeyTable
SigningTable       refile:/etc/opendkim/SigningTable
ExternalIgnoreList  /etc/opendkim/TrustedHosts
InternalHosts       /etc/opendkim/TrustedHosts
Mode               sv
Canonicalization    relaxed/simple
EOF

# 启动服务
service opendkim restart
service postfix restart
```

添加DKIM TXT记录到DNS：
```
类型: TXT
主机记录: mail._domainkey
记录值: k=rsa; p=<从/etc/opendkim/keys/mail.txt中获取>
```

## 🧪 完整测试脚本

### 快速测试（推荐）

```bash
#!/bin/bash

echo "快速验证码功能测试"
echo "===================="
echo ""

# 测试1：发送验证码
echo "测试1：发送验证码"
RESPONSE=$(curl -s -X POST http://127.0.0.1:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"quick-test@example.com"}')

echo "响应: $RESPONSE"

if echo "$RESPONSE" | grep -q "验证码已发送"; then
    CODE=$(echo "$RESPONSE" | grep -oP '"code":"\K\d+(?=")')
    echo "验证码: $CODE"
    echo "✓ 验证码发送成功"
else
    echo "✗ 验证码发送失败"
    exit 1
fi
echo ""

# 测试2：使用验证码登录
echo "测试2：使用验证码登录"
LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"quick-test@example.com\",\"code\":\"$CODE\"}")

echo "响应: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "登录成功"; then
    echo "✓ 登录成功"
else
    echo "✗ 登录失败"
    exit 1
fi
echo ""

echo "===================="
echo "所有测试通过！"
echo "===================="
```

运行测试：
```bash
bash /workspace/projects/scripts/quick-test.sh
```

### 完整测试（生产环境）

```bash
#!/bin/bash

echo "完整邮件功能测试"
echo "=================="
echo ""

# 输入测试邮箱
read -p "请输入测试邮箱地址: " TEST_EMAIL

# 发送验证码
echo "正在发送验证码到 $TEST_EMAIL..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

if echo "$RESPONSE" | grep -q "验证码已发送"; then
    CODE=$(echo "$RESPONSE" | grep -oP '"code":"\K\d+(?=")')
    if [ -n "$CODE" ]; then
        echo "验证码: $CODE"
        echo "（开发环境验证码会显示，生产环境请查看邮箱）"
    fi
    echo "✓ 验证码已发送"
else
    echo "✗ 验证码发送失败"
    echo "错误: $RESPONSE"
    exit 1
fi

# 等待邮件送达
echo ""
echo "请检查邮箱 $TEST_EMAIL"
echo "如果10秒后未收到，请检查邮件日志：tail -f /var/log/mail.log"

# 检查邮件队列
sleep 5
QUEUE_SIZE=$(mailq | tail -n 1 | grep -oP '\d+(?= Requests)' || echo "0")
echo "当前邮件队列: $QUEUE_SIZE 封"

# 查看邮件状态
echo ""
echo "最近的邮件日志："
tail -n 10 /var/log/mail.log 2>/dev/null | grep -E "from=|to=|status=" || echo "暂无邮件日志"

echo ""
echo "=================="
echo "测试完成！"
echo "=================="
```

## 📊 验证标准

### 开发环境
- [x] API返回验证码
- [x] 验证码存储到数据库
- [x] 验证码验证功能正常
- [x] 用户注册/登录功能正常

### 生产环境
- [ ] DNS记录配置正确（MX、SPF）
- [ ] 邮件可以发送到外部邮箱
- [ ] 邮件进入收件箱（而非垃圾箱）
- [ ] 送达率达到95%以上
- [ ] 验证码验证功能正常

## 🎯 当前状态总结

### 已完成
✅ Postfix邮件服务器安装和配置
✅ 验证码生成和存储功能
✅ 验证码验证功能
✅ 开发环境验证码显示
✅ 用户注册和登录功能

### 待完成（生产环境）
⏳ 配置MX记录
⏳ 配置SPF记录
⏳ 配置DKIM签名（可选）
⏳ 配置反向DNS（可选）
⏳ 测试邮件送达率

### 建议

**开发环境**：
- 直接使用API响应或日志中的验证码
- 无需配置DNS
- 功能完全可用

**生产环境**：
- 完成DNS配置后才能发送真实邮件
- 建议使用专业邮件服务（如阿里云邮件推送、腾讯云邮件）
- 自建邮件服务器需要维护和监控

---

**立即测试**：
```bash
# 开发环境快速测试
curl -X POST http://127.0.0.1:5005/api/auth/send-code \
  -d '{"email":"test@example.com"}'
```

**查看验证码**：
- API响应中会显示
- 后端日志中会显示
- 前端页面会显示
