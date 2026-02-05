const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { put, head, get, del } = require('@vercel/blob');

const app = express();

// 检测运行环境
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const PORT = process.env.PORT || 3000;

// Vercel Blob Storage 配置
// 支持多种可能的 token 名称
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || 
                   process.env.BLOB_STORE_TOKEN || 
                   process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
const USE_BLOB_STORAGE = isVercel && BLOB_TOKEN;

// 调试日志
console.log('=== 环境检测 ===');
console.log('isVercel:', isVercel);
console.log('BLOB_TOKEN 存在:', !!BLOB_TOKEN);
console.log('BLOB_TOKEN 前10字符:', BLOB_TOKEN ? BLOB_TOKEN.substring(0, 10) + '...' : '未设置');
console.log('USE_BLOB_STORAGE:', USE_BLOB_STORAGE);

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// 增加文件大小限制（视频文件可能很大）
// 注意：Vercel serverless function 有 4.5MB 请求体限制，大文件需要使用 Blob Storage 直接上传
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));

// 静态文件服务
if (!isVercel) {
  // 本地环境：直接提供静态文件
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use('/public', express.static(path.join(__dirname, 'public')));
} else {
  // Vercel 环境：需要通过 API 路由提供文件（见 api/uploads.js）
  // 这里暂时不设置静态文件服务，因为 Vercel 不支持
}

// 根据环境选择存储路径
const getStoragePath = () => {
  if (isVercel) {
    // Vercel 环境：使用 /tmp 目录（临时存储，重启会丢失）
    // 注意：Vercel 的文件系统是只读的，只有 /tmp 可写
    return '/tmp';
  } else {
    // 本地环境：使用项目目录
    return __dirname;
  }
};

const STORAGE_BASE = getStoragePath();

// 确保必要的目录存在
const ensureDirectories = () => {
  const dirs = [
    path.join(STORAGE_BASE, 'uploads', 'images'),
    path.join(STORAGE_BASE, 'uploads', 'videos'),
    path.join(STORAGE_BASE, 'uploads', 'canvas'),
    path.join(STORAGE_BASE, 'uploads', 'quiz'),
    path.join(STORAGE_BASE, 'data')
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectories();

// 配置文件上传
// 如果使用 Blob Storage，使用内存存储；否则使用磁盘存储
const storage = USE_BLOB_STORAGE 
  ? multer.memoryStorage()  // 内存存储，稍后上传到 Blob
  : multer.diskStorage({
      destination: function (req, file, cb) {
        let uploadPath = '';
        // 支持 images（数组）和 image（单文件）两种字段名
        if (file.fieldname === 'images' || file.fieldname === 'image') {
          uploadPath = path.join(STORAGE_BASE, 'uploads', 'images');
        } else if (file.fieldname === 'video') {
          uploadPath = path.join(STORAGE_BASE, 'uploads', 'videos');
        } else if (file.fieldname === 'canvas') {
          uploadPath = path.join(STORAGE_BASE, 'uploads', 'canvas');
        } else if (file.fieldname === 'quiz') {
          uploadPath = path.join(STORAGE_BASE, 'uploads', 'quiz');
        }
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
      }
    });

// 配置 multer，增加文件大小限制
// 注意：Vercel 有 4.5MB 请求体限制，大文件需要使用 Blob Storage 直接上传
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    fieldSize: 10 * 1024 * 1024  // 10MB for fields
  }
});

// 上传文件到 Vercel Blob Storage 的辅助函数
async function uploadToBlob(file, fileType) {
  if (!USE_BLOB_STORAGE) {
    // 本地环境：返回本地路径
    return `/uploads/${fileType}/${file.filename}`;
  }
  
  try {
    // 生成更唯一的文件名：时间戳 + UUID + 随机数 + 原始文件名
    // 使用更长的随机字符串和更精确的时间戳确保唯一性
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    const uuid = uuidv4();
    const originalExt = path.extname(file.originalname);
    const originalBaseName = path.basename(file.originalname, originalExt);
    const uniqueName = `${originalBaseName}-${timestamp}-${uuid}-${random1}-${random2}${originalExt}`;
    const blobPath = `uploads/${fileType}/${uniqueName}`;
    
    // 上传到 Blob Storage
    // 使用 addRandomSuffix 和 allowOverwrite 确保上传成功
    // addRandomSuffix: 自动添加随机后缀，避免文件名冲突（双重保险）
    // allowOverwrite: 如果文件已存在，允许覆盖（作为备选方案）
    const blob = await put(blobPath, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      token: BLOB_TOKEN,
      addRandomSuffix: true,  // 即使文件名已唯一，也添加随机后缀
      allowOverwrite: true    // 如果仍然冲突，允许覆盖
    });
    
    // 返回 Blob URL（可以直接访问）
    return blob.url;
  } catch (error) {
    console.error('上传到 Blob Storage 失败:', error);
    // 如果 Blob Storage 失败（如 401），回退到本地存储
    if (isVercel) {
      // Vercel 环境下，如果 Blob Storage 失败，使用 /tmp 存储
      const uniqueName = `${uuidv4()}-${file.originalname}`;
      const filePath = path.join(STORAGE_BASE, 'uploads', fileType, uniqueName);
      fs.writeFileSync(filePath, file.buffer);
      return `/uploads/${fileType}/${uniqueName}`;
    } else {
      throw new Error('文件上传失败: ' + error.message);
    }
  }
}

