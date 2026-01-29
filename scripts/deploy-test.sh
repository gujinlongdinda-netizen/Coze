#!/bin/bash

echo "=========================================="
echo "部署环境 API 测试"
echo "=========================================="

echo ""
echo "[测试1] 检查环境变量..."
echo "VITE_API_BASE_URL: ${VITE_API_BASE_URL:-未设置}"

echo ""
echo "[测试2] 测试后端 API（直接请求）..."
BACKEND_RESPONSE=$(curl -s -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"backend-test@example.com"}')

if echo "$BACKEND_RESPONSE" | grep -q "验证码已发送"; then
  echo "✓ 后端 API 正常"
  CODE=$(echo "$BACKEND_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
  echo "  验证码: $CODE"
else
  echo "✗ 后端 API 失败: $BACKEND_RESPONSE"
fi

echo ""
echo "[测试3] 测试前端代理（通过 preview.js）..."
# 注意：这里假设 preview.js 已经启动，并且代理 /api 请求到后端
PROXY_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"proxy-test@example.com"}')

if echo "$PROXY_RESPONSE" | grep -q "验证码已发送"; then
  echo "✓ 前端代理正常"
  CODE=$(echo "$PROXY_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
  echo "  验证码: $CODE"
else
  echo "✗ 前端代理失败: $PROXY_RESPONSE"
fi

echo ""
echo "[测试4] 检查服务监听端口..."
echo "前端 (5000): $(ss -tlnp | grep ':5000' | grep LISTEN | wc -l)"
echo "后端 (5005): $(ss -tlnp | grep ':5005' | grep LISTEN | wc -l)"

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
