#!/bin/bash

echo "=========================================="
echo "Failed to fetch 问题排查"
echo "=========================================="

echo ""
echo "[步骤1] 检查服务状态..."

if ss -tlnp 2>/dev/null | grep -q ':5000'; then
  echo "✓ 前端服务运行中 (5000)"
else
  echo "✗ 前端服务未运行"
  exit 1
fi

if ss -tlnp 2>/dev/null | grep -q ':5005'; then
  echo "✓ 后端服务运行中 (5005)"
else
  echo "✗ 后端服务未运行"
  exit 1
fi

echo ""
echo "[步骤2] 检查环境变量..."

echo "开发环境 (.env):"
grep "VITE_API_BASE_URL" /workspace/projects/.env | sed 's/^/  /'

echo ""
echo "生产环境 (.env.production):"
grep "VITE_API_BASE_URL" /workspace/projects/.env.production | sed 's/^/  /'

echo ""
echo "[步骤3] 计算实际请求 URL..."

DEV_API_BASE_URL=$(grep "VITE_API_BASE_URL" /workspace/projects/.env | cut -d'=' -f2)
PROD_API_BASE_URL=$(grep "VITE_API_BASE_URL" /workspace/projects/.env.production | cut -d'=' -f2)

echo ""
echo "开发环境请求："
echo "  API_BASE_URL = $DEV_API_BASE_URL"
echo "  URL = ${DEV_API_BASE_URL}/api/auth/send-code"

echo ""
echo "生产环境请求："
echo "  API_BASE_URL = ${PROD_API_BASE_URL}（空字符串）"
echo "  URL = ${PROD_API_BASE_URL}/api/auth/send-code"

echo ""
echo "[步骤4] 测试后端 API..."

RESPONSE=$(curl -s -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test-backend@example.com"}')

if echo "$RESPONSE" | grep -q "验证码已发送"; then
  echo "✓ 后端 API 正常"
  CODE=$(echo "$RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
  echo "  验证码: $CODE"
else
  echo "✗ 后端 API 失败: $RESPONSE"
  exit 1
fi

echo ""
echo "[步骤5] 检查运行环境..."

if ps aux | grep -q "node.*vite"; then
  echo "✓ 当前运行环境: 开发环境（Vite）"
  echo "  前端直接请求后端: http://localhost:5005/api/auth/send-code"
elif ps aux | grep -q "node server/preview.js"; then
  echo "✓ 当前运行环境: 部署环境（preview.js）"

  PROXY_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/send-code \
    -H "Content-Type: application/json" \
    -d '{"email":"test-proxy@example.com"}')

  if echo "$PROXY_RESPONSE" | grep -q "验证码已发送"; then
    echo "✓ 前端代理正常"
    CODE=$(echo "$PROXY_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
    echo "  验证码: $CODE"
  else
    echo "✗ 前端代理失败: $PROXY_RESPONSE"
  fi
else
  echo "⚠ 无法确定运行环境"
fi

echo ""
echo "=========================================="
echo "问题排查完成"
echo "=========================================="

echo ""
echo "修复说明："
echo ""
echo "问题："
echo "  .env 文件配置错误：VITE_API_BASE_URL=http://localhost:5005/api"
echo "  导致请求 URL 变成：http://localhost:5005/api/api/auth/send-code（错误）"
echo ""
echo "修复："
echo "  修改 .env 文件：VITE_API_BASE_URL=http://localhost:5005"
echo "  现在请求 URL 是：http://localhost:5005/api/auth/send-code（正确）"
echo ""
echo "下一步："
echo "  1. 清除浏览器缓存（Ctrl + Shift + Delete）"
echo "  2. 访问 http://localhost:5000"
echo "  3. 按 Ctrl + F5 强制刷新页面"
echo "  4. 输入邮箱，点击'发送验证码'"
echo "  5. 打开浏览器开发者工具（F12），查看 Console 和 Network 标签"
echo ""
echo "预期结果："
echo "  - Network 标签中显示请求 URL: http://localhost:5005/api/auth/send-code"
echo "  - 请求状态: 200 OK"
echo "  - 控制台显示: 验证码已发送（开发环境会显示验证码）"
