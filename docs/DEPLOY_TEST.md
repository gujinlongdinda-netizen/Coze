# 部署后邮件验证码测试指南

## 🎯 测试目标

验证部署后的邮件服务器是否能够：
1. ✅ 发送邮件到外部邮箱
2. ✅ 邮件被收件服务器接受
3. ✅ 邮件进入收件箱（而非垃圾箱）
4. ✅ 验证码功能完整可用

## 📋 测试清单

### 前置条件检查

- [ ] Postfix服务已启动
- [ ] 后端API服务（5005端口）正常运行
- [ ] 数据库服务正常运行
- [ ] 邮件域名已配置

### 自动化测试

```bash
# 运行完整测试脚本
chmod +x /workspace/projects/scripts/deploy-test.sh
/workspace/projects/scripts/deploy-test.sh
```

测试内容包括：
- Postfix服务状态
- DNS配置检查
- MX记录检查
- SPF记录检查
- 端口监听检查
- 邮件队列检查
- 验证码发送测试
- 邮件日志检查
- 反向DNS检查
- 邮件送达率测试

### 手动测试步骤

#### 步骤1：测试发送验证码

```bash
# 使用真实邮箱地址测试
curl -X POST http://127.0.0.1:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"your-real-email@gmail.com"}'
```

响应示例：
```json
{
  "message": "验证码已发送",
  "code": "123456"
}
```

#### 步骤2：检查邮件队列

```bash
# 查看邮件队列状态
mailq
```

正常情况下，邮件应该很快从队列中消失。

#### 步骤3：查看邮件日志

```bash
# 查看Postfix日志
tail -f /var/log/mail.log

# 或者使用journalctl
journalctl -u postfix -f
```

关注以下信息：
- `status=sent` - 邮件已发送
- `status=deferred` - 邮件延迟发送
- `status=bounced` - 邮件被退回

#### 步骤4：检查收件箱

**等待时间**：通常需要1-5分钟

**检查位置**：
- 收件箱
- 垃圾邮件/垃圾箱
- 推广邮件

**邮件主题**：【知笔】您的验证码

#### 步骤5：使用验证码登录

```bash
# 使用收到的验证码登录
curl -X POST http://127.0.0.1:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-real-email@gmail.com","code":"123456"}'
```

## 🔍 常见问题诊断

### 问题1：邮件未送达

**可能原因**：
1. DNS配置不正确（MX记录缺失）
2. 邮件被收件服务器拒绝
3. IP地址被列入黑名单
4. 邮件被标记为垃圾邮件

**诊断步骤**：

1. 检查邮件日志
```bash
tail -n 100 /var/log/mail.log | grep -E "status=|host="
```

2. 查看邮件队列详细信息
```bash
# 获取队列ID
mailq

# 查看具体邮件内容
postcat -q <queue-id>
```

3. 测试DNS解析
```bash
# 测试MX记录
dig +short MX zhibishop.cn

# 测试域名解析
dig +short zhibishop.cn
```

### 问题2：邮件进入垃圾箱

**可能原因**：
1. 缺少SPF记录
2. 缺少DKIM签名
3. 缺少DMARC记录
4. IP信誉低
5. 邮件内容被识别为垃圾邮件

**解决方案**：

1. 配置SPF记录
```
类型: TXT
名称: zhibishop.cn
值: v=spf1 mx -all
```

2. 配置DKIM签名
```bash
# 安装opendkim
apt-get install opendkim opendkim-tools

# 生成DKIM密钥
opendkim-genkey -b 2048 -d zhibishop.cn -s mail

# 添加到DNS
Type: TXT
Name: mail._domainkey.zhibishop.cn
Value: k=rsa; p=<公钥内容>
```

3. 配置DMARC记录
```
类型: TXT
名称: _dmarc.zhibishop.cn
值: v=DMARC1; p=none; rua=mailto:dmarc@zhibishop.cn
```

### 问题3：邮件被退回

**查看退回原因**：
```bash
# 查看邮件队列中被退回的邮件
mailq

# 查看退回详情
postcat -q <queue-id> | grep -A 10 "status="
```