function safeJsonParse(input) {
  if (input === undefined || input === null) return null;
  if (typeof input === 'object') return input;
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  return JSON.parse(trimmed);
}

function validateQuizJson(quiz) {
  // quiz format (suggested):
  // { questions: [ { prompt, type:'single'|'multi', options:[{text,correct}], explanation? } ] }
  if (!quiz || typeof quiz !== 'object') return { ok: false, message: 'quiz JSON 必须是对象' };
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) return { ok: false, message: 'quiz.questions 必须是非空数组' };
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    if (!q || typeof q !== 'object') return { ok: false, message: `第${i + 1}题格式不正确` };
    if (typeof q.prompt !== 'string' || !q.prompt.trim()) return { ok: false, message: `第${i + 1}题缺少 prompt` };
    const type = q.type || 'single';
    if (type !== 'single' && type !== 'multi') return { ok: false, message: `第${i + 1}题 type 只能是 single 或 multi` };
    if (!Array.isArray(q.options) || q.options.length < 2) return { ok: false, message: `第${i + 1}题 options 至少2个` };
    const correctCount = q.options.filter(o => o && o.correct === true).length;
    if (type === 'single' && correctCount !== 1) return { ok: false, message: `第${i + 1}题为单选，correct 必须且只能有1个` };
    if (type === 'multi' && correctCount < 1) return { ok: false, message: `第${i + 1}题为多选，correct 至少1个` };
    for (let j = 0; j < q.options.length; j++) {
      const o = q.options[j];
      if (!o || typeof o !== 'object') return { ok: false, message: `第${i + 1}题第${j + 1}项格式不正确` };
      if (typeof o.text !== 'string' || !o.text.trim()) return { ok: false, message: `第${i + 1}题第${j + 1}项缺少 text` };
    }
  }
  return { ok: true };
}

function normalizeQuizJson(inputQuiz) {
  // 支持两种格式：
  // A) 标准格式：{ questions: [{ prompt, type, options:[{text,correct,rationale?}], explanation?, hint?, questionNumber? }] }
  // B) 兼容格式（你提供的）：{ questions: [{ questionNumber, question, answerOptions:[{text,isCorrect,rationale}], hint }] }
  if (!inputQuiz || typeof inputQuiz !== 'object') return null;
  if (!Array.isArray(inputQuiz.questions)) return null;

  const normalized = {
    questions: inputQuiz.questions.map((q, idx) => {
      if (!q || typeof q !== 'object') return null;

      // Detect B-format
      const hasB = (q.question !== undefined) || (q.answerOptions !== undefined);
      if (hasB) {
        const optionsB = Array.isArray(q.answerOptions) ? q.answerOptions : [];
        return {
          questionNumber: q.questionNumber ?? (idx + 1),
          prompt: String(q.question ?? '').trim(),
          type: 'single', // 你的数据是单选；如需多选，可后续扩展字段
          hint: q.hint ?? '',
          options: optionsB.map(o => ({
            text: (o && o.text) ? String(o.text) : '',
            correct: !!(o && o.isCorrect),
            rationale: (o && o.rationale) ? String(o.rationale) : ''
          })),
          // explanation 可留空；我们用 option.rationale 在前端逐项展示
          explanation: q.explanation ?? ''
        };
      }

      // Assume A-format
      const optionsA = Array.isArray(q.options) ? q.options : [];
      return {
        questionNumber: q.questionNumber ?? (idx + 1),
        prompt: typeof q.prompt === 'string' ? q.prompt : String(q.prompt ?? ''),
        type: q.type || 'single',
        hint: q.hint ?? '',
        explanation: q.explanation ?? '',
        options: optionsA.map(o => ({
          text: (o && o.text) ? String(o.text) : '',
          correct: !!(o && o.correct),
          rationale: (o && o.rationale) ? String(o.rationale) : ''
        }))
      };
    }).filter(Boolean)
  };

  return normalized;
}

