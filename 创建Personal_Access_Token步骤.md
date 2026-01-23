# 创建GitHub Personal Access Token步骤

## 步骤1：登录GitHub
访问 https://github.com 并使用你的账号登录
- 用户名：wangkainan2021
- 密码：WKN@beijing2021

## 步骤2：进入设置页面
1. 点击右上角的**头像**
2. 在下拉菜单中选择 **"Settings"**（设置）

## 步骤3：进入开发者设置
1. 在左侧菜单栏向下滚动
2. 找到并点击 **"Developer settings"**（开发者设置）

## 步骤4：创建Token
1. 在左侧菜单中点击 **"Personal access tokens"**（个人访问令牌）
2. 然后点击 **"Tokens (classic)"**（经典令牌）
3. 点击 **"Generate new token"**（生成新令牌）
4. 选择 **"Generate new token (classic)"**（生成经典令牌）

## 步骤5：配置Token权限
- **Note（备注）**：填写 `AI课程项目` 或任何你喜欢的名称
- **Expiration（过期时间）**：选择 `90 days`（90天）或 `No expiration`（永不过期）
- **Select scopes（选择权限）**：勾选以下权限：
  - ✅ **repo**（完整仓库权限）- 这是最重要的，用于推送代码
  - ✅ **workflow**（工作流权限）- 如果需要使用GitHub Actions

## 步骤6：生成Token
1. 滚动到页面底部
2. 点击绿色的 **"Generate token"**（生成令牌）按钮

## 步骤7：复制Token
⚠️ **重要**：Token只会显示一次，请立即复制保存！
- 复制生成的token（类似：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
- 保存到安全的地方

## 步骤8：使用Token
将复制的token告诉我，我会用它来：
1. 自动创建GitHub仓库
2. 推送代码到GitHub

---

**安全提示**：
- Token相当于密码，请妥善保管
- 不要将Token分享给他人
- 如果Token泄露，可以随时在GitHub设置中撤销
