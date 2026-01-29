# 知笔 - 论文降AI率平台

## 项目简介

知笔是一个专业的论文降AI率平台，使用先进的人工智能技术帮助用户降低论文的AI检测率，支持中国知网、维普、Turnitin等主流检测平台。

## 核心功能

### ✅ 已实现功能

1. **用户认证系统**
   - 邮箱验证码登录/注册
   - 基于 Session 的会话管理
   - 新用户免费体验500字

2. **文本处理**
   - 两栏布局（左边输入，右边输出）
   - 实时字数统计
   - 流式AI处理显示
   - 一键复制结果

3. **充值系统**
   - 多种充值套餐
   - 基于字数的计费规则（0.012元/字）
   - 500字起步

4. **邮件服务**
   - 集成 MailerSend 发送验证码
   - 精美的HTML邮件模板
   - 开发环境降级处理

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS + Framer Motion
- **包管理器**: pnpm

### 后端
- **框架**: Express + TypeScript
- **数据库**: PostgreSQL (Drizzle ORM)
- **会话管理**: express-session
- **AI模型**: 豆包大模型 (doubao-seed-1-8-251228)

### 集成服务
- **邮件服务**: MailerSend
- **AI模型**: 豆包大模型 (Coze Coding SDK)
- **数据库**: PostgreSQL

## 项目结构

```
workspace/projects/
├── src/                          # 前端源码
│   ├── pages/                    # 页面组件
│   │   ├── TextProcessor.tsx     # 文本处理主页面
│   │   └── Pricing.tsx           # 价格方案页面
│   ├── components/               # 通用组件
│   │   ├── LoginModal.tsx        # 登录弹窗
│   │   └── AuthContext.tsx       # 认证上下文
│   ├── api/                      # API 调用封装
│   │   ├── auth.ts               # 认证 API
│   │   └── process.ts            # 处理 API
│   └── main.tsx                  # 入口文件
├── server/                       # 后端源码
│   ├── src/
│   │   ├── api/                  # API 路由
│   │   │   ├── auth.ts           # 认证接口
│   │   │   └── process.ts        # 处理接口
│   │   └── storage/
│   │       └── database.ts       # 数据库配置
│   └── package.json
├── .env                          # 环境变量
├── package.json                  # 前端依赖
└── .coze                         # 项目配置

```

## 快速开始

### 环境要求
- Node.js 18+
- pnpm

### 安装依赖

#### 前端依赖
```bash
cd /workspace/projects
pnpm install
```

#### 后端依赖
```bash
cd /workspace/projects/server
pnpm install
```

### 配置环境变量

复制 `.env` 文件并配置以下变量：

```env
# 前端端口
PORT=5000

# 后端端口
SERVER_PORT=5001

# 豆包大模型API密钥
DOUBAO_API_KEY=your-api-key

# Session密钥
SESSION_SECRET=your-secret-key

# 前端URL
FRONTEND_URL=http://localhost:5000

# 环境
NODE_ENV=development

# MailerSend 邮件服务
MAILERSEND_API_KEY=your-mailersend-key
MAILERSEND_FROM_EMAIL=noreply@zhibi.com
```

### 启动服务

#### 开发环境
```bash
# 启动前端（端口 5000）
cd /workspace/projects
pnpm dev

# 启动后端（端口 5001）
cd /workspace/projects/server
pnpm dev
```

#### 使用 Coze CLI
```bash
# 前端
coze dev

# 后端
cd server
coze dev
```

## 功能使用说明

### 1. 用户登录
1. 访问 `http://localhost:5000`
2. 点击"登录"按钮
3. 输入邮箱地址
4. 点击"发送验证码"
5. 输入收到的6位验证码
6. 点击"登录"即可完成注册/登录

### 2. 文本处理
1. 在左侧输入框粘贴需要处理的文本
2. 点击"开始降AI率"按钮
3. 等待AI处理完成（流式显示结果）
4. 点击"复制"按钮获取处理后的文本

### 3. 充值字数
1. 点击顶部导航栏的"充值"按钮
2. 选择合适的充值套餐
3. 完成支付（当前为模拟支付）

## API 文档

### 认证接口

#### 发送验证码
```
POST /api/auth/send-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

### 文本处理接口

#### 检查字数
```
POST /api/process/check
Content-Type: application/json

{
  "text": "需要处理的文本"
}
```

#### 流式处理
```
POST /api/process/process
Content-Type: application/json

{
  "text": "需要处理的文本"
}

响应: Server-Sent Events (SSE) 流式输出
```

## 计费规则

- **单价**: 0.012元/字
- **最低计费**: 500字（不足500字按500字计算）
- **新用户**: 免费体验500字

## 支持的检测平台

- ✅ 中国知网
- ✅ 维普
- ✅ Turnitin

## 质量保证

- 反AI独家算法
- 未通过检测率，全额退款

## 相关文档

- [TextProcessor 页面功能说明](./TEXT_PROCESSOR_GUIDE.md)
- [MailerSend 邮件服务集成](./MAILERSEND_INTEGRATION.md)

## 开发注意事项

### 邮件服务
- 开发环境下，验证码会打印到控制台
- 生产环境需要配置正确的 MailerSend API Key
- 发件人邮箱域名需要通过 DNS 验证

### AI处理
- 使用 Server-Sent Events (SSE) 实现流式输出
- 确保前端正确处理流式数据
- 处理完成后自动显示复制按钮

### 数据库
- 使用 PostgreSQL 数据库
- 集成服务自动注入数据库连接
- 使用 Drizzle ORM 进行数据操作

## 故障排查

### 前端无法启动
1. 检查端口 5000 是否被占用
2. 确认依赖已安装：`pnpm install`
3. 查看浏览器控制台错误信息

### 后端无法启动
1. 检查端口 5001 是否被占用
2. 确认后端依赖已安装：`cd server && pnpm install`
3. 检查环境变量配置是否正确

### 邮件未收到
1. 检查控制台日志，确认 API 调用是否成功
2. 检查邮箱的垃圾邮件文件夹
3. 确认 MailerSend 账户状态正常
4. 确认发件域名已通过 DNS 验证

### AI处理失败
1. 检查豆包大模型 API Key 是否正确
2. 确认账户余额充足
3. 查看后端服务日志

## 后续计划

- [ ] 接入真实的支付系统
- [ ] 添加用户历史记录功能
- [ ] 支持批量文本处理
- [ ] 添加文本相似度对比功能
- [ ] 支持多种AI模型选择
- [ ] 优化UI/UX体验

## 许可证

© 2024 知笔. 保留所有权利。
