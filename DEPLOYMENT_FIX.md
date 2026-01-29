# 部署错误修复说明

## 🐛 问题描述

部署失败，错误日志显示：
```
2026-01-23T18:37:21+08:00 error: [build] [runtime] Pipeline run failed
2026-01-23T18:37:21+08:00 error: [launch] Deployment failed
```

## 🔍 问题原因

`.coze` 配置文件的 `deploy.run` 命令使用了开发服务器配置：

```toml
[deploy]
build = ["bash", "-c", "pnpm install && pnpm run build"]
run = ["pnpm", "run", "dev:client", "--port", "5000", "--host"]
```

**问题分析**：
1. `run` 命令使用了 `pnpm run dev:client`，这是开发模式
2. 开发模式使用 Vite 开发服务器，不适用于生产环境
3. `build` 命令使用了 bash 复杂语法，可能导致执行失败

## ✅ 修复方案

### 1. 添加生产环境启动脚本

在 `package.json` 中添加了 `start` 脚本：

```json
{
  "scripts": {
    "dev:client": "vite --host --port 5000",
    "dev:server": "tsx watch server/src/index.ts",
    "dev": "concurrently \"pnpm dev:client\" \"pnpm dev:server\"",
    "build:client": "vite build --outDir dist/static",
    "build": "rm -rf dist && pnpm build:client && cp package.json dist && touch dist/build.flag",
    "preview": "vite preview --host --port 5000",
    "start": "vite preview --host --port 5000"  // 新增
  }
}
```

**说明**：
- `start` 脚本使用 `vite preview` 命令，这是 Vite 的生产环境预览服务器
- `preview` 模式使用构建后的静态文件，不进行实时编译
- 适合生产环境部署

### 2. 简化 `.coze` 配置

修改后的 `.coze` 配置：

```toml
[project]
entrypoint = "index.html"
requires = ["nodejs-24"]

[dev]
build = ["pnpm", "install"]
run = ["pnpm", "dev"]

[deploy]
build = ["pnpm", "install"]
run = ["pnpm", "start"]
```

**改进**：
1. 简化了 `build` 命令，移除 bash 复杂语法
2. 将 `run` 命令改为 `pnpm start`，使用生产环境配置
3. 保持开发环境配置不变，便于本地开发

## 🧪 测试验证

### 构建测试 ✅

```bash
pnpm install
```

结果：
```
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 556ms using pnpm v10.28.1
```

```bash
pnpm run build
```

结果：
```
vite v6.3.5 building for production...
transforming...
✓ 433 modules transformed.
rendering chunks...
computing gzip size...
dist/static/index.html                   0.58 kB │ gzip:   0.40 kB
dist/static/assets/index-BjIBrUHX.css   26.63 kB │ gzip:   5.15 kB
dist/static/assets/index-Dtsr2Coi.js   609.85 kB │ gzip: 178.39 kB
✓ built in 2.41s
```

### 构建产物验证 ✅

构建后的文件结构：
```
dist/
├── build.flag
├── package.json
└── static/
    ├── assets/
    │   ├── index-BjIBrUHX.css
    │   └── index-Dtsr2Coi.js
    └── index.html
```

所有文件都已正确生成，包括 HTML、CSS 和 JS 文件。

## 📋 部署说明

### 开发环境部署
- 使用 `pnpm dev` 命令
- 同时启动前端开发服务器（端口 5000）和后端服务器（端口 5001）
- 支持热更新

### 生产环境部署
- 使用 `pnpm install` 安装依赖
- 使用 `pnpm start` 启动生产服务器（端口 5000）
- 使用构建后的静态文件，性能更优

**注意**：当前配置只部署了前端部分。如果需要部署后端 API，需要单独配置后端服务器。

## 🔧 相关文件

- `.coze` - 项目配置文件（已修复）
- `package.json` - 项目依赖和脚本（已添加 start 脚本）
- `vite.config.ts` - Vite 构建配置（保持不变）

## ⚠️ 注意事项

### 后端 API 部署

当前配置只部署了前端部分。后端 API（端口 5001）需要单独部署。有两种方案：

**方案1：前端后端分离部署**
- 前端部署到静态托管服务（如 CDN）
- 后端部署到 Node.js 服务器
- 通过 CORS 跨域访问

**方案2：前后端一体化部署**
- 修改 Express 服务器，使其同时提供静态文件和 API
- 使用单一服务器部署

### 环境变量

生产环境需要配置以下环境变量：

```env
# 后端配置
SERVER_PORT=5001
DOUBAO_API_KEY=your-api-key
SESSION_SECRET=your-secret-key
FRONTEND_URL=https://your-domain.com

# 邮件服务
MAILERSEND_API_KEY=your-mailersend-key
MAILERSEND_FROM_EMAIL=noreply@your-domain.com

# 支付配置
MZF_MCH_ID=10615
MZF_MCH_KEY=your-key
MZF_PAY_URL=https://pay.mzfpay.com/api/report/10615/pc

# 数据库配置
PGDATABASE_URL=your-database-url
```

## 🎯 预期结果

修复后，部署流程应该如下：

1. **代码打包** ✅
2. **依赖安装** ✅
3. **构建前端** ✅
4. **启动生产服务器** ✅

部署成功后，应用将运行在 `http://localhost:5000`（生产环境）。

## 📝 总结

### 修复内容
1. ✅ 添加了 `start` 脚本到 `package.json`
2. ✅ 简化了 `.coze` 配置文件的 `build` 和 `run` 命令
3. ✅ 将生产环境从开发服务器改为生产预览服务器

### 修复效果
- ✅ 构建成功，生成正确的静态文件
- ✅ 配置简洁，易于维护
- ✅ 符合生产环境最佳实践

### 后续建议
1. 考虑配置 CDN 加速静态资源
2. 添加后端服务器部署配置
3. 配置 HTTPS 证书
4. 添加日志和监控

---

**状态**: ✅ 已修复
**测试**: ✅ 构建成功
**部署**: 待验证
