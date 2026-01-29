# 知笔 - 后端 API 使用说明

## 项目概述

知笔是一个论文降AI率网站，提供完整的用户认证、充值、AI文本处理等功能。

## 技术栈

- **后端**: Express + TypeScript
- **数据库**: PostgreSQL (使用 Drizzle ORM)
- **AI模型**: 豆包大模型 (通过 coze-coding-dev-sdk)
- **前端**: Vite + React + Tailwind CSS

## 项目结构

```
workspace/projects/
├── server/                    # 后端代码
│   └── src/
│       ├── api/               # API 路由
│       │   ├── auth.ts        # 认证相关 API
│       │   ├── recharge.ts    # 充值相关 API
│       │   └── process.ts     # 文本处理 API
│       ├── storage/           # 数据存储
│       │   └── database/      # 数据库
│       │       ├── shared/
│       │       │   └── schema.ts  # 数据库表结构
│       │       ├── userManager.ts
│       │       ├── rechargeManager.ts
│       │       └── textProcessingManager.ts
│       └── index.ts           # 服务器入口
├── src/                       # 前端代码
│   └── lib/
│       └── api.ts             # 前端 API 客户端
└── package.json               # 项目依赖
```

## 数据库表结构

### 1. users (用户表)
- `id`: 用户ID (UUID)
- `email`: 邮箱地址 (唯一)
- `remaining_words`: 剩余字数
- `total_words_used`: 已使用字数
- `is_first_user`: 是否首次用户
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 2. recharge_records (充值记录表)
- `id`: 记录ID (UUID)
- `user_id`: 用户ID
- `package_type`: 套餐类型
- `words_added`: 添加的字数
- `amount`: 金额（分）
- `created_at`: 创建时间

### 3. text_processing_records (文本处理记录表)
- `id`: 记录ID (UUID)
- `user_id`: 用户ID
- `original_text`: 原始文本
- `processed_text`: 处理后的文本
- `word_count`: 字数
- `created_at`: 创建时间

## API 接口文档

### 基础URL
```
开发环境: http://localhost:5001
生产环境: 根据实际部署配置
```

### 1. 认证相关 API

#### 1.1 发送验证码
```http
POST /api/auth/send-code
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "message": "验证码已发送",
  "code": "123456" // 仅开发环境返回
}
```

#### 1.2 登录/注册
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}

Response:
{
  "message": "登录成功",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "remainingWords": 500,
    "totalWordsUsed": 0,
    "isFirstUser": true
  }
}
```

#### 1.3 获取当前用户信息
```http
GET /api/auth/me

Response:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "remainingWords": 500,
    "totalWordsUsed": 0,
    "isFirstUser": false
  }
}
```

#### 1.4 退出登录
```http
POST /api/auth/logout

Response:
{
  "message": "退出登录成功"
}
```

### 2. 充值相关 API

#### 2.1 获取所有充值套餐
```http
GET /api/recharge/plans

Response:
{
  "plans": [
    {
      "id": "newbie",
      "name": "新人体验",
      "description": "首次试用 建立信任，零成本体验",
      "price": 0,
      "words": 500,
      "badge": "新人"
    },
    {
      "id": "emergency",
      "name": "单次应急",
      "description": "结尾/摘要修改 随买随走，灵活方便",
      "price": 600,
      "words": 500,
      "unitPrice": 1.2
    },
    {
      "id": "value",
      "name": "超值套餐",
      "description": "核心章节降重 主推款，单价仅 4.8 元",
      "price": 2900,
      "words": 3000,
      "unitPrice": 0.967,
      "badge": "推荐"
    },
    {
      "id": "full",
      "name": "全篇包干",
      "description": "整篇初稿降重 适合大篇幅一次性处理",
      "price": 9900,
      "words": 15000,
      "unitPrice": 0.66
    },
    {
      "id": "unlimited",
      "name": "七日无限",
      "description": "深度返修/工作室 顶级权限，闭眼无限改",
      "price": 49900,
      "words": 999999,
      "badge": "👑"
    }
  ]
}
```

#### 2.2 计算文本字数和费用
```http
POST /api/recharge/calculate
Content-Type: application/json

{
  "text": "这是一段测试文本..."
}

Response:
{
  "wordCount": 500,
  "cost": 600,
  "costInYuan": 6
}
```

#### 2.3 创建充值订单
```http
POST /api/recharge/create-order
Content-Type: application/json

{
  "planId": "value"
}

Response (新人体验套餐):
{
  "message": "充值成功",
  "record": { ... },
  "user": { ... }
}

Response (付费套餐):
{
  "message": "订单创建成功，请支付",
  "orderId": "ORDER_xxx",
  "plan": { ... },
  "paymentUrl": "/api/recharge/confirm-payment?orderId=xxx&planId=value"
}
```

#### 2.4 确认支付
```http
POST /api/recharge/confirm-payment
Content-Type: application/json

{
  "planId": "value"
}

Response:
{
  "message": "支付成功",
  "record": { ... },
  "user": { ... }
}
```

#### 2.5 获取充值记录
```http
GET /api/recharge/records

