# Vercel 部署说明

## 重要提示

⚠️ **Vercel 的文件系统限制**：
- Vercel 使用无服务器（serverless）架构
- 文件系统是**只读的**（除了 `/tmp` 目录）
- 上传的文件会存储在 `/tmp` 目录，但**重启后会丢失**
- JSON 数据文件也会存储在 `/tmp` 目录，**重启后会丢失**

## 部署步骤

### 1. 安装 Vercel CLI（如果还没有）

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 在 backend 目录部署

```bash
cd backend
vercel
```

按照提示操作：
- 是否要部署到现有项目？选择 `N`（新建项目）
- 项目名称：输入 `ai-course-backend` 或你喜欢的名称
- 目录：直接回车（当前目录）

### 4. 获取部署地址

部署完成后，Vercel 会显示你的项目地址，例如：
```
https://ai-course-backend.vercel.app
```

### 5. 更新前端代码

在 `frontend/index.html` 和 `frontend/admin.html` 中，将 `PRODUCTION_API_URL` 修改为你的 Vercel 地址：

```javascript
const PRODUCTION_API_URL = 'https://ai-course-backend.vercel.app/api';
```

### 6. 重新部署前端

将修改后的前端代码推送到 GitHub，GitHub Pages 会自动更新。

## 限制说明

由于 Vercel 的文件系统限制，当前实现有以下问题：

1. **文件持久化**：上传的文件存储在 `/tmp`，重启后会丢失
2. **数据持久化**：JSON 数据文件也存储在 `/tmp`，重启后会丢失

## 解决方案

如果需要持久化存储，建议：

1. **使用 Vercel Blob Storage**（推荐）
   - 免费额度：每月 1GB
   - 适合存储图片、视频等文件

2. **使用 Cloudinary**（推荐）
   - 免费额度：每月 25GB
   - 支持图片、视频上传和转换

3. **使用数据库**
   - 将 JSON 数据迁移到数据库（如 MongoDB Atlas、Supabase）
   - 文件存储在云存储服务

4. **使用 Railway 或 Render**
   - 这些平台支持持久化文件系统
   - 更适合需要文件存储的应用

## 当前状态

当前代码已适配 Vercel，但使用 `/tmp` 目录存储文件和数据，**不适合生产环境**。

建议：
- **开发/测试**：可以使用 Vercel
- **生产环境**：建议使用 Railway、Render 或集成云存储服务
