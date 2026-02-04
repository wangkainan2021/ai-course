# 更新 Blob Storage Token

## 你的 Token

```
vercel_blob_rw_HDli5TdWm5ZId6Fb_LXsIycDc2o1D2UU6v2KWubFO5AiNS2
```

## 当前状态

环境变量 `BLOB_READ_WRITE_TOKEN` 已经存在，但值可能不正确。

## 更新方法（推荐：在 Dashboard 中）

### 步骤：

1. **访问项目设置**
   ```
   https://vercel.com/dashboard
   → 点击项目 "backend"
   → Settings → Environment Variables
   ```

2. **更新环境变量**
   - 找到 `BLOB_READ_WRITE_TOKEN` 变量
   - 点击变量名称或右侧的 **Edit** 按钮
   - 将 **Value** 更新为：`vercel_blob_rw_HDli5TdWm5ZId6Fb_LXsIycDc2o1D2UU6v2KWubFO5AiNS2`
   - 确保 **Environment** 选择了 `Production`、`Preview`、`Development`
   - 点击 **Save**

3. **重新部署**
   - 在 **Deployments** 页面
   - 找到最新的部署
   - 点击 **...** → **Redeploy**

## 或者使用 CLI（需要手动确认）

如果你想使用 CLI，需要手动确认：

```powershell
# 1. 删除旧的环境变量（需要输入 y 确认）
$env:VERCEL_TOKEN="vck_0wuYyGTJqUPOEohYa6USJzr3H00NZZF6LFYDq3UgdxKt4YM3cH2sl1uW"
npx vercel env rm BLOB_READ_WRITE_TOKEN production
# 当提示时，输入：y

# 2. 添加新的环境变量
npx vercel env add BLOB_READ_WRITE_TOKEN production
# 当提示 "Enter the value" 时，粘贴：vercel_blob_rw_HDli5TdWm5ZId6Fb_LXsIycDc2o1D2UU6v2KWubFO5AiNS2
# 当提示 "Mark as sensitive?" 时，输入：y

# 3. 重新部署
npx vercel --prod
```

## 验证配置

部署完成后，测试上传：

1. 访问：`https://wangkainan2021.github.io/ai-course/frontend/admin.html`
2. 上传一张图片
3. 检查返回的 URL：
   - ✅ 成功：`https://xxx.public.blob.vercel-storage.com/uploads/...`
   - ❌ 失败：仍然是 `/uploads/...` 格式

## 建议

**推荐在 Dashboard 中更新**，因为：
- 更直观，可以看到当前值
- 不需要手动输入确认
- 可以同时更新多个环境

更新完成后告诉我，我可以帮你验证配置是否正确。