Response:
{
  "records": [
    {
      "id": "uuid",
      "userId": "uuid",
      "packageType": "超值套餐",
      "wordsAdded": 3000,
      "amount": 2900,
      "createdAt": "2024-01-23T..."
    }
  ]
}
```

### 3. 文本处理相关 API

#### 3.1 检查字数和费用
```http
POST /api/process/check
Content-Type: application/json

{
  "text": "这是一段测试文本..."
}

Response:
{
  "wordCount": 500,
  "hasEnough": true,
  "remainingWords": 500,
  "cost": 600,
  "costInYuan": 6,
  "needRecharge": false
}
```

#### 3.2 处理文本（流式输出）
```http
POST /api/process/process
Content-Type: application/json

{
  "text": "这是一段测试文本..."
}

Response (Server-Sent Events):
data: {"content": "处理后的"}
data: {"content": "文本片段"}
data: {"done": true, "recordId": "uuid"}
```

#### 3.3 获取处理记录
```http
GET /api/process/records

Response:
{
  "records": [
    {
      "id": "uuid",
      "userId": "uuid",
      "originalText": "原始文本...",
      "processedText": "处理后的文本...",
      "wordCount": 500,
      "createdAt": "2024-01-23T..."
    }
  ]
}
```

#### 3.4 获取单个处理记录
```http
GET /api/process/records/:id

Response:
{
  "record": {
    "id": "uuid",
    "userId": "uuid",
    "originalText": "原始文本...",
    "processedText": "处理后的文本...",
    "wordCount": 500,
    "createdAt": "2024-01-23T..."
  }
}
```

## 充值套餐说明

| 套餐ID | 名称 | 价格 | 字数 | 说明 |
|--------|------|------|------|------|
| newbie | 新人体验 | 0元 | 500字 | 首次试用，零成本体验 |
| emergency | 单次应急 | 6元 | 500字 | 随买随走，灵活方便 |
| value | 超值套餐 | 29元 | 3000字 | 主推款，单价仅 4.8 元 |
| full | 全篇包干 | 99元 | 1.5万字 | 适合大篇幅一次性处理 |
| unlimited | 七日无限 | 499元 | 无限字数 | 顶级权限，闭眼无限改 |

## 计费规则

- 基础单价: 0.012元/字
- 最低字数: 500字（不满500字按500字计算）
- 计算方式: `实际字数 < 500 ? 500 : 实际字数`

## AI处理提示词

系统使用豆包大模型，通过专门的提示词实现反AI降重效果，核心规则包括：

1. 打破AI常见的论述结构，避免使用模板化表达
2. 改变表达路径，不仅是词语替换
3. 调整语序与句式节奏，长短句不均衡
4. 保留信息，弱化解释感
5. 避免AI风格特征
6. 只输出处理后的文本，不添加说明

## 前端使用示例

### 使用 API 客户端

```typescript
import { authApi, rechargeApi, processApi } from '@/lib/api';

// 1. 发送验证码
const { code } = await authApi.sendCode('user@example.com');

// 2. 登录
const { user } = await authApi.login('user@example.com', code);

// 3. 检查字数
const { wordCount, hasEnough, needRecharge } = await processApi.check('待处理文本');

// 4. 处理文本（流式输出）
await processApi.process(
  '待处理文本',
  (chunk) => {
    console.log('接收到数据块:', chunk);
  },
  (recordId) => {
    console.log('处理完成，记录ID:', recordId);
  }
);

// 5. 获取充值套餐
const { plans } = await rechargeApi.getPlans();

// 6. 创建订单
const { orderId, paymentUrl } = await rechargeApi.createOrder('value');
```

## 启动项目

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动前后端服务（前端 5000，后端 5001）
pnpm dev
```

### 生产环境

```bash
# 构建前端
pnpm build

# 启动前端
pnpm dev:client

# 启动后端
pnpm dev:server
```

## 环境变量

创建 `.env` 文件：

```env
# 前端端口
PORT=5000

# 后端端口
SERVER_PORT=5001

# 豆包大模型API密钥
DOUBAO_API_KEY=a6bdc581-5f93-4f85-b075-d3d6c320908e

# Session密钥
SESSION_SECRET=zhibi-secret-key-2024

# 前端URL
FRONTEND_URL=http://localhost:5000

# 环境
NODE_ENV=development
```

## 注意事项

1. **验证码**: 开发环境下验证码会在响应中返回，生产环境应配置邮件服务
2. **支付**: 当前为模拟支付，生产环境应接入真实支付系统（微信、支付宝等）
3. **Session**: 使用 express-session 存储，生产环境建议使用 Redis
4. **数据库**: 使用集成服务的 PostgreSQL 数据库
5. **流式输出**: AI 处理使用 SSE (Server-Sent Events) 实现流式输出

## 支持平台

- 中国知网
- 维普论文检测系统
- Turnitin

## 宣传语

- 反Ai独家算法
- 未通过检测率，全额退款
