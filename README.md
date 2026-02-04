# AI学习课程系统

前后端分离的课程管理系统，支持创建课程、上传关卡等功能。

## 项目结构

```
├── backend/          # 后端API服务
│   ├── server.js    # Express服务器
│   ├── package.json # 依赖配置
│   ├── uploads/     # 上传文件存储
│   └── data/        # 数据文件存储
├── frontend/         # 前端页面
│   ├── index.html   # 学生端页面（只显示导航）
│   └── admin.html   # 管理端页面（上传关卡、建课）
└── README.md        # 项目说明
```

## 快速开始

### 后端启动

```bash
cd backend
npm install
npm start
```

后端服务运行在 http://localhost:3000

### 前端访问

- **学生端**：打开 `frontend/index.html`（需要启动后端服务）
- **管理端**：打开 `frontend/admin.html`（需要启动后端服务）

## 功能说明

### 后端API

#### 课程管理
- `GET /api/courses` - 获取所有课程
- `GET /api/courses/:id` - 获取课程详情
- `POST /api/courses` - 创建课程
- `PUT /api/courses/:id` - 更新课程
- `DELETE /api/courses/:id` - 删除课程

#### 关卡管理
- `GET /api/levels` - 获取所有关卡
- `GET /api/levels/:id` - 获取关卡详情
- `POST /api/levels/image` - 上传图片型关卡
- `POST /api/levels/video` - 上传视频型关卡
- `POST /api/levels/canvas` - 上传Canvas代码应用关卡
- `DELETE /api/levels/:id` - 删除关卡

### 前端功能

#### 学生端（index.html）
- 只显示顶部数字导航（1, 2, 3, 4...）
- 从后端API动态加载课程和关卡
- 支持三种关卡类型：
  - 图片关卡：左右切换图片
  - 视频关卡：播放视频
  - Canvas关卡：运行Canvas代码

#### 管理端（admin.html）
- 上传关卡：支持图片、视频、Canvas三种类型
- 创建课程：从关卡库选择关卡组成课程
- 管理课程：查看和删除课程

## 关卡类型说明

### 1. 图片型关卡
- 可上传多张图片
- 支持左右切换
- 每张图片可配置说明文字

### 2. 视频型关卡
- 上传视频文件
- 支持HTML5视频播放

### 3. Canvas代码应用关卡
- 支持直接输入代码或上传代码文件
- 代码会在Canvas元素中执行
- 可用于交互式教学

## 技术栈

- **后端**：Node.js + Express
- **前端**：原生HTML/CSS/JavaScript
- **数据存储**：JSON文件（可替换为数据库）

## 注意事项

1. 确保后端服务运行后，前端才能正常访问
2. 上传的文件存储在 `backend/uploads/` 目录
3. 课程和关卡数据存储在 `backend/data/` 目录
4. 前端API地址配置在 `frontend/index.html` 和 `frontend/admin.html` 中
