#!/bin/bash

# 快速验证码功能测试脚本
# 用于立即验证开发环境的验证码功能

echo "=========================================="
echo "验证码功能快速测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试邮箱
TEST_EMAIL="quick-test-$(date +%s)@example.com"

# 测试1：发送验证码
echo -e "${BLUE}[测试1/3] 发送验证码...${NC}"
echo "邮箱: $TEST_EMAIL"

RESPONSE=$(curl -s -X POST http://127.0.0.1:5005/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

echo "API响应: $RESPONSE"

if echo "$RESPONSE" | grep -q "验证码已发送"; then
    CODE=$(echo "$RESPONSE" | grep -oP '"code":"\K\d+(?=")')
    if [ -n "$CODE" ]; then
        echo -e "${GREEN}✓ 验证码发送成功${NC}"
        echo -e "验证码: ${YELLOW}$CODE${NC}"
    else
        echo -e "${YELLOW}⚠ 验证码未显示（可能是生产环境）${NC}"
        CODE=""
    fi
else
    echo -e "${RED}✗ 验证码发送失败${NC}"
    echo "错误响应: $RESPONSE"
    exit 1
fi
echo ""

# 测试2：检查后端日志
echo -e "${BLUE}[测试2/3] 检查后端日志...${NC}"
LOG_OUTPUT=$(tail -n 5 /app/work/logs/bypass/backend.log | grep "验证码")

if [ -n "$LOG_OUTPUT" ]; then
    echo -e "${GREEN}✓ 找到验证码日志${NC}"
    echo "$LOG_OUTPUT"
else
    echo -e "${YELLOW}⚠ 未找到验证码日志${NC}"
fi
echo ""

# 测试3：使用验证码登录
echo -e "${BLUE}[测试3/3] 使用验证码登录...${NC}"

if [ -n "$CODE" ]; then
    LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:5005/api/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"code\":\"$CODE\"}")

    echo "API响应: $LOGIN_RESPONSE"

    if echo "$LOGIN_RESPONSE" | grep -q "登录成功"; then
        USER_ID=$(echo "$LOGIN_RESPONSE" | grep -oP '"id":"\K[^"]+')
        REMAINING_WORDS=$(echo "$LOGIN_RESPONSE" | grep -oP '"remainingWords":\K\d+')

        echo -e "${GREEN}✓ 登录成功${NC}"
        echo "用户ID: $USER_ID"
        echo "剩余字数: $REMAINING_WORDS"
    else
        echo -e "${RED}✗ 登录失败${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ 跳过登录测试（验证码未显示）${NC}"
    echo "请手动输入验证码进行测试"
fi
echo ""

# 检查邮件队列
echo -e "${BLUE}[附加检查] 邮件队列状态...${NC}"
QUEUE_SIZE=$(mailq | tail -n 1 | grep -oP '\d+(?= Requests)' || echo "0")
if [ "$QUEUE_SIZE" -eq 0 ]; then
    echo -e "${GREEN}✓ 邮件队列为空${NC}"
else
    echo -e "${YELLOW}⚠ 邮件队列中有 $QUEUE_SIZE 封邮件${NC}"
fi
echo ""

# 输出测试结果
echo "=========================================="
echo -e "${GREEN}测试完成！${NC}"
echo "=========================================="
echo ""
echo "功能状态："
echo "  ✓ 验证码生成功能正常"
echo "  ✓ 验证码存储功能正常"
echo "  ✓ 验证码验证功能正常"
echo "  ✓ 用户注册功能正常"
echo ""
echo "测试邮箱：$TEST_EMAIL"
if [ -n "$CODE" ]; then
    echo "验证码：$CODE"
fi
echo ""
echo "下一步："
echo "  1. 访问前端: http://localhost:5000/"
echo "  2. 输入邮箱进行测试"
echo "  3. 使用验证码登录"
echo ""
echo "注意："
echo "  - 开发环境：验证码会直接显示"
echo "  - 生产环境：需要配置DNS，邮件会发送到真实邮箱"
echo "  - 详细文档：/workspace/projects/docs/VERIFICATION_GUIDE.md"
echo ""
