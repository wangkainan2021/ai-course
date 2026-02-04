# 查找 Vercel Blob Storage Token - 详细步骤

## 你的 Blob Storage 已创建

- **Blob Storage ID**: `store_1WWYnP0Hst7oDsjl`
- **管理页面**: https://vercel.com/wangkainans-projects/~/stores/blob/store_1WWYnP0Hst7oDsjl/browser

## 重要：Token 的位置

Vercel Blob Storage 创建后，token **不会自动显示在页面上**，需要手动查找或生成。

## 方法 1：在项目环境变量中查找（最可能的位置）

### 步骤：

1. **访问项目设置**
   ```
   https://vercel.com/dashboard
   → 选择项目 "backend" 或 "backend-topaz-zeta-46"
   → 点击 "Settings"
   → 点击左侧菜单的 "Environment Variables"
   ```

2. **查找 Blob Storage Token**
   - 在环境变量列表中，查找以下名称：
     - `BLOB_READ_WRITE_TOKEN` ⭐（最常见）
     - `BLOB_STORE_TOKEN`
     - `VERCEL_BLOB_READ_WRITE_TOKEN`
     - 或任何包含 `BLOB` 的变量

3. **查看 Token 值**
   - 如果找到了变量，点击变量名称
   - 点击 **"Reveal"** 或 **"显示"** 按钮
   - 复制 token 值

4. **如果没有找到**
   - 说明 token 还没有自动添加
   - 需要手动生成（见方法 2）

## 方法 2：在 Blob Storage 页面生成 Token

### 步骤：

1. **访问 Blob Storage 页面**
   ```
   https://vercel.com/wangkainans-projects/~/stores/blob/store_1WWYnP0Hst7oDsjl/browser
   ```

2. **查找 Settings 或 Configuration**
   - 在页面顶部导航栏，查找 **Settings**、**Configuration** 或 **配置**
   - 或者在页面侧边栏查找

3. **查找 Token 相关选项**
   - 在 Settings 页面中，查找：
     - **API Tokens**
     - **Access Tokens**
     - **Credentials**
     - **Environment Variables**
   - 或者查找 **Generate Token**、**Create Token** 按钮

4. **生成 Token**
   - 如果找到了生成按钮，点击
   - 选择权限：**Read & Write**（读写权限）
   - 复制生成的 token

## 方法 3：通过 Vercel CLI 查看环境变量

我已经尝试下载了环境变量，你可以手动查看：

```powershell
# 设置 API Token
$env:VERCEL_TOKEN="vck_0wuYyGTJqUPOEohYa6USJzr3H00NZZF6LFYDq3UgdxKt4YM3cH2sl1uW"

# 进入 backend 目录
cd backend

# 下载环境变量
npx vercel env pull .env.local

# 查看文件内容（查找 BLOB 相关的变量）
Get-Content .env.local | Select-String -Pattern "BLOB"
```

## 方法 4：如果确实找不到

如果以上方法都找不到，可能需要：

1. **检查 Blob Storage 是否已正确创建**
   - 在 Blob Storage 页面，确认状态是 **Active** 或 **Ready**

2. **尝试重新创建 Token**
   - 在 Blob Storage 的 Settings 中
   - 查找 **Regenerate Token** 或 **Reset Token**

3. **使用 Vercel API 获取**
   - 我可以帮你通过 API 获取（需要你的确认）

## 配置 Token 的步骤

找到 token 后，配置环境变量：

### 方式 A：在 Dashboard 中配置

1. 项目页面 → **Settings** → **Environment Variables**
2. 点击 **Add New**
3. 填写：
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: 粘贴你找到的 token
   - **Environment**: 选择 `Production`、`Preview`、`Development`
4. 点击 **Save**

### 方式 B：使用 CLI 配置

找到 token 后，告诉我，我可以帮你通过 CLI 配置。

## 请告诉我

1. **在项目 Settings → Environment Variables 中，你看到了哪些变量？**
   - 是否有任何以 `BLOB` 开头的变量？

2. **在 Blob Storage 页面（你提供的链接）上，你看到了什么？**
   - 有哪些标签页？
   - 页面上有什么按钮或选项？

3. **如果找到了 token，请告诉我，我可以帮你配置**

## 临时方案

如果暂时找不到 token，我们可以：

1. **先测试上传功能**（不使用 Blob Storage）
   - 文件会临时存储在 `/tmp` 目录
   - 可以验证代码是否正常工作

2. **找到 token 后再配置**
   - 配置后，重新上传的文件会自动使用 Blob Storage
