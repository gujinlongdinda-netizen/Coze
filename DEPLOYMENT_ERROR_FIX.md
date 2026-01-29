# 部署错误修复文档

## 🐛 问题描述

部署失败，错误日志：
```
2026-01-23T18:37:21+08:00 error: [build] [runtime] Pipeline run failed
2026-01-23T18:37:21+08:00 error: [launch] Deployment failed
```

日志显示 pnpm 命令只显示了帮助信息，说明命令执行失败。

## 🔍 根本原因

原始 `.coze` 配置：
```toml
[deploy]
build = ["pnpm", "install"]
run = ["pnpm", "start"]
```

**问题分析**：
1. `build` 步骤只安装了依赖，没有运行构建命令
2. `run` 步骤使用 `pnpm start` 运行 `vite preview`
3. `vite preview` 需要先有构建产物才能正常运行
4. 由于没有构建产物，导致启动失败

## ✅ 解决方案

### 步骤 1: 创建部署构建脚本

在 `package.json` 中添加 `deploy:build` 脚本：

```json
{
  "scripts": {
    "deploy:build": "pnpm install && pnpm build"
  }
}
```

这个脚本会：
1. 安装所有依赖
2. 构建前端项目（生成静态文件）

### 步骤 2: 更新 .coze 配置

修改 `.coze` 文件：

```toml
[deploy]
build = ["pnpm", "deploy:build"]
run = ["pnpm", "start"]
```

**改进**：
- `build` 步骤运行 `deploy:build` 脚本
- 同时完成依赖安装和项目构建
- `run` 步骤启动生产服务器

## 📊 验证测试

### 测试 1: 部署构建脚本

```bash
rm -rf dist
pnpm deploy:build
```

**结果** ✅：
```
Done in 524ms using pnpm v10.28.1
vite v6.3.5 building for production...
✓ 433 modules transformed.
✓ built in 2.19s
```

### 测试 2: 构建产物

```bash
ls -lh dist/
```

**结果** ✅：
```
total 8.0K
-rw-r--r-- 1 root root    0 Jan 23 19:08 build.flag
-rw-r--r-- 1 root root 1.5K Jan 23 19:08 package.json
drwxr-xr-x 3 root root 4.0K Jan 23 19:08 static/
```

构建产物：
- ✅ `index.html` (0.58 kB)
- ✅ `index-BjIBrUHX.css` (27 kB)
- ✅ `index-Dtsr2Coi.js` (596 kB)

### 测试 3: 启动生产服务器

```bash
pnpm start
```

**结果** ✅：
```
➜  Local:   http://localhost:5002/
➜  Network: http://9.129.98.245:5002/
```

服务器可以正常启动（端口自动调整避免冲突）。

## 📝 配置对比

### 修复前
```toml
[deploy]
build = ["pnpm", "install"]  # 只安装依赖
run = ["pnpm", "start"]     # 尝试启动，但没有构建产物
```

### 修复后
```toml
[deploy]
build = ["pnpm", "deploy:build"]  # 安装依赖 + 构建项目
run = ["pnpm", "start"]           # 启动生产服务器
```

## 🎯 关键改进

1. **确保构建产物存在**: 在 run 步骤之前完成构建
2. **简化配置**: 使用专用脚本，避免复杂的 bash 语法
3. **提高可靠性**: 清晰的构建流程，易于维护和调试

## 🚀 部署流程

### 修复后的部署流程：

```
1. [deploy] build
   ↓
   运行 pnpm deploy:build
   ├─ pnpm install (安装依赖)
   └─ pnpm build (构建项目)
      ↓
   生成 dist/static/ 产物
      ├─ index.html
      ├─ assets/index-*.css
      └─ assets/index-*.js

2. [deploy] run
   ↓
   运行 pnpm start
   ↓
   启动 vite preview
   ↓
   服务器运行在指定端口
```

## 📋 相关文件

- `.coze` - 部署配置（已修复）
- `package.json` - 添加 deploy:build 脚本
- `vite.config.ts` - Vite 构建配置

## ⚠️ 注意事项

### 1. 端口冲突
- `vite preview` 默认使用 5000 端口
- 如果端口被占用，会自动尝试其他端口
- 生产环境应确保端口配置正确

### 2. 构建时间
- 当前构建时间：约 2.2 秒
- 随着项目增大，构建时间会增加
- 考虑使用增量构建优化

### 3. 后端 API
- 当前配置只部署前端部分
- 后端 API（端口 5001）需要单独部署
- 需要配置 CORS 允许跨域访问

## 🔧 故障排查

### 问题 1: 构建失败
**症状**: `pnpm build` 报错

**解决方案**:
```bash
# 清理缓存和依赖
rm -rf node_modules dist
pnpm install
pnpm build
```

### 问题 2: 启动失败
**症状**: `vite preview` 无法启动

**解决方案**:
```bash
# 检查构建产物是否存在
ls -la dist/static/

# 检查端口是否被占用
ss -tuln | grep 5000

# 手动启动测试
pnpm start
```

### 问题 3: 静态资源 404
**症状**: 页面可以访问，但 CSS/JS 加载失败

**解决方案**:
- 检查 `vite.config.ts` 中的 `base` 配置
- 确保使用相对路径 `base: "./"`

## 📈 性能优化建议

### 1. 代码分割
当前 JS 文件大小：596 kB

建议：
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'recharts'],
          utils: ['clsx', 'tailwind-merge']
        }
      }
    }
  }
})
```

### 2. 启用 Gzip/Brotli
配置服务器压缩静态文件

### 3. CDN 加速
将静态资源上传到 CDN

## 🎉 预期结果

修复后，部署应该：
1. ✅ 成功安装依赖
2. ✅ 成功构建项目
3. ✅ 生成完整的构建产物
4. ✅ 成功启动生产服务器
5. ✅ 应用可以正常访问

---

**状态**: ✅ 已修复
**测试**: ✅ 所有测试通过
**准备部署**: ✅ 可以重新部署
