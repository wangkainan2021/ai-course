# 部署 React（Vite）互动关卡到 GitHub Pages（用于 Canvas 关卡 appUrl）

当你的“Gemini 互动/Canvas 关卡”代码包含 `import React ...`、`lucide-react` 等 npm 包时，浏览器无法直接运行源码，必须先 **打包构建**，再用课程系统通过 iframe 加载。

## 1. 准备一个 Vite + React 项目

在任意目录创建（Node 已安装）：

```bash
npm create vite@latest my-ar-app -- --template react
cd my-ar-app
npm install
```

把你的 React 代码放进 `src/App.jsx`（或 `src/App.tsx`）。

> 注意：不要保留源码里的 `export default App;` 以外的 HTML 外壳；React 项目本身会有 `index.html`。

## 2. 配置 GitHub Pages 路径（base）

你的主仓库是 `ai-course`，我们建议把互动小应用部署到子路径，例如：

- `https://wangkainan2021.github.io/ai-course/apps/my-ar-app/`

因此需要设置 Vite 的 `base`：

编辑 `vite.config.js`：

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ai-course/apps/my-ar-app/',
})
```

## 3. 构建产物

```bash
npm run build
```

会生成 `dist/`。

## 4. 把 dist 发布到你的 ai-course 仓库

在 `D:\课程设计\` 仓库下创建目录：

- `apps/my-ar-app/`

把 `dist/` 里的内容全部复制进去：

- `apps/my-ar-app/index.html`
- `apps/my-ar-app/assets/...`

然后提交并 push：

```bash
git add apps/my-ar-app
git commit -m "新增React互动关卡 my-ar-app"
git push
```

## 5. 在管理端把 Canvas 关卡填上 appUrl

在 `frontend/admin.html` 上传 Canvas 关卡时：

- **React/前端应用 URL（已部署，推荐）** 填：

`https://wangkainan2021.github.io/ai-course/apps/my-ar-app/`

保存后，学生端会用 iframe 打开该 URL。

## 6. 摄像头权限注意

AR/摄像头类应用需要：

- 在浏览器地址栏允许摄像头
- 不能被其他程序占用摄像头

如果 iframe 内还提示权限问题，优先检查浏览器对该站点的摄像头权限设置。

