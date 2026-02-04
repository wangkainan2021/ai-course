# 初始化 Vercel 后端数据

## 问题说明

Vercel 使用无服务器架构，文件系统是只读的（除了 `/tmp`）。这意味着：
- 数据文件存储在 `/tmp` 目录
- **数据在 serverless 函数重启后会丢失**
- 需要手动初始化数据

## 解决方案

### 方法1：使用浏览器控制台（推荐）

1. 打开浏览器，访问任意页面（比如你的前端页面）
2. 按 `F12` 打开开发者工具
3. 切换到 `Console`（控制台）标签
4. 复制并运行以下代码：

```javascript
// 1. 先读取本地数据文件（需要手动复制内容）
// 打开 backend/data/courses.json，复制全部内容
const courses = [/* 粘贴 courses.json 的内容 */];

// 打开 backend/data/levels.json，复制全部内容  
const levels = [/* 粘贴 levels.json 的内容 */];

// 2. 发送到 Vercel
fetch('https://backend-topaz-zeta-46.vercel.app/api/init-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ courses, levels }),
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('✅ 数据初始化成功！');
    console.log(`课程数: ${data.coursesCount}`);
    console.log(`关卡数: ${data.levelsCount}`);
  } else {
    console.error('❌ 失败:', data.message);
  }
})
.catch(error => console.error('❌ 错误:', error));
```

### 方法2：使用 curl 命令（如果有 curl）

```bash
curl -X POST https://backend-topaz-zeta-46.vercel.app/api/init-data \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "courses": [...],  // 替换为 courses.json 的内容
  "levels": [...]    // 替换为 levels.json 的内容
}
EOF
```

### 方法3：使用 Postman 或类似工具

1. 打开 Postman
2. 创建新请求：
   - URL: `https://backend-topaz-zeta-46.vercel.app/api/init-data`
   - Method: `POST`
   - Headers: `Content-Type: application/json`
   - Body: 选择 `raw` 和 `JSON`，然后粘贴：
     ```json
     {
       "courses": [...],  // 从 backend/data/courses.json 复制
       "levels": [...]    // 从 backend/data/levels.json 复制
     }
     ```
3. 点击 Send

## 重要提示

⚠️ **数据不会持久化**：
- 数据存储在 `/tmp` 目录
- Vercel serverless 函数重启后，数据会丢失
- 每次重启后需要重新初始化

## 长期解决方案

如果需要持久化存储，建议：
1. **使用数据库**（MongoDB Atlas、Supabase 等）
2. **使用云存储**（Vercel Blob Storage、Cloudinary 等）
3. **使用其他平台**（Railway、Render 等支持持久化文件系统）
