# 配置 Vercel Blob Storage 云存储

## 概述

Vercel Blob Storage 是 Vercel 官方提供的云存储服务，可以解决 serverless 函数临时存储的问题，实现文件持久化存储。

## 配置步骤

### 1. 在 Vercel Dashboard 创建 Blob Storage

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目（`backend-topaz-zeta-46` 或你的项目名称）
3. 进入 **Storage** 标签页
4. 点击 **Create Database**
5. 选择 **Blob** 类型
6. 填写名称（例如：`ai-course-storage`）
7. 选择区域（建议选择离用户最近的区域）
8. 点击 **Create**

### 2. 获取访问令牌

创建 Blob Storage 后，Vercel 会自动生成访问令牌：

1. 在 Storage 页面，找到你创建的 Blob Storage
2. 点击进入详情页
3. 在 **Settings** 或 **Environment Variables** 中，找到 `BLOB_READ_WRITE_TOKEN`
4. 复制这个令牌值

### 3. 配置环境变量

有两种方式配置环境变量：

#### 方式 A：在 Vercel Dashboard 配置（推荐）

1. 在 Vercel 项目页面，进入 **Settings** → **Environment Variables**
2. 添加新的环境变量：
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: 粘贴刚才复制的令牌值
   - **Environment**: 选择 `Production`、`Preview`、`Development`（根据需要）
3. 点击 **Save**
4. **重要**：需要重新部署项目才能生效

#### 方式 B：在本地 `.env` 文件配置（仅用于本地测试）

在 `backend` 目录下创建 `.env` 文件：

```env
BLOB_READ_WRITE_TOKEN=你的令牌值
```

**注意**：`.env` 文件不要提交到 Git（已在 `.gitignore` 中）

### 4. 重新部署项目

配置环境变量后，需要重新部署：

```bash
# 在 backend 目录下
cd backend
npx vercel --prod
```

或者在 Vercel Dashboard 中：
1. 进入项目页面
2. 点击 **Deployments**
3. 找到最新的部署，点击 **Redeploy**

### 5. 验证配置

部署完成后，测试文件上传：

1. 访问管理页面：`https://wangkainan2021.github.io/ai-course/frontend/admin.html`
2. 上传一张图片或视频
3. 检查返回的 URL：
   - 如果使用 Blob Storage，URL 应该是 `https://xxx.public.blob.vercel-storage.com/...` 格式
   - 如果还是 `/uploads/...` 格式，说明配置未生效

## 工作原理

### 本地环境
- 文件存储在 `backend/uploads/` 目录
- 文件 URL 格式：`/uploads/images/xxx.png`

### Vercel 环境（使用 Blob Storage）
- 文件上传到 Vercel Blob Storage
- 文件 URL 格式：`https://xxx.public.blob.vercel-storage.com/uploads/images/xxx.png`
- 文件持久化存储，不会因为 serverless 函数重启而丢失

### 自动切换
代码会自动检测：
- 如果 `BLOB_READ_WRITE_TOKEN` 环境变量存在，使用 Blob Storage
- 否则，使用本地存储或 `/tmp` 临时存储

## 注意事项

1. **成本**：Vercel Blob Storage 有免费额度，超出后按使用量收费。查看 [Vercel 定价页面](https://vercel.com/pricing) 了解详情。

2. **文件大小限制**：单个文件大小限制取决于你的 Vercel 计划。

3. **迁移现有文件**：
   - 现有文件存储在本地 `backend/uploads/` 目录
   - 需要重新上传到 Blob Storage
   - 可以通过管理页面逐个重新上传，或使用批量上传工具

4. **环境变量同步**：
   - 确保在 Vercel Dashboard 中配置了环境变量
   - 本地开发时，可以在 `.env` 文件中配置（不提交到 Git）

## 故障排查

### 问题：上传失败，提示 "BLOB_READ_WRITE_TOKEN 未配置"

**解决方案**：
1. 检查 Vercel Dashboard 中的环境变量配置
2. 确保环境变量名称是 `BLOB_READ_WRITE_TOKEN`（大小写敏感）
3. 重新部署项目

### 问题：上传成功，但文件无法访问

**解决方案**：
1. 检查返回的 URL 是否是 Blob Storage URL
2. 检查 Blob Storage 的访问权限设置（应该是 `public`）
3. 检查浏览器控制台的错误信息

### 问题：本地测试时无法使用 Blob Storage

**解决方案**：
1. 在 `backend/.env` 文件中配置 `BLOB_READ_WRITE_TOKEN`
2. 确保 `.env` 文件在 `backend` 目录下
3. 重启本地服务器

## 相关文档

- [Vercel Blob Storage 官方文档](https://vercel.com/docs/storage/vercel-blob)
- [@vercel/blob SDK 文档](https://github.com/vercel/blob)
