# 修复 Vercel API 404 错误

## 问题描述

访问 `https://backend-topaz-zeta-46.vercel.app/api` 时返回：
```
404: NOT_FOUND
Code: NOT_FOUND
```

## 可能的原因

1. **Vercel 路由配置问题**：`vercel.json` 中的路由规则可能没有正确匹配 `/api` 路径
2. **部署问题**：代码可能没有正确部署到 Vercel
3. **路由顺序问题**：路由规则的顺序可能影响匹配

## 已完成的修复

### 1. 更新 `backend/vercel.json`

确保路由配置包含：
- `/api` - 匹配根路径
- `/api/(.*)` - 匹配所有子路径

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api",
      "dest": "/api/index.js"
    },
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

### 2. 确认后端路由

`backend/server.js` 中已定义：
```javascript
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'AI学习课程后端API',
    version: '1.0.0',
    // ...
  });
});
```

### 3. 确认导出

`backend/api/index.js` 正确导出 Express 应用：
```javascript
const app = require('../server');
module.exports = app;
```

## 下一步操作

### 1. 推送代码到 GitHub

代码已提交到本地仓库，需要推送到 GitHub：

```bash
git push
```

### 2. 等待 Vercel 自动部署

Vercel 会自动检测 GitHub 推送并重新部署。

### 3. 验证部署

部署完成后，访问：
- `https://backend-topaz-zeta-46.vercel.app/api` - 应该返回 JSON 响应
- `https://backend-topaz-zeta-46.vercel.app/api/courses` - 应该返回课程列表

### 4. 如果仍然 404

如果修复后仍然出现 404，请检查：

1. **Vercel Dashboard**：
   - 进入项目设置
   - 查看 "Deployments" 标签
   - 确认最新部署是否成功
   - 查看部署日志是否有错误

2. **手动重新部署**：
   - 在 Vercel Dashboard 中
   - 找到最新的部署
   - 点击 "Redeploy"

3. **检查环境变量**：
   - 确认 `BLOB_READ_WRITE_TOKEN` 等环境变量已正确配置

4. **检查文件结构**：
   - 确认 `backend/api/index.js` 文件存在
   - 确认 `backend/vercel.json` 文件存在

## 测试命令

部署完成后，可以使用以下命令测试：

```bash
# 测试根路径
curl https://backend-topaz-zeta-46.vercel.app/api

# 测试课程列表
curl https://backend-topaz-zeta-46.vercel.app/api/courses

# 测试关卡列表
curl https://backend-topaz-zeta-46.vercel.app/api/levels
```

## 如果问题仍然存在

如果修复后仍然出现 404，请提供：
1. Vercel Dashboard 中的部署日志
2. 最新的部署状态（成功/失败）
3. 任何错误信息

我可以进一步帮助排查。
