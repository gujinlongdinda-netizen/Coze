# 快速开始指南

## 🚀 5分钟快速开始

### 1. 确认服务状态

```bash
# 检查所有服务
netstat -tlnp | grep -E "25|5000|5005"
```

应该看到：
```
tcp  0  0 127.0.0.1:5005  LISTEN  node    (后端)
tcp  0  0  0.0.0.0:25      LISTEN  master (邮件)
tcp  0  0  :::5000          LISTEN  node    (前端)
```

### 2. 发送验证码

```bash
curl -X POST http://127.0.0.1:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

响应示例：
```json
{
  "message": "验证码已发送",
  "code": "123456"
}
```

### 3. 查看验证码

**方式1：查看后端日志**
```bash
tail -f /app/work/logs/bypass/backend.log | grep "验证码"
```

**方式2：查看API响应**（开发环境）
API响应中会直接显示验证码

**方式3：运行测试工具**
```bash
/workspace/projects/scripts/test-email.sh
```

### 4. 使用验证码登录

```bash
curl -X POST http://127.0.0.1:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

响应示例：
```json
{
  "message": "登录成功",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "remainingWords": 500,
    "totalWordsUsed": 0,
    "isFirstUser": true,
    "inviteCode": "ABC12345"
  }
}
```

### 5. 访问前端

打开浏览器访问：**http://localhost:5000/**

## 📋 常用命令

### 邮件相关

```bash
# 查看邮件队列
mailq

# 清空邮件队列
postsuper -d ALL

# 重启Postfix
service postfix restart

# 查看Postfix状态
service postfix status
```

### 后端相关

```bash
# 查看后端日志
tail -f /app/work/logs/bypass/backend.log

# 查看验证码相关日志
tail -f /app/work/logs/bypass/backend.log | grep "验证码"

# 重启后端服务
pkill -9 -f "node" && cd /workspace/projects && pnpm dev > /app/work/logs/bypass/backend.log 2>&1 &
```

### 前端相关

```bash
# 访问前端
# 浏览器打开 http://localhost:5000/

# 前端端口检查
netstat -tlnp | grep :5000
```

## 🔍 故障排查

### 问题1：Postfix未运行
```bash
# 检查状态
service postfix status

# 启动Postfix
service postfix start
```

### 问题2：端口被占用
```bash
# 查看端口占用
netstat -tlnp | grep -E "25|5000|5005"

# 杀死占用端口的进程
pkill -9 -f "node"
```

### 问题3：邮件队列堵塞
```bash
# 查看队列
mailq

# 清空队列
postsuper -d ALL

# 查看队列详情
postcat -q <queue-id>
```

### 问题4：验证码无效
```bash
# 检查后端日志
tail -n 50 /app/work/logs/bypass/backend.log | grep -E "验证码|error|Error"

# 检查数据库
# 连接数据库查看verification_codes表
```

## 📚 文档索引

- **实现报告**：`/workspace/projects/docs/IMPLEMENTATION_REPORT.md`
- **邮件服务器配置**：`/workspace/projects/docs/local-email-server.md`
- **替代方案对比**：`/workspace/projects/docs/email-alternatives.md`
- **测试工具**：`/workspace/projects/scripts/test-email.sh`

## ✅ 测试清单

- [ ] Postfix服务运行正常
- [ ] 邮件端口25监听正常
- [ ] 后端API（5005端口）运行正常
- [ ] 前端服务（5000端口）运行正常
- [ ] 验证码发送功能正常
- [ ] 验证码验证功能正常
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 数据库存储正常
- [ ] 邮件队列管理正常

## 💡 提示

1. **开发环境**：验证码会在API响应和日志中显示，方便调试
2. **生产环境**：需要配置真实的域名和DNS记录，邮件才会真正送达
3. **性能优化**：定期清理邮件队列和数据库中的过期验证码
4. **安全性**：建议添加发送频率限制和验证码重试限制

---

**准备好开始了吗？** 让我们测试一下！
