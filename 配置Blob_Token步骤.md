# 配置 Blob Storage Token

## 你的 Token

```
vercel_blob_rw_HDli5TdWm5ZId6Fb_LXsIycDc2o1D2UU6v2KWubFO5AiNS2
```

## 配置步骤

### 方法 1：在 Vercel Dashboard 中配置（推荐）

1. **访问项目设置**
   ```
   https://vercel.com/dashboard
   → 点击项目 "backend"
   → Settings → Environment Variables
   ```

2. **更新环境变量**
   - 找到 `BLOB_READ_WRITE_TOKEN` 变量
   - 点击变量 → 点击 **Edit** 或 **编辑**
   - 将值更新为：`vercel_blob_rw_HDli5TdWm5ZId6Fb_LXsIycDc2o1D2UU6v2KWubFO5AiNS2`
   - 点击 **Save**

3. **如果没有找到变量，添加新变量**
   - 点击 **Add New**
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: `vercel_blob_rw_HDli5TdWm5ZId6Fb_LXsIycDc2o1D2UU6v2KWubFO5AiNS2`
   - **Environment**: 选择 `Production`、`Preview`、`Development`
   - 点击 **Save**

### 方法 2：使用 CLI 配置

如果 Dashboard 中已经存在变量但值不对，需要先删除再添加：

```powershell
# 设置 API Token
$env:VERCEL_TOKEN="你的Vercel_API_Token"

# 删除旧的环境变量（如果存在）
npx vercel env rm BLOB_READ_WRITE_TOKEN production
npx vercel env rm BLOB_READ_WRITE_TOKEN preview
npx vercel env rm BLOB_READ_WRITE_TOKEN development

# 添加新的环境变量
npx vercel env add BLOB_READ_WRITE_TOKEN production
# 当提示输入值时，粘贴：vercel_blob_rw_HDli5TdWm5ZId6Fb_LXsIycDc2o1D2UU6v2KWubFO5AiNS2
# 当提示是否敏感时，输入：y
```

## 重新部署

配置环境变量后，**必须重新部署**才能生效：

1. **在 Dashboard 中**：
   - 进入 **Deployments** 页面
   - 找到最新的部署
   - 点击 **...** → **Redeploy**

2. **或使用 CLI**：
   ```powershell
   cd backend
   $env:VERCEL_TOKEN="你的Vercel_API_Token"
   npx vercel --prod
   ```

## 验证配置

部署完成后，测试上传：

1. 访问管理页面：`https://wangkainan2021.github.io/ai-course/frontend/admin.html`
2. 上传一张图片或视频
3. 检查返回的 URL：
   - ✅ **成功**：URL 格式为 `https://xxx.public.blob.vercel-storage.com/uploads/...`
   - ❌ **失败**：URL 仍然是 `/uploads/...` 格式

## 下一步

配置完成后，告诉我，我可以帮你重新部署项目。