// 数据文件路径
const COURSES_FILE = path.join(STORAGE_BASE, 'data', 'courses.json');
const LEVELS_FILE = path.join(STORAGE_BASE, 'data', 'levels.json');

// 初始化数据文件
const initDataFiles = () => {
  if (!fs.existsSync(COURSES_FILE)) {
    fs.writeFileSync(COURSES_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(LEVELS_FILE)) {
    fs.writeFileSync(LEVELS_FILE, JSON.stringify([], null, 2));
  }
};

initDataFiles();

// 初始化数据 API（用于 Vercel 环境，从本地数据文件同步数据）
app.post('/api/init-data', async (req, res) => {
  try {
    const { courses, levels } = req.body;
    
    if (courses && Array.isArray(courses)) {
      await writeCourses(courses);
    }
    
    if (levels && Array.isArray(levels)) {
      await writeLevels(levels);
    }
    
    res.json({ 
      success: true, 
      message: '数据初始化成功',
      coursesCount: courses ? courses.length : 0,
      levelsCount: levels ? levels.length : 0
    });
  } catch (error) {
    console.error('初始化数据失败:', error);
    res.status(500).json({ success: false, message: '初始化数据失败: ' + error.message });
  }
});

// API 根路由 - 返回 API 信息
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'AI学习课程后端API',
    version: '1.0.0',
    endpoints: {
      courses: {
        'GET /api/courses': '获取所有课程',
        'GET /api/courses/:id': '获取课程详情',
        'POST /api/courses': '创建课程',
        'PUT /api/courses/:id': '更新课程',
        'DELETE /api/courses/:id': '删除课程'
      },
      levels: {
        'GET /api/levels': '获取所有关卡',
        'GET /api/levels/:id': '获取关卡详情',
        'POST /api/levels/image': '上传图片型关卡',
        'POST /api/levels/video': '上传视频型关卡',
        'POST /api/levels/canvas': '上传Canvas代码应用关卡',
        'POST /api/levels/quiz': '上传选择题关卡',
        'POST /api/levels/image/upload': '上传单个图片（用于编辑）',
        'PUT /api/levels/:id': '更新关卡',
        'DELETE /api/levels/:id': '删除关卡'
      },
      diagnostic: {
        'GET /api/diagnostic': '诊断数据存储状态'
      }
    }
  });
});

// 诊断 API - 检查数据存储状态
app.get('/api/diagnostic', async (req, res) => {
  try {
    const diagnostic = {
      environment: {
        isVercel: isVercel,
        hasBlobToken: !!BLOB_TOKEN,
        useBlobStorage: USE_BLOB_STORAGE,
        storageBase: STORAGE_BASE
      },
      data: {
        courses: {
          count: 0,
          source: 'unknown',
          error: null
        },
        levels: {
          count: 0,
          source: 'unknown',
          error: null
        }
      },
      blobStorage: {
        enabled: USE_BLOB_STORAGE,
        tokenConfigured: !!BLOB_TOKEN,
        paths: {
          courses: BLOB_COURSES_PATH,
          levels: BLOB_LEVELS_PATH
        }
      }
    };
    
    // 尝试读取课程数据
    try {
      const courses = await readCourses();
      diagnostic.data.courses.count = courses.length;
      diagnostic.data.courses.source = USE_BLOB_STORAGE ? 'blob-storage' : 'local-fs';
    } catch (error) {
      diagnostic.data.courses.error = error.message;
    }
    
    // 尝试读取关卡数据
    try {
      const levels = await readLevels();
      diagnostic.data.levels.count = levels.length;
      diagnostic.data.levels.source = USE_BLOB_STORAGE ? 'blob-storage' : 'local-fs';
    } catch (error) {
      diagnostic.data.levels.error = error.message;
    }
    
    // 如果使用 Blob Storage，尝试检查文件是否存在
    if (USE_BLOB_STORAGE && BLOB_TOKEN) {
      try {
        const coursesBlob = await head(BLOB_COURSES_PATH, { token: BLOB_TOKEN });
        diagnostic.blobStorage.coursesExists = true;
        diagnostic.blobStorage.coursesSize = coursesBlob.size;
      } catch (error) {
        diagnostic.blobStorage.coursesExists = false;
        diagnostic.blobStorage.coursesError = error.message;
      }
      
      try {
        const levelsBlob = await head(BLOB_LEVELS_PATH, { token: BLOB_TOKEN });
        diagnostic.blobStorage.levelsExists = true;
        diagnostic.blobStorage.levelsSize = levelsBlob.size;
      } catch (error) {
        diagnostic.blobStorage.levelsExists = false;
        diagnostic.blobStorage.levelsError = error.message;
      }
    }
    
    res.json({ success: true, data: diagnostic });
  } catch (error) {
    console.error('诊断失败:', error);
    res.status(500).json({ success: false, message: '诊断失败: ' + error.message });
  }
});

