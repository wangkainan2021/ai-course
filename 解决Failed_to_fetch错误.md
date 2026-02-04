# 解决 "Failed to fetch" 错误

## 问题原因
"Failed to fetch" 错误通常表示前端无法连接到后端服务。

## 解决步骤

### 方法一：手动启动后端服务（推荐）

1. **打开命令提示符或PowerShell**
   - 按 `Win + R`
   - 输入 `cmd` 或 `powershell`
   - 按回车

2. **导航到后端目录**
   ```bash
   cd D:\课程设计\backend
   ```

3. **启动服务器**
   ```bash
   node server.js
   ```

4. **看到以下信息说明启动成功**：
   ```
   后端服务器运行在 http://localhost:3000
   API文档: http://localhost:3000/api
   等待请求...
   ```

5. **保持这个窗口打开**，不要关闭

6. **现在可以测试前端**：
   - 打开 `frontend/admin.html`
   - 尝试上传关卡或创建课程

### 方法二：使用启动脚本

1. **双击运行** `启动后端.bat` 文件
2. 看到服务器启动信息后，保持窗口打开
3. 测试前端功能

### 方法三：检查端口占用

如果3000端口被占用，可以修改端口：

1. **修改后端端口**（`backend/server.js`）：
   ```javascript
   const PORT = 3001; // 改为其他端口
   ```

2. **修改前端API地址**（`frontend/admin.html` 和 `frontend/index.html`）：
   ```javascript
   const API_BASE_URL = 'http://localhost:3001/api';
   ```

## 验证后端是否运行

### 方法1：浏览器测试
打开浏览器，访问：
- http://localhost:3000/api/courses
- http://localhost:3000/api/levels

如果看到JSON数据（即使是空数组 `[]`），说明后端正常运行。

### 方法2：命令行测试
```bash
curl http://localhost:3000/api/courses
```

## 常见问题

### Q: 启动时提示 "端口已被占用"
**A**: 修改 `backend/server.js` 中的 `PORT` 为其他端口（如3001），并更新前端的API地址。

### Q: 启动时提示 "找不到模块"
**A**: 在 `backend` 目录运行：
```bash
npm install
```

### Q: 启动后立即退出
**A**: 检查 `backend/server.js` 是否有语法错误，查看错误信息。

## 测试步骤

1. ✅ 启动后端服务（看到启动信息）
2. ✅ 浏览器访问 http://localhost:3000/api/courses 测试
3. ✅ 打开前端管理页面
4. ✅ 打开浏览器控制台（F12）
5. ✅ 尝试上传关卡，查看控制台日志

## 如果仍然失败

请提供以下信息：
1. 后端启动时的完整输出信息
2. 浏览器控制台（F12）的完整错误信息
3. 访问 http://localhost:3000/api/courses 时看到的内容
