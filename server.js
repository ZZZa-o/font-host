const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const FONT_DIR = process.env.FONT_DIR || './fonts';

if (!fs.existsSync(FONT_DIR)) {
  fs.mkdirSync(FONT_DIR, { recursive: true });
}

const FORMAT_MAP = {
  '.ttf': 'truetype',
  '.otf': 'opentype',
  '.woff': 'woff',
  '.woff2': 'woff2',
};

const SUPPORTED_EXTS = Object.keys(FORMAT_MAP);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FONT_DIR),
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, originalName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (SUPPORTED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 ttf, otf, woff, woff2 格式'));
    }
  },
});

function getFontFiles() {
  return fs.readdirSync(FONT_DIR).filter((f) =>
    SUPPORTED_EXTS.includes(path.extname(f).toLowerCase())
  );
}

function generateFontFaceCSS(fileName, baseUrl) {
  const ext = path.extname(fileName).toLowerCase();
  const fontFamily = path.basename(fileName, ext);
  const format = FORMAT_MAP[ext] || 'truetype';
  const encodedName = encodeURIComponent(fileName);
  const fontUrl = baseUrl ? `${baseUrl}/fonts/${encodedName}` : `/fonts/${encodedName}`;

  return `@font-face {
  font-family: '${fontFamily}';
  src: url('${fontUrl}') format('${format}');
  font-display: swap;
}`;
}

app.use('/fonts', express.static(FONT_DIR, {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
}));

app.use(express.static('public'));

app.get('/css', (req, res) => {
  const baseUrl = req.query.base || '';
  const files = getFontFiles();
  const css = files.map((f) => generateFontFaceCSS(f, baseUrl)).join('\n\n');
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(css || '/* 暂无字体 */');
});

app.get('/css/:name', (req, res) => {
  const fileName = decodeURIComponent(req.params.name);
  const filePath = path.join(FONT_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    return res.status(404).send('/* font not found */');
  }

  const baseUrl = req.query.base || '';
  const css = generateFontFaceCSS(fileName, baseUrl);
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(css);
});

app.get('/api/fonts', (req, res) => {
  const files = getFontFiles();
  const fonts = files.map((f) => {
    const ext = path.extname(f).toLowerCase();
    const stat = fs.statSync(path.join(FONT_DIR, f));
    return {
      name: f,
      family: path.basename(f, ext),
      ext: ext.replace('.', '').toUpperCase(),
      url: `/fonts/${encodeURIComponent(f)}`,
      cssUrl: `/css/${encodeURIComponent(f)}`,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
    };
  });
  res.json(fonts);
});

app.post('/api/upload', upload.single('font'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择文件' });
  }
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const ext = path.extname(originalName).toLowerCase();
  res.json({
    success: true,
    name: originalName,
    family: path.basename(originalName, ext),
    url: `/fonts/${encodeURIComponent(originalName)}`,
    cssUrl: `/css/${encodeURIComponent(originalName)}`,
    size: req.file.size,
  });
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✦ Font Host 运行在端口 ${PORT}`);
});
