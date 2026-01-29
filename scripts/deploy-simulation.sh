#!/bin/bash

echo "=========================================="
echo "部署环境模拟测试"
echo "=========================================="

echo ""
echo "[准备1] 检查当前环境..."
if [ "$NODE_ENV" = "production" ]; then
  echo "✓ 当前环境: 生产环境"
else
  echo "✓ 当前环境: 开发环境（将模拟部署环境）"
fi

echo ""
echo "[准备2] 检查服务状态..."
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
echo "[准备3] 检查构建产物..."
if [ -d "/workspace/projects/dist/static" ]; then
  echo "✓ 前端构建产物存在"
else
  echo "⚠ 前端构建产物不存在（开发环境，未构建）"
fi

echo ""
echo "=========================================="
echo "测试 API 请求"
echo "=========================================="

echo ""
echo "[测试1] 后端 API（直接请求后端）..."
RESPONSE=$(curl -s -X POST http://localhost:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com"}')

if echo "$RESPONSE" | grep -q "验证码已发送"; then
  echo "✓ 后端 API 正常"
  CODE=$(echo "$RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
  echo "  验证码: $CODE"
  echo "  响应: $RESPONSE"
else
  echo "✗ 后端 API 失败: $RESPONSE"
  exit 1
fi

echo ""
echo "[测试2] 部署环境请求（相对路径）"
echo "模拟浏览器请求: /api/auth/send-code"
echo ""

# 检查 preview.js 是否运行（部署环境）
if ps aux | grep -q "node server/preview.js"; then
  echo "✓ 检测到 preview.js 运行中（部署环境）"
  echo "  请求路径: http://localhost:5000/api/auth/send-code"

  RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/send-code \
    -H "Content-Type: application/json" \
    -d '{"email":"test2@example.com"}')

  if echo "$RESPONSE" | grep -q "验证码已发送"; then
    echo "✓ 部署环境请求正常"
    CODE=$(echo "$RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
    echo "  验证码: $CODE"
    echo "  响应: $RESPONSE"
  else
    echo "✗ 部署环境请求失败: $RESPONSE"
  fi
else
  echo "⚠ preview.js 未运行（当前是开发环境）"
  echo "  无法测试部署环境的代理功能"
  echo ""
  echo "  说明："
  echo "  - 开发环境：前端直接请求后端（http://localhost:5005）"
  echo "  - 部署环境：前端通过 preview.js 代理请求后端"
  echo ""
  echo "  开发环境验证码发送测试："
  echo "  1. 访问 http://localhost:5000"
  echo "  2. 输入邮箱，点击'发送验证码'"
  echo "  3. 应该收到验证码（开发环境会直接显示）"
fi

echo ""
echo "=========================================="
echo "配置说明"
echo "=========================================="

echo ""
echo "开发环境配置："
echo "  .env 文件："
echo "    VITE_API_BASE_URL=http://localhost:5005"
echo ""
echo "  前端请求："
echo "    http://localhost:5005/api/auth/send-code"
echo ""
echo "  后端路由："
echo "    POST /api/auth/send-code"

echo ""
echo "部署环境配置："
echo "  .env.production 文件："
echo "    VITE_API_BASE_URL="
echo ""
echo "  前端请求："
echo "    /api/auth/send-code（相对路径）"
echo ""
echo "  preview.js 代理："
echo "    /api/* → http://localhost:5005/api/*"
echo ""
echo "  后端路由："
echo "    POST /api/auth/send-code"

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