// 数据文件在 Blob Storage 中的路径
const BLOB_COURSES_PATH = 'data/courses.json';
const BLOB_LEVELS_PATH = 'data/levels.json';

// 读取数据（支持 Blob Storage 和本地文件系统）
const readCourses = async () => {
  try {
    if (USE_BLOB_STORAGE) {
      // 从 Blob Storage 读取
      try {
        console.log('从 Blob Storage 读取课程...');
        const blob = await get(BLOB_COURSES_PATH, { token: BLOB_TOKEN });
        const data = await blob.text();
        const courses = JSON.parse(data);
        console.log('读取课程成功，数量:', courses.length);
        return courses;
      } catch (error) {
        // 如果文件不存在，返回空数组
        if (error.statusCode === 404) {
          console.log('课程文件不存在，返回空数组');
          return [];
        }
        console.error('从 Blob Storage 读取课程失败:', error);
        return [];
      }
    } else {
      // 从本地文件系统读取
      console.log('从本地文件读取课程...');
      const data = fs.readFileSync(COURSES_FILE, 'utf8');
      const courses = JSON.parse(data);
      console.log('读取课程成功，数量:', courses.length);
      return courses;
    }
  } catch (error) {
    console.error('读取课程失败:', error);
    return [];
  }
};

const readLevels = async () => {
  try {
    if (USE_BLOB_STORAGE) {
      // 从 Blob Storage 读取
      try {
        console.log('从 Blob Storage 读取关卡...');
        const blob = await get(BLOB_LEVELS_PATH, { token: BLOB_TOKEN });
        const data = await blob.text();
        const levels = JSON.parse(data);
        console.log('读取关卡成功，数量:', levels.length);
        return levels;
      } catch (error) {
        // 如果文件不存在，返回空数组
        if (error.statusCode === 404) {
          console.log('关卡文件不存在，返回空数组');
          return [];
        }
        console.error('从 Blob Storage 读取关卡失败:', error);
        console.error('错误详情:', error.message, error.statusCode);
        return [];
      }
    } else {
      // 从本地文件系统读取
      console.log('从本地文件读取关卡...');
      const data = fs.readFileSync(LEVELS_FILE, 'utf8');
      const levels = JSON.parse(data);
      console.log('读取关卡成功，数量:', levels.length);
      return levels;
    }
  } catch (error) {
    console.error('读取关卡失败:', error);
    return [];
  }
};

// 写入数据（支持 Blob Storage 和本地文件系统）
const writeCourses = async (courses) => {
  const data = JSON.stringify(courses, null, 2);
  if (USE_BLOB_STORAGE) {
    // 写入 Blob Storage
    try {
      console.log('写入课程到 Blob Storage，数量:', courses.length);
      const blob = await put(BLOB_COURSES_PATH, data, {
        access: 'public',
        contentType: 'application/json',
        token: BLOB_TOKEN
      });
      console.log('课程写入成功，Blob URL:', blob.url);
    } catch (error) {
      console.error('写入课程到 Blob Storage 失败:', error);
      throw error;
    }
  } else {
    // 写入本地文件系统
    console.log('写入课程到本地文件，数量:', courses.length);
    fs.writeFileSync(COURSES_FILE, data);
  }
};

const writeLevels = async (levels) => {
  const data = JSON.stringify(levels, null, 2);
  if (USE_BLOB_STORAGE) {
    // 写入 Blob Storage
    try {
      console.log('写入关卡到 Blob Storage，数量:', levels.length);
      const blob = await put(BLOB_LEVELS_PATH, data, {
        access: 'public',
        contentType: 'application/json',
        token: BLOB_TOKEN
      });
      console.log('关卡写入成功，Blob URL:', blob.url);
    } catch (error) {
      console.error('写入关卡到 Blob Storage 失败:', error);
      throw error;
    }
  } else {
    // 写入本地文件系统
    console.log('写入关卡到本地文件，数量:', levels.length);
    fs.writeFileSync(LEVELS_FILE, data);
  }
};

// ========== API 路由 ==========

// 获取所有课程
app.get('/api/courses', async (req, res) => {
  const courses = await readCourses();
  res.json({ success: true, data: courses });
});

// 获取单个课程详情
app.get('/api/courses/:id', async (req, res) => {
  const courses = await readCourses();
  const course = courses.find(c => c.id === req.params.id);
  if (course) {
    res.json({ success: true, data: course });
  } else {
    res.status(404).json({ success: false, message: '课程不存在' });
  }
});

