'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const rand = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${rand}${ext}`);
  }
});

const ALLOWED_EXT  = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return cb(new Error('Sadece JPG, PNG ve WebP dosyalari yuklenebilir.'), false);
  }
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Gecersiz dosya tipi. Sadece JPG, PNG ve WebP kabul edilir.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 8
  }
});

module.exports = { upload };
