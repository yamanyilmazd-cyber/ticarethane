'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

// sharp bir native modul; bazi barindirma ortamlarinda platforma uygun
// derlenmis binary yuklenemeyebilir. require() burada patlarsa ve bu dosya
// server.js zincirinden (routes/listings.js uzerinden) yukleniyorsa, TUM
// sunucu ayaga kalkamaz — sadece HEIC donusumu bu durumda devre disi kalsin.
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('[UPLOAD] sharp yuklenemedi, HEIC donusumu devre disi kalacak:', e.message);
}

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

// iPhone kamerasi varsayilan olarak HEIC/HEIF formatinda cekiyor; bunlari da
// kabul edip asagidaki convertHeic middleware'inde JPEG'e ceviriyoruz —
// aksi halde iPhone kullanicilari ilan gorseli yukleyemiyordu.
const ALLOWED_EXT  = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return cb(new Error('Sadece JPG, PNG, WebP ve HEIC dosyalari yuklenebilir.'), false);
  }
  // iOS bazi HEIC dosyalarina genel "application/octet-stream" mimetype'i
  // atayabiliyor; uzanti dogruysa mimetype kontrolunu gevsetiyoruz.
  const isHeicExt = ext === '.heic' || ext === '.heif';
  if (!ALLOWED_MIME.has(file.mimetype) && !isHeicExt) {
    return cb(new Error('Gecersiz dosya tipi. Sadece JPG, PNG, WebP ve HEIC kabul edilir.'), false);
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

// HEIC/HEIF dosyalarini JPEG'e cevirir — tarayicilarin cogu (Chrome, Firefox,
// Android) HEIC'i <img> icinde gosteremez, bu yuzden yukleme sonrasi hemen
// donusturup orijinal dosyayi siliyoruz. req.file.filename/path guncellenir.
async function convertHeic(req, res, next) {
  if (!req.files || !req.files.length) return next();
  try {
    for (const file of req.files) {
      const ext = path.extname(file.filename).toLowerCase();
      if (ext !== '.heic' && ext !== '.heif') continue;
      const newFilename = file.filename.slice(0, -ext.length) + '.jpg';
      const newPath = path.join(UPLOAD_DIR, newFilename);
      await sharp(file.path).rotate().jpeg({ quality: 85 }).toFile(newPath);
      fs.unlinkSync(file.path);
      file.filename = newFilename;
      file.path = newPath;
      file.mimetype = 'image/jpeg';
    }
    next();
  } catch (e) {
    console.error('[UPLOAD] HEIC donusum hatasi:', e.message);
    req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
    res.status(400).json({ error: 'Görsel işlenemedi. Lütfen JPG, PNG veya WebP formatında tekrar deneyin.' });
  }
}

// Ilana konulan fotograflar icin mantikli, sabit bir boyutlandirma sinirli —
// telefon kameralari genelde 3000-4000px eninde cekim yapiyor, bu da gereksiz
// depolama/yavas yukleme demek. En uzun kenari MAX_DIMENSION'i asan gorseller
// oranti korunarak kucultuluyor (kucultme, hic buyutme yok). Sadece YENI
// yuklenen dosyalara uygulanir — diskte zaten duran eski ilan gorsellerine
// dokunulmaz, boylece mevcut ilanlar hicbir sekilde etkilenmez.
const MAX_DIMENSION = 1600;

async function resizeIfNeeded(req, res, next) {
  if (!sharp || !req.files || !req.files.length) return next();
  try {
    for (const file of req.files) {
      const meta = await sharp(file.path).metadata();
      if (!meta.width || !meta.height) continue;
      if (meta.width <= MAX_DIMENSION && meta.height <= MAX_DIMENSION) continue;
      const buffer = await sharp(file.path)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .toBuffer();
      // Ayni dosyaya dogrudan yazmak Windows'ta "sharing violation" hatasi
      // veriyor (sharp'in okuma handle'i henuz serbest kalmamis oluyor) —
      // once ayri bir gecici dosyaya yazip sonra orijinal path'in uzerine
      // atomik olarak tasiyoruz.
      const tmpPath = file.path + '.tmp';
      fs.writeFileSync(tmpPath, buffer);
      fs.renameSync(tmpPath, file.path);
    }
  } catch (e) {
    // Kucultme basarisiz olursa ilani engelleme — orijinal dosyayla devam et.
    console.error('[UPLOAD] Boyutlandirma hatasi:', e.message);
  }
  next();
}

module.exports = { upload, convertHeic, resizeIfNeeded };