**常见退回原因**：
- `550 5.7.1` - 收件地址不存在
- `550 5.1.1` - 域名无法解析
- `550 5.7.26` - 未通过SPF验证
- `550 5.7.1` - IP地址被列入黑名单

## 🧪 在线测试工具

### 1. DNS记录检查

使用以下工具检查DNS配置：
- https://mxtoolbox.com/
- https://dnsgoodies.com/
- https://www.nslookup.io/

### 2. 邮件送达率测试

使用以下工具测试邮件送达率：
- https://www.mail-tester.com/
  - 会给出详细评分和改进建议
  - 检查SPF、DKIM、DMARC配置

- https://www.glockapps.com/
  - 检查邮件是否进入垃圾箱
  - 提供详细的送达报告

### 3. IP黑名单检查

检查服务器IP是否被列入黑名单：
- https://mxtoolbox.com/blacklists.aspx
- https://multirbl.valli.org/

## 📊 邮件送达率监控

### 设置监控脚本

```bash
#!/bin/bash
# 监控邮件队列大小

while true; do
    QUEUE_SIZE=$(mailq | tail -n 1 | grep -oP '\d+(?= Requests)' || echo "0")
    echo "[$(date)] 邮件队列: $QUEUE_SIZE 封"

    if [ "$QUEUE_SIZE" -gt 100 ]; then
        echo "警告：邮件队列过大！"
        # 发送告警通知
    fi

    sleep 60
done
```

### 邮件统计报告

```bash
# 统计过去1小时的邮件发送量
grep "$(date '+%b %e %H')" /var/log/mail.log | grep "status=sent" | wc -l

# 统计失败邮件数
grep "$(date '+%b %e %H')" /var/log/mail.log | grep "status=bounced" | wc -l
```

## 🚀 生产环境检查清单

### DNS配置
- [ ] MX记录已配置
- [ ] SPF记录已配置
- [ ] DKIM记录已配置
- [ ] DMARC记录已配置
- [ ] 反向DNS已配置

### 邮件服务器配置
- [ ] Postfix服务正常运行
- [ ] 邮件域名配置正确
- [ ] DKIM签名已启用
- [ ] 邮件队列正常清理
- [ ] 日志正常记录

### 安全配置
- [ ] 防火墙已开放25端口
- [ ] 速率限制已配置
- [ ] 反垃圾邮件已配置
- [ ] IP信誉良好

### 测试验证
- [ ] 可以发送邮件到Gmail
- [ ] 可以发送邮件到QQ邮箱
- [ ] 可以发送邮件到163邮箱
- [ ] 可以发送邮件到Outlook
- [ ] 邮件不被标记为垃圾邮件

## 💡 提高邮件送达率的技巧

1. **保持IP信誉**
   - 避免频繁发送大量邮件
   - 使用专业IP段（非共享IP）
   - 定期检查IP是否被列入黑名单

2. **优化邮件内容**
   - 避免使用触发垃圾邮件过滤的关键词
   - 提供清晰的退订链接
   - 使用专业的邮件模板

3. **维护收件列表**
   - 定期清理无效邮箱
   - 及时处理退回邮件
   - 尊重用户的选择

4. **监控和反馈**
   - 定期检查邮件送达率
   - 关注用户反馈
   - 根据反馈持续优化

## 📞 获取帮助

如果遇到问题：
1. 查看详细文档：`/workspace/projects/docs/local-email-server.md`
2. 检查邮件日志：`/var/log/mail.log`
3. 运行测试脚本：`/workspace/projects/scripts/deploy-test.sh`
4. 使用在线测试工具诊断问题

## ✅ 成功标准

邮件验证码功能被视为成功，当：
- ✅ 验证码可以发送到至少3个不同的邮箱服务商（Gmail、QQ、163）
- ✅ 送达率达到95%以上
- ✅ 邮件不被标记为垃圾邮件
- ✅ 用户可以在5分钟内收到验证码
- ✅ 验证码验证功能正常工作

---

**准备好开始测试了吗？** 运行测试脚本：
```bash
/workspace/projects/scripts/deploy-test.sh
```
