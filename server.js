const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// 字体存储路径 - Zeabur持久化存储挂载点
const FONT_DIR = process.env.FONT_DIR || './fonts';

// 确保字体目录存在
if (!fs.existsSync(FONT_DIR)) {
  fs.mkdirSync(FONT_DIR, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FONT_DIR),
  filename: (req, file, cb) => {
    // 保留原始文件名，处理中文
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, originalName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 ttf, otf, woff, woff2 格式'));
    }
  }
});

// 静态文件服务 - 让字体可以被直接访问
app.use('/fonts', express.static(FONT_DIR));

// 前端页面
app.use(express.static('public'));

// API：获取字体列表
app.get('/api/fonts', (req, res) => {
  const files = fs.readdirSync(FONT_DIR);
  const fonts = files
    .filter(f => ['.ttf', '.otf', '.woff', '.woff2'].includes(path.extname(f).toLowerCase()))
    .map(f => ({
      name: f,
      url: `/fonts/${encodeURIComponent(f)}`,
      size: fs.statSync(path.join(FONT_DIR, f)).size
    }));
  res.json(fonts);
});

// API：上传字体
app.post('/api/upload', upload.single('font'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择文件' });
  }
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  res.json({
    success: true,
    name: originalName,
    url: `/fonts/${encodeURIComponent(originalName)}`
  });
});

// API：删除字体
app.delete('/api/fonts/:name', (req, res) => {
  const fileName = decodeURIComponent(req.params.name);
  const filePath = path.join(FONT_DIR, fileName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: '文件不存在' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`服务运行在端口 ${PORT}`);
});