// 创建课程
app.post('/api/courses', async (req, res) => {
  try {
    const { name, description, levelIds } = req.body;
    const courses = await readCourses();
    
    const newCourse = {
      id: uuidv4(),
      name: name || '新课程',
      description: description || '',
      levelIds: levelIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    courses.push(newCourse);
    await writeCourses(courses);
    
    res.json({ success: true, data: newCourse });
  } catch (error) {
    console.error('创建课程错误:', error);
    res.status(500).json({ success: false, message: '创建失败: ' + error.message });
  }
});

// 更新课程
app.put('/api/courses/:id', async (req, res) => {
  const { name, description, levelIds } = req.body;
  const courses = await readCourses();
  const index = courses.findIndex(c => c.id === req.params.id);
  
  if (index !== -1) {
    courses[index] = {
      ...courses[index],
      name: name || courses[index].name,
      description: description !== undefined ? description : courses[index].description,
      levelIds: levelIds || courses[index].levelIds,
      updatedAt: new Date().toISOString()
    };
    await writeCourses(courses);
    res.json({ success: true, data: courses[index] });
  } else {
    res.status(404).json({ success: false, message: '课程不存在' });
  }
});

// 删除课程
app.delete('/api/courses/:id', async (req, res) => {
  const courses = await readCourses();
  const filtered = courses.filter(c => c.id !== req.params.id);
  await writeCourses(filtered);
  res.json({ success: true, message: '课程已删除' });
});

// 获取所有关卡
app.get('/api/levels', async (req, res) => {
  const levels = await readLevels();
  res.json({ success: true, data: levels });
});

// 获取单个关卡
app.get('/api/levels/:id', async (req, res) => {
  const levels = await readLevels();
  const level = levels.find(l => l.id === req.params.id);
  if (level) {
    res.json({ success: true, data: level });
  } else {
    res.status(404).json({ success: false, message: '关卡不存在' });
  }
});

// 单独上传图片（用于编辑时添加图片）
// 兼容：images(多张) / image(单张)
app.post('/api/levels/image/upload', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    const files = [
      ...((req.files && req.files.images) ? req.files.images : []),
      ...((req.files && req.files.image) ? req.files.image : []),
    ];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: '请上传图片' });
    }
    
    // 上传到 Blob Storage 或使用本地路径
    const imageUrls = await Promise.all(
      files.map(file => uploadToBlob(file, 'images'))
    );
    
    res.json({ success: true, data: imageUrls });
  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
});

// 上传图片型关卡
app.post('/api/levels/image', upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, texts } = req.body;
    const levels = await readLevels();
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '请至少上传一张图片' });
    }
    
    // 上传到 Blob Storage 或使用本地路径
    const imageUrls = await Promise.all(
      req.files.map(file => uploadToBlob(file, 'images'))
    );
    
    let textArray = [];
    
    if (texts) {
      try {
        textArray = typeof texts === 'string' ? JSON.parse(texts) : texts;
      } catch (e) {
        textArray = Array.isArray(texts) ? texts : [];
      }
    }
    
    // 确保文本数组长度与图片数量匹配
    while (textArray.length < imageUrls.length) {
      textArray.push('');
    }
    
    const newLevel = {
      id: uuidv4(),
      type: 'image',
      title: title || '图片关卡',
      description: description || '',
      images: imageUrls,
      texts: textArray,
      createdAt: new Date().toISOString()
    };
    
    levels.push(newLevel);
    console.log('[上传图片关卡] 准备写入，当前关卡数量:', levels.length);
    await writeLevels(levels);
    console.log('[上传图片关卡] 写入完成');
    
    // 验证写入
    const verify = await readLevels();
    console.log('[上传图片关卡] 验证读取，关卡数量:', verify.length);
    
    res.json({ success: true, data: newLevel });
  } catch (error) {
    console.error('上传图片关卡错误:', error);
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
});

