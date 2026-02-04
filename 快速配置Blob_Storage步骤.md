# 快速配置 Vercel Blob Storage

## 重要说明

你提供的 API key (`vck_0wuYyGTJqUPOEohYa6USJzr3H00NZZF6LFYDq3UgdxKt4YM3cH2sl1uW`) 是 **Vercel API Token**，用于管理项目，但不是 Blob Storage 的访问令牌。

## 必须完成的步骤

### 步骤 1：在 Dashboard 中创建 Blob Storage

1. **访问 Vercel Dashboard**
   - 打开：https://vercel.com/dashboard
   - 登录你的账户

2. **进入项目**
   - 找到项目：`backend` 或 `backend-topaz-zeta-46`
   - 点击进入项目详情页

3. **创建 Blob Storage**
   - 点击顶部导航栏的 **Storage** 标签
   - 如果看不到 Storage 标签，点击 **Settings** → 左侧菜单找到 **Storage**
   - 点击 **Create Database** 或 **Add Storage**
   - 选择 **Blob** 类型
   - 填写信息：
     - **Name**: `ai-course-storage`（或任意名称）
     - **Region**: 选择离你最近的区域（如 `iad1` 或 `hkg1`）
   - 点击 **Create**

### 步骤 2：获取 Blob Storage Token

创建完成后：

1. **找到 Blob Storage**
   - 在 Storage 列表中，点击你刚创建的 Blob Storage

2. **获取 Token**
   - 在详情页的 **Settings** 或 **Configuration** 中
   - 找到 **Environment Variables** 或 **Tokens**
   - 找到 `BLOB_READ_WRITE_TOKEN` 或类似的令牌
   - **复制这个令牌值**（格式可能是 `vercel_blob_xxx...` 或类似）

### 步骤 3：配置环境变量

有两种方式：

#### 方式 A：在 Dashboard 中配置（推荐）

1. 在项目页面，点击 **Settings** → **Environment Variables**
2. 点击 **Add New**
3. 填写：
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: 粘贴步骤 2 中复制的 Blob Storage Token
   - **Environment**: 勾选 `Production`、`Preview`、`Development`（根据需要）
4. 点击 **Save**

#### 方式 B：使用 CLI 配置

```powershell
# 设置 Vercel API Token
$env:VERCEL_TOKEN="vck_0wuYyGTJqUPOEohYa6USJzr3H00NZZF6LFYDq3UgdxKt4YM3cH2sl1uW"

# 进入 backend 目录
cd backend

# 添加环境变量（会提示输入值）
npx vercel env add BLOB_READ_WRITE_TOKEN production
# 当提示 "Enter the value for BLOB_READ_WRITE_TOKEN" 时，粘贴 Blob Storage Token
# 当提示 "Mark as sensitive?" 时，输入 y
```

### 步骤 4：重新部署

配置环境变量后，必须重新部署：

1. **在 Dashboard 中**：
   - 进入 **Deployments** 页面
   - 找到最新的部署
   - 点击 **...** → **Redeploy**

2. **或使用 CLI**：
   ```powershell
   cd backend
   $env:VERCEL_TOKEN="vck_0wuYyGTJqUPOEohYa6USJzr3H00NZZF6LFYDq3UgdxKt4YM3cH2sl1uW"
   npx vercel --prod
   ```

## 验证配置

部署完成后，测试上传：

1. 访问管理页面：`https://wangkainan2021.github.io/ai-course/frontend/admin.html`
2. 上传一张图片或视频
3. 检查返回的 URL：
   - ✅ **成功**：URL 格式为 `https://xxx.public.blob.vercel-storage.com/uploads/...`
   - ❌ **失败**：URL 仍然是 `/uploads/...` 格式（说明配置未生效）

## 常见问题

### Q: 找不到 Storage 标签？

**A**: 
- 确保你使用的是 Vercel 账户（不是 GitHub 账户）
- 尝试访问：https://vercel.com/dashboard → 选择项目 → Settings → Storage
- 如果还是没有，可能需要升级 Vercel 计划（某些功能可能需要付费计划）

### Q: 创建 Blob Storage 后找不到 Token？

**A**:
- 在 Blob Storage 详情页，查看 **Settings** 或 **Configuration**
- 或者查看项目的 **Environment Variables**，Vercel 可能已经自动添加了

### Q: 配置后上传仍然失败？

**A**:
- 检查环境变量名称是否正确：`BLOB_READ_WRITE_TOKEN`（大小写敏感）
- 确保已经重新部署项目
- 检查浏览器控制台的错误信息

## 当前项目信息

- **项目名称**: `backend`
- **生产环境 URL**: `https://backend-topaz-zeta-46.vercel.app`
- **Vercel API Token**: 已配置（用于 CLI 操作）

## 需要帮助？

如果遇到问题，请告诉我：
1. 你在 Dashboard 中看到了什么？
2. 是否成功创建了 Blob Storage？
3. 是否找到了 Blob Storage Token？
