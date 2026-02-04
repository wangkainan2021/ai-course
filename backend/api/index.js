// Vercel Serverless Function - 适配 Express 应用
// 注意：Vercel 的文件系统是只读的（除了 /tmp），文件上传会存储在 /tmp 目录
// 这意味着文件在 serverless 函数重启后会丢失
// 建议使用云存储服务（如 Vercel Blob Storage、Cloudinary）来持久化文件

const app = require('../server');

// Vercel 需要导出 handler 函数
module.exports = app;
