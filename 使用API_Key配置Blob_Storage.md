# 使用 API Key 配置 Vercel Blob Storage

## 重要说明

你提供的 API key (`vck_0wuYyGTJqUPOEohYa6USJzr3H00NZZF6LFYDq3UgdxKt4YM3cH2sl1uW`) 是 **Vercel 的 API Token**，不是 Blob Storage 的访问令牌。

## 两种方案

### 方案 A：在 Dashboard 中创建 Blob Storage（推荐）

1. **登录 Vercel Dashboard**
   - 访问：https://vercel.com/dashboard
   - 使用你的账户登录

2. **创建 Blob Storage**
   - 进入项目：`backend` 或 `backend-topaz-zeta-46`
   - 点击 **Storage** 标签页
   - 点击 **Create Database**
   - 选择 **Blob** 类型
   - 填写名称（例如：`ai-course-storage`）
   - 点击 **Create**

3. **获取 Blob Storage Token**
   - 创建后，在 Storage 详情页找到 **Settings**
   - 找到 `BLOB_READ_WRITE_TOKEN` 或类似的令牌
   - 复制这个令牌值（格式通常是：`vercel_blob_xxx...`）

4. **配置环境变量**
   - 在项目 **Settings** → **Environment Variables**
   - 添加：
     - **Name**: `BLOB_READ_WRITE_TOKEN`
     - **Value**: 粘贴 Blob Storage 的令牌
     - **Environment**: 选择 `Production`、`Preview`、`Development`
   - 点击 **Save**

5. **重新部署**
   - 在 **Deployments** 页面
   - 点击最新的部署 → **Redeploy**

### 方案 B：使用 Vercel CLI 配置（如果已创建 Blob Storage）

如果你已经在 Dashboard 中创建了 Blob Storage，可以使用 CLI 添加环境变量：

```bash
# 设置 Vercel API Token
$env:VERCEL_TOKEN="vck_0wuYyGTJqUPOEohYa6USJzr3H00NZZF6LFYDq3UgdxKt4YM3cH2sl1uW"

# 进入 backend 目录
cd backend

# 添加环境变量（需要手动输入 Blob Storage Token）
npx vercel env add BLOB_READ_WRITE_TOKEN production
# 当提示输入值时，粘贴 Blob Storage 的令牌（不是 API key）
# 当提示是否敏感时，输入 y
```

## 如何区分两种 Token

- **Vercel API Token** (`vck_xxx...`): 
  - 用于通过 CLI 或 API 管理 Vercel 项目
  - 不能直接用作 Blob Storage 访问令牌
  
- **Blob Storage Token** (`vercel_blob_xxx...` 或类似格式):
  - 专门用于访问 Blob Storage
  - 在创建 Blob Storage 后自动生成
  - 需要从 Dashboard 的 Storage 设置中获取

## 当前状态

我已经使用你的 API key 验证了项目连接，项目信息：
- **项目名称**: `backend`
- **生产环境 URL**: `https://backend-topaz-zeta-46.vercel.app`

## 下一步

1. **在 Dashboard 中创建 Blob Storage**（如果还没有）
2. **获取 Blob Storage Token**
3. **配置环境变量** `BLOB_READ_WRITE_TOKEN`
4. **重新部署项目**

配置完成后，文件上传将自动使用 Blob Storage，文件将持久化存储。

## 验证配置

配置完成后，测试上传：
1. 访问管理页面上传文件
2. 检查返回的 URL：
   - ✅ 成功：`https://xxx.public.blob.vercel-storage.com/...`
   - ❌ 失败：仍然是 `/uploads/...` 格式
