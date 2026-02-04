# 部署后端到 Vercel 完整步骤

## ⚠️ 重要提示

Vercel 使用无服务器架构，文件系统是只读的（除了 `/tmp`）。这意味着：
- 上传的文件会存储在 `/tmp` 目录
- **文件在 serverless 函数重启后会丢失**
- JSON 数据文件也会丢失

**当前实现仅适合测试，不适合生产环境。**

如果需要持久化存储，建议使用：
- Railway（支持持久化文件系统）
- Render（支持持久化文件系统）
- 或集成云存储服务（Vercel Blob Storage、Cloudinary）

---

## 部署步骤

### 1. 安装 Vercel CLI

打开 PowerShell 或命令提示符，运行：

```bash
npm install -g vercel
```

如果没有安装 Node.js，先安装：`winget install OpenJS.NodeJS`

### 2. 登录 Vercel

```bash
vercel login
```

会打开浏览器，使用 GitHub 账号登录。

### 3. 进入后端目录并部署

```bash
cd backend
vercel
```

### 4. 按照提示操作

第一次部署会询问：

```
? Set up and deploy "D:\课程设计\backend"? [Y/n] y
? Which scope do you want to deploy to? [选择你的账号]
? Link to existing project? [N/y] n
? What's your project's name? ai-course-backend
? In which directory is your code located? ./
```

直接按回车使用默认值即可。

### 5. 等待部署完成

Vercel 会自动：
- 安装依赖（`npm install`）
- 构建项目
- 部署到生产环境

部署完成后会显示：

```
✅ Production: https://ai-course-backend-xxx.vercel.app [copied to clipboard]
```

### 6. 获取生产地址

部署完成后，Vercel 会给你一个地址，例如：
```
https://ai-course-backend.vercel.app
```

**这就是你的线上后端地址！**

### 7. 更新前端代码

打开 `frontend/index.html` 和 `frontend/admin.html`，找到：

```javascript
const PRODUCTION_API_URL = 'https://your-backend-url.vercel.app/api';
```

替换为你的实际地址：

```javascript
const PRODUCTION_API_URL = 'https://ai-course-backend.vercel.app/api';
```

### 8. 提交并推送代码

```bash
git add .
git commit -m "配置线上后端地址"
git push
```

### 9. 测试线上页面

访问：`https://wangkainan2021.github.io/ai-course/frontend/index.html`

现在应该可以正常加载数据了！

---

## 后续更新

如果修改了后端代码，只需要：

```bash
cd backend
vercel --prod
```

或者直接推送到 GitHub，Vercel 会自动重新部署（如果已连接 GitHub）。

---

## 查看部署状态

访问 Vercel 控制台：https://vercel.com/dashboard

可以查看：
- 部署历史
- 日志
- 环境变量
- 域名设置

---

## 常见问题

### Q: 部署失败怎么办？

A: 检查：
1. `package.json` 中是否有所有依赖
2. `vercel.json` 配置是否正确
3. 查看 Vercel 控制台的错误日志

### Q: 文件上传后丢失？

A: 这是 Vercel 的限制。文件存储在 `/tmp`，重启后会丢失。建议使用云存储服务。

### Q: 如何查看日志？

A: 在 Vercel 控制台的项目页面，点击 "Functions" 标签，可以看到函数执行日志。

### Q: 如何设置环境变量？

A: 在 Vercel 控制台的项目设置中，可以添加环境变量。

---

## 下一步

部署完成后，记得：
1. ✅ 更新前端代码中的 `PRODUCTION_API_URL`
2. ✅ 测试线上页面是否正常
3. ⚠️ 考虑使用云存储服务来持久化文件（如果需要）
