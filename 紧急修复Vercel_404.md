# 紧急修复 Vercel 404 错误

## 问题

Vercel API 一直返回 404，说明项目配置有问题。

## 解决方案（二选一）

### 方案 1：在 Vercel Dashboard 中设置 Root Directory（推荐）

**这是最简单的方法，不需要修改代码！**

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入项目 `backend-topaz-zeta-46`
3. 点击 **Settings**（设置）
4. 在左侧菜单找到 **General**（常规）
5. 向下滚动找到 **Root Directory**（根目录）
6. **设置为 `backend`**
7. 点击 **Save**（保存）
8. 在项目页面点击 **Redeploy**（重新部署）

**等待 1-2 分钟，然后测试：**
- `https://backend-topaz-zeta-46.vercel.app/api` 应该返回 JSON

### 方案 2：使用根目录的 vercel.json（如果方案1不可行）

如果 Vercel 项目必须指向整个仓库的根目录，我已经创建了根目录的 `vercel.json`。

**需要做的：**

1. 确保根目录的 `vercel.json` 已提交到 Git
2. 推送代码到 GitHub
3. Vercel 会自动重新部署

**注意：** 如果使用方案 2，需要确保 Vercel Dashboard 中的 Root Directory 设置为空（根目录）或 `.`

## 验证步骤

修复后，访问以下 URL 应该返回 JSON（不是 404）：

1. `https://backend-topaz-zeta-46.vercel.app/api` - API 信息
2. `https://backend-topaz-zeta-46.vercel.app/api/courses` - 课程列表
3. `https://backend-topaz-zeta-46.vercel.app/api/levels` - 关卡列表

## 如果仍然 404

### 检查 Vercel 部署日志

1. 在 Vercel Dashboard 中
2. 进入项目页面
3. 点击最新的部署
4. 查看 **Build Logs** 和 **Function Logs**
5. 检查是否有错误信息

### 检查项目结构

确认以下文件存在：
- `backend/api/index.js` ✓
- `backend/server.js` ✓
- `backend/vercel.json` ✓（如果 Root Directory 是 `backend`）
- `vercel.json` ✓（如果 Root Directory 是根目录）

## 推荐操作

**强烈推荐使用方案 1**，因为：
- 不需要修改代码
- 不需要推送代码
- 立即生效
- 更符合 Vercel 的最佳实践

## 当前状态

- ✅ 已创建根目录的 `vercel.json`（备选方案）
- ⏳ 等待你在 Vercel Dashboard 中设置 Root Directory（方案 1）

## 下一步

1. **立即执行方案 1**（在 Vercel Dashboard 中设置 Root Directory 为 `backend`）
2. 等待重新部署完成
3. 测试 API 是否正常

如果方案 1 不可行，告诉我，我可以帮你使用方案 2。
