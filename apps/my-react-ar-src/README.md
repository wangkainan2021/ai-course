# my-react-ar-src（React 源码目录）

把你的 React（Vite）源码项目放在这个目录下（包含 `package.json`）。

GitHub Actions 会在你每次 push `main` 时自动：

1. `npm ci`
2. `npm run build`
3. 把 `dist/` 复制到 `apps/my-react-ar/`
4. 提交并 push 构建产物

最终线上 URL 固定为：

`https://wangkainan2021.github.io/ai-course/apps/my-react-ar/`

## 必须配置 Vite base

请在 `apps/my-react-ar-src/vite.config.js` 设置：

```js
export default defineConfig({
  base: '/ai-course/apps/my-react-ar/',
})
```

