const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadBaseDir = path.join(__dirname, '..', 'uploads');
const dirs = ['materials', 'submissions', 'thumbnails'];
dirs.forEach(d => {
  const dirPath = path.join(uploadBaseDir, d);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'materials';
    if (req.baseUrl.includes('submission') || req.path.includes('submission')) {
      subfolder = 'submissions';
    } else if (file.fieldname === 'thumbnail') {
      subfolder = 'thumbnails';
    }
    cb(null, path.join(uploadBaseDir, subfolder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// File filter to allow common academic & learning media types
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif|pdf|doc|docx|ppt|pptx|txt|zip|tar|gz|py|java|cpp|c|js|ts|html|css|json|sql|mp4|webm/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File format .${ext} is not supported. Please upload standard document, archive, or code files.`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter
});

module.exports = { upload };
