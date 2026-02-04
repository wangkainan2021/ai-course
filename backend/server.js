const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// 确保必要的目录存在
const ensureDirectories = () => {
  const dirs = [
    path.join(__dirname, 'uploads', 'images'),
    path.join(__dirname, 'uploads', 'videos'),
    path.join(__dirname, 'uploads', 'canvas'),
    path.join(__dirname, 'data')
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
    if (file.fieldname === 'images') {
      uploadPath = path.join(__dirname, 'uploads', 'images');
    } else if (file.fieldname === 'video') {
      uploadPath = path.join(__dirname, 'uploads', 'videos');
    } else if (file.fieldname === 'canvas') {
      uploadPath = path.join(__dirname, 'uploads', 'canvas');
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// 数据文件路径
const COURSES_FILE = path.join(__dirname, 'data', 'courses.json');
const LEVELS_FILE = path.join(__dirname, 'data', 'levels.json');

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
    const { title, description, code } = req.body;
    const levels = readLevels();
    
    // 保存代码文件
    let codeUrl = null;
    if (req.file) {
      codeUrl = `/uploads/canvas/${req.file.filename}`;
    } else if (code) {
      // 如果没有上传文件，但有代码内容，保存为文件
      const codeFileName = `${uuidv4()}.js`;
      const codePath = path.join(__dirname, 'uploads', 'canvas', codeFileName);
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

// 更新关卡
app.put('/api/levels/:id', (req, res) => {
  try {
    const { title, description, texts, code } = req.body;
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
    if (level.type === 'image' && texts !== undefined) {
      level.texts = Array.isArray(texts) ? texts : [];
    } else if (level.type === 'canvas' && code !== undefined) {
      level.code = code;
      // 如果代码改变，更新代码文件
      if (level.codeUrl) {
        try {
          const codePath = path.join(__dirname, level.codeUrl);
          fs.writeFileSync(codePath, code);
        } catch (error) {
          console.error('更新代码文件失败:', error);
        }
      }
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
        const filePath = path.join(__dirname, img);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    } else if (level.type === 'video' && level.videoUrl) {
      const filePath = path.join(__dirname, level.videoUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else if (level.type === 'canvas' && level.codeUrl) {
      const filePath = path.join(__dirname, level.codeUrl);
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

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
  console.log(`API文档: http://localhost:${PORT}/api`);
  console.log('等待请求...');
});