// 上传视频型关卡
// 支持两种方式：
// 1. 上传视频文件（multipart/form-data）
// 2. 提供视频 URL（application/json 或 form-data 中的 videoUrl 字段）
app.post('/api/levels/video', upload.single('video'), async (req, res) => {
  try {
    const { title, description, videoUrl } = req.body;
    const levels = await readLevels();
    
    let finalVideoUrl = null;
    
    // 方式1：提供视频 URL（支持 B站、YouTube 等外链）
    const trimmedVideoUrl = typeof videoUrl === 'string' ? videoUrl.trim() : '';
    if (trimmedVideoUrl) {
      finalVideoUrl = trimmedVideoUrl;
    } 
    // 方式2：上传视频文件
    else if (req.file) {
      // 检查文件大小（Vercel 有 4.5MB 请求体限制）
      if (isVercel && req.file.size > 4 * 1024 * 1024) {
        return res.status(413).json({ 
          success: false, 
          message: '视频文件太大（超过 4MB）。Vercel serverless function 有 4.5MB 请求体限制。建议：1. 压缩视频文件 2. 使用外部视频托管服务（如 YouTube、Bilibili）然后填写视频 URL' 
        });
      }
      
      // 上传到 Blob Storage 或使用本地路径
      finalVideoUrl = await uploadToBlob(req.file, 'videos');
    } else {
      return res.status(400).json({ success: false, message: '请上传视频文件或填写视频 URL' });
    }
    
    const newLevel = {
      id: uuidv4(),
      type: 'video',
      title: title || '视频关卡',
      description: description || '',
      videoUrl: finalVideoUrl,
      createdAt: new Date().toISOString()
    };
    
    levels.push(newLevel);
    console.log('[上传视频关卡] 准备写入，当前关卡数量:', levels.length);
    await writeLevels(levels);
    console.log('[上传视频关卡] 写入完成');
    
    // 验证写入
    const verify = await readLevels();
    console.log('[上传视频关卡] 验证读取，关卡数量:', verify.length);
    
    res.json({ success: true, data: newLevel });
  } catch (error) {
    console.error('上传视频关卡错误:', error);
    // 如果是文件大小错误，返回更友好的提示
    if (error.code === 'LIMIT_FILE_SIZE' || error.message.includes('too large')) {
      return res.status(413).json({ 
        success: false, 
        message: '视频文件太大。建议：1. 压缩视频文件（推荐使用 H.264 编码）2. 使用外部视频托管服务（如 YouTube、Bilibili）然后填写视频 URL' 
      });
    }
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
});

// 上传Gemini Canvas代码应用关卡
app.post('/api/levels/canvas', upload.single('canvas'), async (req, res) => {
  try {
    const { title, description, code, appUrl } = req.body;
    const levels = await readLevels();
    
    // 方式0：提供已部署应用URL（例如 React/Vite build 后的页面），学生端用 iframe 打开
    const trimmedAppUrl = typeof appUrl === 'string' ? appUrl.trim() : '';
    if (trimmedAppUrl) {
      const newLevel = {
        id: uuidv4(),
        type: 'canvas',
        title: title || 'Canvas关卡',
        description: description || '',
        appUrl: trimmedAppUrl,
        createdAt: new Date().toISOString()
      };
      levels.push(newLevel);
      console.log('[上传Canvas关卡-appUrl] 准备写入，当前关卡数量:', levels.length);
      await writeLevels(levels);
      console.log('[上传Canvas关卡-appUrl] 写入完成');
      
      // 验证写入
      const verify = await readLevels();
      console.log('[上传Canvas关卡-appUrl] 验证读取，关卡数量:', verify.length);
      
      return res.json({ success: true, data: newLevel });
    }

    // 保存代码文件
    let codeUrl = null;
    if (req.file) {
      // 上传到 Blob Storage 或使用本地路径
      codeUrl = await uploadToBlob(req.file, 'canvas');
    } else if (code) {
      // 如果没有上传文件，但有代码内容，保存为文件
      if (USE_BLOB_STORAGE) {
        try {
          // 上传到 Blob Storage
          const codeFileName = `${uuidv4()}.js`;
          const blobPath = `uploads/canvas/${codeFileName}`;
          const blob = await put(blobPath, Buffer.from(code, 'utf8'), {
            access: 'public',
            contentType: 'application/javascript',
            token: BLOB_TOKEN,
            addRandomSuffix: true,
            allowOverwrite: true
          });
          codeUrl = blob.url;
        } catch (error) {
          console.error('上传代码到 Blob Storage 失败:', error);
          // 回退到本地存储
          const codeFileName = `${uuidv4()}.js`;
          const codePath = path.join(STORAGE_BASE, 'uploads', 'canvas', codeFileName);
          fs.writeFileSync(codePath, code);
          codeUrl = `/uploads/canvas/${codeFileName}`;
        }
      } else {
        // 本地存储
        const codeFileName = `${uuidv4()}.js`;
        const codePath = path.join(STORAGE_BASE, 'uploads', 'canvas', codeFileName);
        fs.writeFileSync(codePath, code);
        codeUrl = `/uploads/canvas/${codeFileName}`;
      }
    } else {
      return res.status(400).json({ success: false, message: '请提供代码内容或上传代码文件' });
    }
    
    const newLevel = {
      id: uuidv4(),
      type: 'canvas',
      title: title || 'Canvas关卡',
      description: description || '',
      codeUrl: codeUrl,
      code: code || '',
      createdAt: new Date().toISOString()
    };
    
    levels.push(newLevel);
    console.log('[上传Canvas关卡] 准备写入，当前关卡数量:', levels.length);
    await writeLevels(levels);
    console.log('[上传Canvas关卡] 写入完成');
    
    // 验证写入
    const verify = await readLevels();
    console.log('[上传Canvas关卡] 验证读取，关卡数量:', verify.length);
    
    res.json({ success: true, data: newLevel });
  } catch (error) {
    console.error('上传Canvas关卡错误:', error);
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
});

// 上传选择题关卡（JSON）
// 支持两种方式：
// 1) multipart/form-data 上传 quiz 文件字段名：quiz（.json）
// 2) application/json 直接提交 { title, description, quiz: {...} } 或 { title, description, quizJson: "..." }
app.post('/api/levels/quiz', upload.single('quiz'), async (req, res) => {
  try {
    const { title, description, quiz, quizJson } = req.body || {};
    const levels = await readLevels();

    let quizObj = null;

    if (req.file) {
      const filePath = path.join(STORAGE_BASE, 'uploads', 'quiz', req.file.filename);
      const raw = fs.readFileSync(filePath, 'utf8');
      quizObj = safeJsonParse(raw);
    } else if (quiz !== undefined) {
      quizObj = safeJsonParse(quiz);
    } else if (quizJson !== undefined) {
      quizObj = safeJsonParse(quizJson);
    } else if (req.body && typeof req.body === 'object') {
      // 兼容直接把题目对象作为 body（例如 body.questions）
      if (req.body.questions) quizObj = req.body;
    }

    if (!quizObj) {
      return res.status(400).json({ success: false, message: '请提供选择题JSON（quiz/quizJson）或上传 .json 文件（字段名 quiz）' });
    }

    // 兼容不同JSON字段格式，先规范化
    const normalizedQuiz = normalizeQuizJson(quizObj);
    if (!normalizedQuiz) {
      return res.status(400).json({ success: false, message: '选择题JSON结构不正确：必须包含 questions 数组' });
    }

    const v = validateQuizJson(normalizedQuiz);
    if (!v.ok) {
      return res.status(400).json({ success: false, message: v.message });
    }

    const newLevel = {
      id: uuidv4(),
      type: 'quiz',
      title: title || '选择题关卡',
      description: description || '',
      quiz: normalizedQuiz,
      createdAt: new Date().toISOString()
    };

    levels.push(newLevel);
    console.log('[上传选择题关卡] 准备写入，当前关卡数量:', levels.length);
    await writeLevels(levels);
    console.log('[上传选择题关卡] 写入完成');
    
    // 验证写入
    const verify = await readLevels();
    console.log('[上传选择题关卡] 验证读取，关卡数量:', verify.length);
    
    res.json({ success: true, data: newLevel });
  } catch (error) {
    console.error('上传选择题关卡错误:', error);
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
});

// 更新关卡
app.put('/api/levels/:id', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description, texts, code, images, quiz, appUrl } = req.body;
    const levels = await readLevels();
    const index = levels.findIndex(l => l.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: '关卡不存在' });
    }
    
    const level = levels[index];
    
    // 更新基本信息
    level.title = title !== undefined ? title : level.title;
    level.description = description !== undefined ? description : level.description;
    
    // 根据类型更新特定字段
    if (level.type === 'image') {
      // 如果提供了新的图片数组，更新图片列表
      if (images !== undefined && Array.isArray(images)) {
        // 找出被删除的图片文件并删除
        const oldImages = level.images || [];
        const newImages = images;
        
        oldImages.forEach(oldImg => {
          if (!newImages.includes(oldImg)) {
            // 图片被删除了，删除文件
            const filePath = path.join(STORAGE_BASE, oldImg.replace(/^\//, ''));
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
                console.log('已删除图片文件:', oldImg);
              } catch (error) {
                console.error('删除图片文件失败:', error);
              }
            }
          }
        });
        
        level.images = newImages;
      }
      
      // 更新文本说明
      if (texts !== undefined) {
        level.texts = Array.isArray(texts) ? texts : [];
        // 确保文本数量与图片数量匹配
        while (level.texts.length < level.images.length) {
          level.texts.push('');
        }
        level.texts = level.texts.slice(0, level.images.length);
      }
    } else if (level.type === 'video') {
      // 视频关卡：支持更新 videoUrl（支持 B站、YouTube 等外链）
      const { videoUrl } = req.body;
      if (videoUrl !== undefined) {
        const trimmed = typeof videoUrl === 'string' ? videoUrl.trim() : '';
        if (trimmed) {
          // 如果之前是本地文件，删除旧文件
          const oldVideoUrl = level.videoUrl;
          if (oldVideoUrl && !oldVideoUrl.startsWith('http://') && !oldVideoUrl.startsWith('https://')) {
            try {
              const filePath = path.join(STORAGE_BASE, oldVideoUrl.replace(/^\//, ''));
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('已删除旧视频文件:', oldVideoUrl);
              }
            } catch (error) {
              console.error('删除旧视频文件失败:', error);
            }
          }
          level.videoUrl = trimmed;
        } else {
          return res.status(400).json({ success: false, message: '视频 URL 不能为空' });
        }
      }
    } else if (level.type === 'canvas') {
      // Canvas关卡：code 与 appUrl 可分别更新（允许同时更新）
      if (code !== undefined) {
        level.code = code;
        // 如果代码改变，更新代码文件
        if (level.codeUrl) {
          try {
            const codePath = path.join(STORAGE_BASE, level.codeUrl.replace(/^\//, ''));
            fs.writeFileSync(codePath, code);
          } catch (error) {
            console.error('更新代码文件失败:', error);
          }
        }
      }

      if (appUrl !== undefined) {
        const trimmed = typeof appUrl === 'string' ? appUrl.trim() : '';
        if (trimmed) {
          level.appUrl = trimmed;
        } else {
          // 允许清空 appUrl（回退到 code/html/js 模式）
          delete level.appUrl;
        }
      }
    } else if (level.type === 'quiz' && quiz !== undefined) {
      let quizObj = null;
      try {
        quizObj = safeJsonParse(quiz);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'quiz 字段不是合法JSON' });
      }
      const normalizedQuiz = normalizeQuizJson(quizObj);
      if (!normalizedQuiz) return res.status(400).json({ success: false, message: '选择题JSON结构不正确：必须包含 questions 数组' });
      const v = validateQuizJson(normalizedQuiz);
      if (!v.ok) return res.status(400).json({ success: false, message: v.message });
      level.quiz = normalizedQuiz;
    }
    
    console.log('[更新关卡] 准备写入，当前关卡数量:', levels.length);
    await writeLevels(levels);
    console.log('[更新关卡] 写入完成');
    
    // 验证写入
    const verify = await readLevels();
    console.log('[更新关卡] 验证读取，关卡数量:', verify.length);
    
    res.json({ success: true, data: level });
  } catch (error) {
    console.error('更新关卡错误:', error);
    res.status(500).json({ success: false, message: '更新失败: ' + error.message });
  }
});

