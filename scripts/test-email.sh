#!/bin/bash

# 本地邮件服务器测试脚本
# 用于测试Postfix邮件发送功能

echo "==================================="
echo "本地邮件服务器测试工具"
echo "==================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Postfix状态
echo -e "${YELLOW}[1/6] 检查Postfix服务状态...${NC}"
if service postfix status | grep -q "is running"; then
    echo -e "${GREEN}✓ Postfix服务正在运行${NC}"
else
    echo -e "${RED}✗ Postfix服务未运行${NC}"
    echo "正在启动Postfix..."
    service postfix start
fi
echo ""

# 检查端口监听
echo -e "${YELLOW}[2/6] 检查邮件端口监听状态...${NC}"
if netstat -tlnp 2>/dev/null | grep -q ":25"; then
    echo -e "${GREEN}✓ 邮件端口25正在监听${NC}"
else
    echo -e "${RED}✗ 邮件端口25未监听${NC}"
fi
echo ""

# 检查邮件队列
echo -e "${YELLOW}[3/6] 检查邮件队列...${NC}"
QUEUE_SIZE=$(mailq | tail -n 1 | grep -oP '\d+(?= Requests)')
if [ -z "$QUEUE_SIZE" ] || [ "$QUEUE_SIZE" -eq 0 ]; then
    echo -e "${GREEN}✓ 邮件队列为空${NC}"
else
    echo -e "${YELLOW}⚠ 邮件队列中有 $QUEUE_SIZE 封邮件${NC}"
    echo "详细队列信息："
    mailq
fi
echo ""

# 测试发送验证码
echo -e "${YELLOW}[4/6] 测试发送验证码...${NC}"
echo "请输入测试邮箱地址（留空跳过）："
read TEST_EMAIL

if [ -n "$TEST_EMAIL" ]; then
    echo "正在发送验证码到 $TEST_EMAIL..."
    RESPONSE=$(curl -s -X POST http://127.0.0.1:5005/api/auth/send-code \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\"}")

    if echo "$RESPONSE" | grep -q "验证码已发送"; then
        CODE=$(echo "$RESPONSE" | grep -oP '"code":"\K\d+(?=")')
        echo -e "${GREEN}✓ 验证码发送成功${NC}"
        echo "验证码: $CODE"
    else
        echo -e "${RED}✗ 验证码发送失败${NC}"
        echo "响应: $RESPONSE"
    fi
else
    echo "跳过验证码测试"
fi
echo ""

# 检查最新的邮件日志
echo -e "${YELLOW}[5/6] 查看最新的邮件日志...${NC}"
echo "最近5条日志："
tail -n 5 /app/work/logs/bypass/backend.log | grep -E "验证码|邮件" || echo "暂无邮件日志"
echo ""

# 显示配置摘要
echo -e "${YELLOW}[6/6] 配置摘要${NC}"
echo "-----------------------------------"
echo "邮件域名: $(postconf myhostname)"
echo "发件人: noreply@zhibishop.cn"
echo "后端地址: http://127.0.0.1:5005"
echo "前端地址: http://localhost:5000"
echo "-----------------------------------"
echo ""

echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}测试完成！${NC}"
echo -e "${GREEN}===================================${NC}"
echo ""
echo "提示："
echo "1. 开发环境下，验证码会显示在API响应和后端日志中"
echo "2. 生产环境需要配置真实的域名和DNS记录"
echo "3. 查看详细文档: /workspace/projects/docs/local-email-server.md"
echo ""
