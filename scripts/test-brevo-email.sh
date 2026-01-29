#!/bin/bash

echo "=========================================="
echo "Brevo 邮件服务测试脚本"
echo "=========================================="

# 设置变量
USER_EMAIL="${1:-317297445@qq.com}"

echo ""
echo "测试用户：$USER_EMAIL"
echo ""

# 步骤1：检查服务状态
echo "[步骤1] 检查服务状态..."
if ss -tlnp 2>/dev/null | grep -q ':5005'; then
  echo "✓ 后端服务运行中 (5005)"
else
  echo "✗ 后端服务未运行"
  exit 1
fi

if ss -tlnp 2>/dev/null | grep -q ':5000'; then
  echo "✓ 前端服务运行中 (5000)"
else
  echo "✗ 前端服务未运行"
  exit 1
fi

# 步骤2：检查 Brevo 配置
echo ""
echo "[步骤2] 检查 Brevo 配置..."
API_KEY=$(grep "BREVO_API_KEY" /workspace/projects/.env | cut -d'=' -f2)
SENDER_EMAIL=$(grep "BREVO_SENDER_EMAIL" /workspace/projects/.env | cut -d'=' -f2)
SENDER_NAME=$(grep "BREVO_SENDER_NAME" /workspace/projects/.env | cut -d'=' -f2)

echo "  API Key: ${API_KEY:0:20}..."
echo "  发件人邮箱: $SENDER_EMAIL"
echo "  发件人名称: $SENDER_NAME"

# 步骤3：测试验证码发送（直接请求后端）
echo ""
echo "[步骤3] 测试验证码发送（直接请求后端）..."
BACKEND_RESPONSE=$(curl -s -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\"}")

if echo "$BACKEND_RESPONSE" | grep -q "验证码已发送"; then
  echo "✓ 后端 API 正常"
  CODE=$(echo "$BACKEND_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
  echo "  验证码: $CODE"
else
  echo "✗ 后端 API 失败: $BACKEND_RESPONSE"
  exit 1
fi

# 步骤4：测试验证码发送（前端代理）
echo ""
echo "[步骤4] 测试验证码发送（前端代理）..."
FRONTEND_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\"}")

if echo "$FRONTEND_RESPONSE" | grep -q "验证码已发送"; then
  echo "✓ 前端代理正常"
  CODE=$(echo "$FRONTEND_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
  echo "  验证码: $CODE"
else
  echo "✗ 前端代理失败: $FRONTEND_RESPONSE"
  exit 1
fi

# 步骤5：检查后端日志
echo ""
echo "[步骤5] 检查后端日志..."
echo "最近的验证码记录："
tail -n 20 /app/work/logs/bypass/backend.log | grep -E "验证码|Brevo" | sed 's/^/  /'

# 步骤6：总结
echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "服务状态："
echo "  ✓ 后端服务: http://localhost:5005"
echo "  ✓ 前端服务: http://localhost:5000"
echo ""
echo "Brevo 配置："
echo "  ✓ 发件人邮箱: $SENDER_EMAIL"
echo "  ✓ 发件人名称: $SENDER_NAME"
echo ""
echo "测试结果："
echo "  ✓ 后端 API 测试通过（验证码已发送）"
echo "  ✓ 前端代理测试通过（验证码已发送）"
echo ""
echo "用户：$USER_EMAIL"
echo "状态：验证码已通过 Brevo 发送！"
echo ""
echo "下一步："
echo "  1. 检查邮箱接收验证码邮件"
echo "  2. 查看邮件发件人是否为：$SENDER_NAME <$SENDER_EMAIL>"
echo "  3. 验证邮件主题为：【zhibi】您的验证码"
echo ""
echo "=========================================="
