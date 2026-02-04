// 同步本地数据到 Vercel 后端
// 使用方法: node sync-data-to-vercel.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const COURSES_FILE = path.join(__dirname, 'data', 'courses.json');
const LEVELS_FILE = path.join(__dirname, 'data', 'levels.json');

// Vercel 后端地址
const VERCEL_API_URL = 'https://backend-topaz-zeta-46.vercel.app/api';

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('解析响应失败: ' + e.message));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function syncData() {
  try {
    // 读取本地数据
    const courses = JSON.parse(fs.readFileSync(COURSES_FILE, 'utf8'));
    const levels = JSON.parse(fs.readFileSync(LEVELS_FILE, 'utf8'));

    console.log(`准备同步数据:`);
    console.log(`- 课程数: ${courses.length}`);
    console.log(`- 关卡数: ${levels.length}`);

    // 发送到 Vercel
    const result = await makeRequest(`${VERCEL_API_URL}/init-data`, { courses, levels });

    if (result.success) {
      console.log('✅ 数据同步成功！');
      console.log(`- 已同步课程: ${result.coursesCount}`);
      console.log(`- 已同步关卡: ${result.levelsCount}`);
    } else {
      console.error('❌ 数据同步失败:', result.message);
    }
  } catch (error) {
    console.error('❌ 同步过程出错:', error.message);
    console.error('详细错误:', error);
    if (error.code) {
      console.error('错误代码:', error.code);
    }
  }
}

syncData();
