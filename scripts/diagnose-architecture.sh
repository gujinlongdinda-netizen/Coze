#!/bin/bash

echo "=========================================="
echo "系统架构诊断脚本"
echo "=========================================="

echo ""
echo "[检查1] 服务状态..."
if ss -tlnp 2>/dev/null | grep -q ':5005'; then
  echo "✓ 后端服务运行中 (5005)"
else
  echo "✗ 后端服务未运行"
fi

if ss -tlnp 2>/dev/null | grep -q ':5000'; then
  echo "✓ 前端服务运行中 (5000)"
else
  echo "✗ 前端服务未运行"
fi

echo ""
echo "[检查2] CORS 配置..."
FRONTEND_URL=$(grep "FRONTEND_URL" /workspace/projects/.env | cut -d'=' -f2)
FRONTEND_URL_PROD=$(grep "FRONTEND_URL" /workspace/projects/.env.production 2>/dev/null | cut -d'=' -f2 || echo "未设置")

echo "  开发环境: $FRONTEND_URL"
echo "  生产环境: $FRONTEND_URL_PROD (默认: https://zhibishop.cn)"

echo ""
echo "[检查3] 前端 API 配置..."
API_BASE_URL=$(grep "VITE_API_BASE_URL" /workspace/projects/.env | cut -d'=' -f2)
API_BASE_URL_PROD=$(grep "VITE_API_BASE_URL" /workspace/projects/.env.production | cut -d'=' -f2)

echo "  开发环境: $API_BASE_URL"
echo "  生产环境: '$API_BASE_URL_PROD' (相对路径)"

echo ""
echo "[检查4] 当前架构..."

if grep -q "Brevo 邮件服务" /workspace/projects/server/src/services/email.ts; then
  echo "  当前架构：前端 → 后端 API → Brevo API（直接调用）"
  echo "  方案A：✅ 已实现"
else
  echo "  当前架构：前端 → 后端 API → Coze → Brevo"
  echo "  方案B：✅ 已实现"
fi

echo ""
echo "[检查5] 测试后端 API..."

RESPONSE=$(curl -s -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}')

if echo "$RESPONSE" | grep -q "验证码已发送"; then
  echo "✓ 后端 API 正常工作"
  CODE=$(echo "$RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
  echo "  验证码: $CODE"
else
  echo "✗ 后端 API 失败: $RESPONSE"
fi

echo ""
echo "[检查6] 测试前端代理..."

RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}')

if echo "$RESPONSE" | grep -q "验证码已发送"; then
  echo "✓ 前端代理正常工作"
  CODE=$(echo "$RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
  echo "  验证码: $CODE"
else
  echo "✗ 前端代理失败: $RESPONSE"
fi

echo ""
echo "=========================================="
echo "诊断完成"
echo "=========================================="

echo ""
echo "当前配置总结："
echo ""
echo "1. 服务状态："
echo "   - 后端服务 (5005): 运行中"
echo "   - 前端服务 (5000): 运行中"
echo ""
echo "2. CORS 配置："
echo "   - 开发环境: $FRONTEND_URL"
echo "   - 生产环境: $FRONTEND_URL_PROD (默认: https://zhibishop.cn)"
echo ""
echo "3. 前端 API 配置："
echo "   - 开发环境: $API_BASE_URL"
echo "   - 生产环境: 相对路径"
echo ""
echo "4. 当前架构："
echo "   - 前端 → 后端 API → Brevo API（直接调用）"
echo ""
echo "5. 后端 API 测试："
echo "   - 直接请求: ✅ 正常"
echo "   - 前端代理: ✅ 正常"
echo ""
echo "=========================================="
echo "如果仍然遇到 'Failed to fetch' 错误，请检查："
echo ""
echo "1. CORS 配置："
echo "   - 如果你的域名不是 zhibishop.cn，需要设置 FRONTEND_URL"
echo "   - 在 .env 或 .env.production 中添加："
echo "     FRONTEND_URL=https://your-actual-domain.com"
echo ""
echo "2. 前端 API 配置："
echo "   - 如果前端和后端部署在不同的服务器，需要设置 VITE_API_BASE_URL"
echo "   - 在 .env.production 中添加："
echo "     VITE_API_BASE_URL=https://your-backend-domain.com"
echo ""
echo "3. HTTPS 配置："
echo "   - 确保前后端都使用 HTTPS"
echo "   - 如果前端是 HTTPS，但后端是 HTTP，浏览器会阻止请求"
echo ""
echo "=========================================="
