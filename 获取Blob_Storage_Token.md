# 获取 Vercel Blob Storage Token

## 方法 1：在 Dashboard 中查找（推荐）

### 步骤 1：进入 Blob Storage 页面

1. 访问你提供的链接：
   ```
   https://vercel.com/wangkainans-projects/~/stores/blob/store_1WWYnP0Hst7oDsjl/browser
   ```

2. 或者通过项目页面进入：
   - 访问：https://vercel.com/dashboard
   - 进入项目 `backend`
   - 点击 **Storage** 标签
   - 点击你创建的 Blob Storage

### 步骤 2：查找 Token

在 Blob Storage 页面，查找以下位置：

1. **Settings 标签页**
   - 点击页面上的 **Settings** 或 **配置** 标签
   - 查找 **Environment Variables** 或 **Tokens** 部分
   - 应该能看到 `BLOB_READ_WRITE_TOKEN` 或类似的变量

2. **API 或 Tokens 部分**
   - 有些页面会在 **API** 或 **Tokens** 标签下
   - 查找 **Read & Write Token** 或 **Access Token**

3. **自动添加的环境变量**
   - Vercel 可能已经自动将 token 添加到项目环境变量中
   - 在项目页面 → **Settings** → **Environment Variables**
   - 查找以 `BLOB_` 开头的变量

## 方法 2：通过项目环境变量查找

1. **访问项目设置**
   - 访问：https://vercel.com/dashboard
   - 进入项目 `backend`
   - 点击 **Settings** → **Environment Variables**

2. **查找 Blob Storage Token**
   - 查找变量名包含 `BLOB` 的变量
   - 可能是：
     - `BLOB_READ_WRITE_TOKEN`
     - `BLOB_STORE_TOKEN`
     - `VERCEL_BLOB_READ_WRITE_TOKEN`

3. **如果没有找到**
   - 可能需要手动创建 token
   - 在 Blob Storage 页面查找 **Create Token** 或 **Generate Token** 按钮

## 方法 3：使用 Vercel CLI 查找

我已经尝试通过 CLI 查找，但需要你提供更多信息。

## 如果还是找不到

请告诉我：

1. **在 Blob Storage 页面（你提供的链接）上，你看到了什么？**
   - 有哪些标签页？（如：Browser、Settings、API、Tokens 等）
   - 页面上有什么按钮或链接？

2. **在项目 Settings → Environment Variables 中，有哪些变量？**
   - 是否有任何以 `BLOB` 开头的变量？

3. **截图或描述**
   - 如果可能，描述一下 Blob Storage 页面的布局
   - 或者告诉我你看到了哪些选项

## 临时解决方案

如果暂时找不到 token，我们可以：

1. **先使用本地存储**（临时方案）
   - 文件会存储在 `/tmp` 目录（重启后会丢失）
   - 但可以先测试功能是否正常

2. **稍后配置 Blob Storage**
   - 找到 token 后再配置
   - 配置后重新上传文件即可

## 下一步

请告诉我：
1. 在 Blob Storage 页面上你看到了什么？
2. 在项目环境变量中是否有 `BLOB_` 开头的变量？

这样我可以更准确地指导你找到 token。
