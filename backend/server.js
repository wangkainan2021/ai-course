const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();

// 检测运行环境
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
const storage = multer.diskStorage({
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

const upload = multer({ storage: storage });

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

// 读取数据
const readCourses = () => {
  try {
    const data = fs.readFileSync(COURSES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const readLevels = () => {
  try {
    const data = fs.readFileSync(LEVELS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// 写入数据
const writeCourses = (courses) => {
  fs.writeFileSync(COURSES_FILE, JSON.stringify(courses, null, 2));
};

const writeLevels = (levels) => {
  fs.writeFileSync(LEVELS_FILE, JSON.stringify(levels, null, 2));
};

// ========== API 路由 ==========

// 获取所有课程
app.get('/api/courses', (req, res) => {
  const courses = readCourses();
  res.json({ success: true, data: courses });
});

// 获取单个课程详情
app.get('/api/courses/:id', (req, res) => {
  const courses = readCourses();
  const course = courses.find(c => c.id === req.params.id);
  if (course) {
    res.json({ success: true, data: course });
  } else {
    res.status(404).json({ success: false, message: '课程不存在' });
  }
});

// 创建课程
app.post('/api/courses', (req, res) => {
  try {
    const { name, description, levelIds } = req.body;
    const courses = readCourses();
    
    const newCourse = {
      id: uuidv4(),
      name: name || '新课程',
      description: description || '',
      levelIds: levelIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    courses.push(newCourse);
    writeCourses(courses);
    
    res.json({ success: true, data: newCourse });
  } catch (error) {
    console.error('创建课程错误:', error);
    res.status(500).json({ success: false, message: '创建失败: ' + error.message });
  }
});

// 更新课程
app.put('/api/courses/:id', (req, res) => {
  const { name, description, levelIds } = req.body;
  const courses = readCourses();
  const index = courses.findIndex(c => c.id === req.params.id);
  
  if (index !== -1) {
    courses[index] = {
      ...courses[index],
      name: name || courses[index].name,
      description: description !== undefined ? description : courses[index].description,
      levelIds: levelIds || courses[index].levelIds,
      updatedAt: new Date().toISOString()
    };
    writeCourses(courses);
    res.json({ success: true, data: courses[index] });
  } else {
    res.status(404).json({ success: false, message: '课程不存在' });
  }
});

// 删除课程
app.delete('/api/courses/:id', (req, res) => {
  const courses = readCourses();
  const filtered = courses.filter(c => c.id !== req.params.id);
  writeCourses(filtered);
  res.json({ success: true, message: '课程已删除' });
});

// 获取所有关卡
app.get('/api/levels', (req, res) => {
  const levels = readLevels();
  res.json({ success: true, data: levels });
});

// 获取单个关卡
app.get('/api/levels/:id', (req, res) => {
  const levels = readLevels();
  const level = levels.find(l => l.id === req.params.id);
  if (level) {
    res.json({ success: true, data: level });
  } else {
    res.status(404).json({ success: false, message: '关卡不存在' });
  }
});

// 单独上传图片（用于编辑时添加图片）
// 兼容：images(多张) / image(单张)
app.post('/api/levels/image/upload', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'image', maxCount: 1 }]), (req, res) => {
  try {
    const files = [
      ...((req.files && req.files.images) ? req.files.images : []),
      ...((req.files && req.files.image) ? req.files.image : []),
    ];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: '请上传图片' });
    }
    
    const imageUrls = files.map(file => `/uploads/images/${file.filename}`);
    res.json({ success: true, data: imageUrls });
  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
});

// 上传图片型关卡
app.post('/api/levels/image', upload.array('images', 10), (req, res) => {
  try {
    const { title, description, texts } = req.body;
    const levels = readLevels();
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '请至少上传一张图片' });
    }
    
    const imageUrls = req.files.map(file => `/uploads/images/${file.filename}`);
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
    writeLevels(levels);
    
    res.json({ success: true, data: newLevel });
  } catch (error) {
    console.error('上传图片关卡错误:', error);
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
});

// 上传视频型关卡
app.post('/api/levels/video', upload.single('video'), (req, res) => {
  try {
    const { title, description } = req.body;
    const levels = readLevels();
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传视频文件' });
    }
    
    const videoUrl = `/uploads/videos/${req.file.filename}`;
    
    const newLevel = {
      id: uuidv4(),
      type: 'video',
      title: title || '视频关卡',
      description: description || '',
      videoUrl: videoUrl,
      createdAt: new Date().toISOString()
    };
    
    levels.push(newLevel);
    writeLevels(levels);
    
    res.json({ success: true, data: newLevel });
  } catch (error) {
    console.error('上传视频关卡错误:', error);
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
});

// 上传Gemini Canvas代码应用关卡
app.post('/api/levels/canvas', upload.single('canvas'), (req, res) => {
  try {
    const { title, description, code, appUrl } = req.body;
    const levels = readLevels();
    
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
      writeLevels(levels);
      return res.json({ success: true, data: newLevel });
    }

    // 保存代码文件
    let codeUrl = null;
    if (req.file) {
      codeUrl = `/uploads/canvas/${req.file.filename}`;
    } else if (code) {
      // 如果没有上传文件，但有代码内容，保存为文件
      const codeFileName = `${uuidv4()}.js`;
      const codePath = path.join(STORAGE_BASE, 'uploads', 'canvas', codeFileName);
      fs.writeFileSync(codePath, code);
      codeUrl = `/uploads/canvas/${codeFileName}`;
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
    writeLevels(levels);
    
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
app.post('/api/levels/quiz', upload.single('quiz'), (req, res) => {
  try {
    const { title, description, quiz, quizJson } = req.body || {};
    const levels = readLevels();

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
    writeLevels(levels);
    res.json({ success: true, data: newLevel });
  } catch (error) {
    console.error('上传选择题关卡错误:', error);
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
});

// 更新关卡
app.put('/api/levels/:id', (req, res) => {
  try {
    const { title, description, texts, code, images, quiz, appUrl } = req.body;
    const levels = readLevels();
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
    
    writeLevels(levels);
    res.json({ success: true, data: level });
  } catch (error) {
    console.error('更新关卡错误:', error);
    res.status(500).json({ success: false, message: '更新失败: ' + error.message });
  }
});

// 删除关卡
app.delete('/api/levels/:id', (req, res) => {
  const levels = readLevels();
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
      const filePath = path.join(STORAGE_BASE, level.videoUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else if (level.type === 'canvas' && level.codeUrl) {
      const filePath = path.join(STORAGE_BASE, level.codeUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    const filtered = levels.filter(l => l.id !== req.params.id);
    writeLevels(filtered);
    res.json({ success: true, message: '关卡已删除' });
  } else {
    res.status(404).json({ success: false, message: '关卡不存在' });
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