// 删除关卡
app.delete('/api/levels/:id', async (req, res) => {
  const levels = await readLevels();
  const level = levels.find(l => l.id === req.params.id);
  
  if (level) {
    // 删除关联的文件
    if (level.type === 'image' && level.images) {
      level.images.forEach(img => {
        const filePath = path.join(STORAGE_BASE, img.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    } else if (level.type === 'video' && level.videoUrl) {
      // 只删除本地文件，不删除外部链接
      if (!level.videoUrl.startsWith('http://') && !level.videoUrl.startsWith('https://')) {
        const filePath = path.join(STORAGE_BASE, level.videoUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } else if (level.type === 'canvas' && level.codeUrl) {
      const filePath = path.join(STORAGE_BASE, level.codeUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    const filtered = levels.filter(l => l.id !== req.params.id);
    await writeLevels(filtered);
    res.json({ success: true, message: '关卡已删除' });
  } else {
    res.status(404).json({ success: false, message: '关卡不存在' });
  }
});

// 文件服务 API（用于 Vercel 环境）
app.get('/api/uploads/*', (req, res) => {
  try {
    // 获取请求的文件路径（去掉 /api/uploads 前缀）
    const filePath = req.path.replace('/api/uploads', '');
    const fullPath = path.join(STORAGE_BASE, 'uploads', filePath);
    
    // 安全检查：确保文件在 uploads 目录内
    const normalizedPath = path.normalize(fullPath);
    const uploadsDir = path.join(STORAGE_BASE, 'uploads');
    if (!normalizedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ success: false, message: '访问被拒绝' });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    
    // 根据文件类型设置 Content-Type
    const ext = path.extname(normalizedPath).toLowerCase();
    const contentTypeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.js': 'application/javascript',
      '.json': 'application/json',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    // 发送文件
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 缓存1年
    res.sendFile(normalizedPath);
  } catch (error) {
    console.error('文件服务错误:', error);
    res.status(500).json({ success: false, message: '文件服务错误: ' + error.message });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer错误:', err);
    return res.status(400).json({ success: false, message: '文件上传错误: ' + err.message });
  }
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器错误: ' + err.message });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// 导出 app 供 Vercel 使用
module.exports = app;

// 如果不是 Vercel 环境，启动本地服务器
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`后端服务器运行在 http://localhost:${PORT}`);
    console.log(`API文档: http://localhost:${PORT}/api`);
    console.log('等待请求...');
  });
} else {
  console.log('运行在 Vercel 环境，使用 serverless 模式');
}
