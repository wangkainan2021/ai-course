// 在浏览器控制台运行此脚本来初始化 Vercel 后端数据
// 使用方法：
// 1. 打开浏览器，访问任意页面
// 2. 按 F12 打开开发者工具
// 3. 切换到 Console 标签
// 4. 复制并粘贴下面的代码，然后按回车

(async function() {
  console.log('开始初始化数据...');
  
  // 课程数据
  const courses = [{"id":"fc430fe6-b7f0-43fb-9bbb-691a5f71eccc","name":"滤镜","description":"","levelIds":["96e4fc17-0c20-4d6c-b6b5-652b595619b2","1528ec0f-8321-4dc0-90c9-a5ca2101effd","941d51c1-12c8-43b4-9fe0-888cdc96f688","dd2025a8-4b60-4bed-9932-0e5d7d95b42d","35aa2a65-c380-4545-b2dc-82547504ccab","8b98a787-c81c-4f4a-ad40-56b5056fa4fc","b1601b77-65d7-4536-a7fd-a3a40343d2e4","1285d2c0-009b-4b3c-9ff8-37ec116ce728","5de3e2f6-a8d7-4712-8b5c-02bb5b05f14f"],"createdAt":"2026-02-04T04:25:16.136Z","updatedAt":"2026-02-04T08:00:53.300Z"}];

  // 关卡数据（由于太大，需要通过文件读取）
  // 请先打开 初始化数据工具.html，使用文件选择器上传 levels.json
  
  console.log('⚠️ 注意：由于关卡数据太大，请使用以下方法之一：');
  console.log('方法1：打开 初始化数据工具.html，选择两个 JSON 文件后点击初始化');
  console.log('方法2：手动读取 levels.json 文件内容，然后运行：');
  console.log(`
    const levels = [/* 粘贴 levels.json 的内容 */];
    fetch('https://backend-topaz-zeta-46.vercel.app/api/init-data', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({courses, levels})
    }).then(r => r.json()).then(d => console.log(d));
  `);
  
  // 如果已经读取了 levels 数据，取消下面的注释并运行
  /*
  const levels = [/* 在这里粘贴 levels.json 的内容 */];
  
  try {
    const response = await fetch('https://backend-topaz-zeta-46.vercel.app/api/init-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courses, levels }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 数据初始化成功！');
      console.log(`课程数: ${result.coursesCount}`);
      console.log(`关卡数: ${result.levelsCount}`);
    } else {
      console.error('❌ 初始化失败:', result.message);
    }
  } catch (error) {
    console.error('❌ 错误:', error);
  }
  */
})();
