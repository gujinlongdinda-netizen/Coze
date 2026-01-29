#!/bin/bash

echo "=========================================="
echo "完整部署和验证码测试脚本"
echo "=========================================="

# 设置变量
USER_EMAIL="${1:-317297445@qq.com}"

echo ""
echo "测试用户：$USER_EMAIL"
echo ""

# 步骤1：停止旧服务
echo "[步骤1] 停止旧服务..."
pkill -f "vite.*5000" 2>/dev/null
pkill -f "preview" 2>/dev/null
pkill -f "tsx.*index.ts" 2>/dev/null
sleep 2
echo "✓ 服务已停止"

# 步骤2：检查环境变量
echo ""
echo "[步骤2] 检查环境变量..."
echo "开发环境 (.env):"
grep "VITE_API_BASE_URL\|NODE_ENV" /workspace/projects/.env | sed 's/^/  /'
echo ""
echo "生产环境 (.env.production):"
grep "VITE_API_BASE_URL\|NODE_ENV" /workspace/projects/.env.production | sed 's/^/  /'

# 步骤3：构建生产版本
echo ""
echo "[步骤3] 构建生产版本..."
pnpm build:client 2>&1 | grep -E "built|error|Error" | head -5
if [ $? -eq 0 ]; then
  echo "✓ 构建成功"
else
  echo "✗ 构建失败"
  exit 1
fi

# 步骤4：验证构建产物
echo ""
echo "[步骤4] 验证构建产物..."
BUILD_URL=$(strings /workspace/projects/dist/static/assets/index-*.js 2>/dev/null | grep -o '/api/auth/send-code' | head -1)
if [ "$BUILD_URL" = "/api/auth/send-code" ]; then
  echo "✓ 构建产物使用相对路径: /api/auth/send-code"
else
  echo "✗ 构建产物路径错误: $BUILD_URL"
  exit 1
fi

# 步骤5：启动后端服务
echo ""
echo "[步骤5] 启动后端服务..."
/workspace/projects/node_modules/.pnpm/vite@6.3.5_@types+node@25.0.10_jiti@1.21.7_tsx@4.21.0_yaml@2.7.1/node_modules/vite/node_modules/.bin/tsx \
  server/src/index.ts > /app/work/logs/bypass/backend.log 2>&1 &
sleep 3
if ss -tlnp 2>/dev/null | grep -q ':5005'; then
  echo "✓ 后端服务启动成功 (5005)"
else
  echo "✗ 后端服务启动失败"
  exit 1
fi

# 步骤6：启动前端服务
echo ""
echo "[步骤6] 启动前端服务..."
node server/preview.js > /app/work/logs/bypass/preview.log 2>&1 &
sleep 3
if ss -tlnp 2>/dev/null | grep -q ':5000'; then
  echo "✓ 前端服务启动成功 (5000)"
else
  echo "✗ 前端服务启动失败"
  exit 1
fi

# 步骤7：测试验证码发送（直接请求后端）
echo ""
echo "[步骤7] 测试验证码发送（直接请求后端）..."
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

# 步骤8：测试验证码发送（前端代理）
echo ""
echo "[步骤8] 测试验证码发送（前端代理）..."
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

# 步骤9：检查日志
echo ""
echo "[步骤9] 检查日志..."
echo "后端日志（最近10行）："
tail -n 10 /app/work/logs/bypass/backend.log | grep -E "验证码|知笔" | sed 's/^/  /'
echo ""
echo "前端日志（最近5行）："
tail -n 5 /app/work/logs/bypass/preview.log | sed 's/^/  /'

# 步骤10：总结
echo ""
echo "=========================================="
echo "部署和测试完成"
echo "=========================================="
echo ""
echo "服务状态："
echo "  ✓ 前端服务 (preview.js): http://localhost:5000"
echo "  ✓ 后端服务: http://localhost:5005"
echo ""
echo "测试结果："
echo "  ✓ 后端 API 测试通过（验证码已发送）"
echo "  ✓ 前端代理测试通过（验证码已发送）"
echo ""
echo "用户：$USER_EMAIL"
echo "状态：验证码发送成功！"
echo ""
echo "下一步："
echo "  1. 访问网站：http://localhost:5000"
echo "  2. 输入邮箱：$USER_EMAIL"
echo "  3. 点击'发送验证码'"
echo "  4. 检查邮箱接收验证码"
echo ""
echo "=========================================="
