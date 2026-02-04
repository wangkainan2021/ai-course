# AI学习课程后端API

## 安装依赖

```bash
npm install
```

## 运行服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 http://localhost:3000 运行

## API接口

### 课程管理

- `GET /api/courses` - 获取所有课程
- `GET /api/courses/:id` - 获取单个课程详情
- `POST /api/courses` - 创建课程
- `PUT /api/courses/:id` - 更新课程
- `DELETE /api/courses/:id` - 删除课程

### 关卡管理

- `GET /api/levels` - 获取所有关卡
- `GET /api/levels/:id` - 获取单个关卡
- `POST /api/levels/image` - 上传图片型关卡
- `POST /api/levels/video` - 上传视频型关卡
- `POST /api/levels/canvas` - 上传Canvas代码应用关卡
- `DELETE /api/levels/:id` - 删除关卡

## 数据结构

### 课程 (Course)
```json
{
  "id": "uuid",
  "name": "课程名称",
  "description": "课程描述",
  "levelIds": ["level1", "level2"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 关卡 (Level)
```json
{
  "id": "uuid",
  "type": "image|video|canvas",
  "title": "关卡标题",
  "description": "关卡描述",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 图片型关卡
```json
{
  "images": ["/uploads/images/file1.jpg"],
  "texts": ["说明1", "说明2"]
}
```

### 视频型关卡
```json
{
  "videoUrl": "/uploads/videos/file.mp4"
}
```

### Canvas型关卡
```json
{
  "codeUrl": "/uploads/canvas/file.js",
  "code": "代码内容"
}
```
