# 解决 Vercel API 404 问题

## 问题描述

访问 `https://backend-topaz-zeta-46.vercel.app/api` 返回 404 错误。

## 可能的原因

Vercel 项目的根目录可能设置不正确。如果 Vercel 项目指向整个仓库的根目录（`d:\课程设计`），而不是 `backend` 目录，那么需要调整配置。

## 解决方案

### 方案 1：在 Vercel Dashboard 中设置根目录

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入项目 `backend-topaz-zeta-46`
3. 进入 **Settings** → **General**
4. 找到 **Root Directory** 设置
5. 设置为 `backend`
6. 保存并重新部署

### 方案 2：将 vercel.json 移到根目录（如果方案1不可行）

如果 Vercel 项目必须指向根目录，需要：

1. 在根目录创建 `vercel.json`，内容如下：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api",
      "dest": "/backend/api/index.js"
    },
    {
      "src": "/api/(.*)",
      "dest": "/backend/api/index.js"
    }
  ]
}
```

2. 更新 `backend/api/index.js` 中的路径：

```javascript
const app = require('../server');
module.exports = app;
```

### 方案 3：检查 Vercel 部署日志

1. 在 Vercel Dashboard 中查看最新的部署
2. 查看 **Build Logs** 和 **Function Logs**
3. 检查是否有错误信息

## 当前配置检查

当前 `backend/vercel.json` 配置：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api",
      "dest": "/api/index.js"
    },
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

这个配置假设 Vercel 项目的根目录是 `backend`。

## 推荐操作步骤

1. **首先尝试方案 1**：在 Vercel Dashboard 中设置 Root Directory 为 `backend`
2. **如果方案 1 不可行**，告诉我，我可以帮你实施方案 2
3. **检查部署日志**：查看是否有构建错误

## 验证

修复后，访问以下 URL 应该返回 JSON 响应：

- `https://backend-topaz-zeta-46.vercel.app/api` - API 信息
- `https://backend-topaz-zeta-46.vercel.app/api/courses` - 课程列表
- `https://backend-topaz-zeta-46.vercel.app/api/levels` - 关卡列表
