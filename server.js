'use strict';

require('dotenv').config();

// Güvenlik uyarıları
if (!process.env.JWT_SECRET) {
  console.warn('[UYARI] JWT_SECRET tanimli degil! Uretim ortaminda mutlaka .env dosyasi olusturun.');
}
if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'Admin123456!') {
  console.warn('[UYARI] Varsayilan admin sifresi kullaniliyor. .env icinde ADMIN_PASSWORD degistirin.');
}

const express   = require('express');
const path      = require('path');
const helmet    = require('helmet');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const { initDatabase }  = require('./database/db');
const authRoutes        = require('./routes/auth');
const listingRoutes     = require('./routes/listings');
const adminRoutes       = require('./routes/admin');
const categoryRoutes    = require('./routes/categories');
const messageRoutes     = require('./routes/messages');
const favoritesRoutes   = require('./routes/favorites');
const notificationsRoutes = require('./routes/notifications');
const reportsRoutes     = require('./routes/reports');

const app    = express();
const PORT   = process.env.PORT || 3000;

// Railway/proxy arkasında çalışırken IP'yi doğru al
app.set('trust proxy', 1);
const isProd = process.env.NODE_ENV === 'production';

// ---------- Güvenlik başlıkları ----------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:', 'blob:'],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'https://open.er-api.com'],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
      baseUri:    ["'self'"],
    }
  },
  crossOriginEmbedderPolicy: false,
  // Üretimde HSTS: tarayıcı 1 yıl boyunca sadece HTTPS kullanır
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
}));

// Referrer politikası — dışarıya URL sızdırma
app.use((_req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// CORS — üretimde sadece kendi alan adından
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: isProd ? allowedOrigins : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body limitleri — JSON max 1 MB, multipart ayrıca multer ile kontrol edilir
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ---------- Rate limiting ----------
// Genel API: GET hariç 15 dk'da 300 istek
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET',
  message: { error: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.' },
}));

// Giriş: 15 dk'da 10 deneme (IP bazlı)
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' },
  skipSuccessfulRequests: true,
}));

// Kayıt: 1 saatte en fazla 5 yeni hesap (aynı IP'den)
app.use('/api/auth/register', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Bu IP adresinden çok fazla kayıt denemesi yapıldı. Lütfen 1 saat sonra tekrar deneyin.' },
}));

// ---------- Statik dosyalar ----------
app.use(express.static(path.join(__dirname, 'public')));
// Yüklenen görseller — cache 7 gün
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: isProd ? '7d' : 0,
  etag: true,
}));

// ---------- API rotaları ----------
// Profil güncelleme (şifre değişimi) rate limit
app.use('/api/auth/profile', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Çok fazla güncelleme denemesi. Lütfen 15 dakika sonra tekrar deneyin.' },
}));
app.use('/api/auth',       authRoutes);
app.use('/api/listings',   listingRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/messages',   messageRoutes);
app.use('/api/favorites',      favoritesRoutes);
app.use('/api/notifications',  notificationsRoutes);
app.use('/api/reports',        reportsRoutes);

// Döviz kuru proxy — tarayıcı CSP'sini devre dışı bırakmadan sunucu tarafında çek
app.get('/api/rates', async (_req, res) => {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!r.ok) throw new Error('upstream ' + r.status);
    const d = await r.json();
    if (!d.rates || !d.rates.TRY || !d.rates.EUR) throw new Error('invalid response');
    res.json({ USD: d.rates.TRY, EUR: d.rates.TRY / d.rates.EUR });
  } catch(e) {
    console.error('[rates] proxy hatası:', e.message);
    res.json({ USD: 40, EUR: 43 }); // 2026 yaklaşık fallback
  }
});

// Bilinmeyen API rotaları
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API rotası bulunamadı.' });
});

// ---------- SPA fallback ----------
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------- Global hata yakalayıcı ----------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[HATA]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ error: 'Dosya boyutu 5 MB sınırını aşıyor.' });
  if (err.type === 'entity.too.large')
    return res.status(413).json({ error: 'İstek boyutu çok büyük.' });
  // Üretimde stack trace gösterme
  res.status(500).json({ error: isProd ? 'Sunucu hatası oluştu.' : err.message });
});

// ---------- Başlat ----------
// ================================================================
// CRON: Suresi dolan ilanlari otomatik pasife al (her saat)
// ================================================================
function runExpiryCron() {
  try {
    const db = require('./database/db').getDb();
    // expires_at süresi dolmuş aktif ilanları 'expired' yap
    db.prepare(
      "UPDATE listings SET status='expired', updated_at=datetime('now') WHERE status='active' AND expires_at IS NOT NULL AND expires_at < datetime('now')"
    ).run();
  } catch(e) {
    console.error('[CRON] expiry error:', e.message);
  }
}

// Beklenmedik çökmeler sunucuyu durdurmasın
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Yakalanmamış hata:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Yakalanmamış promise reddi:', reason);
});

(async () => {
  try {
    await initDatabase();
    setInterval(runExpiryCron, 60 * 60 * 1000);
    setTimeout(runExpiryCron, 5000);
    
app.listen(PORT, () => {
      console.log(`[SERVER] Ticarethane http://localhost:${PORT} adresinde çalışıyor`);
      if (!isProd) console.log(`[SERVER] Admin: http://localhost:${PORT}/#/admin`);
    });
  } catch (err) {
    console.error('[FATAL] Başlatılamadı:', err.message);
    process.exit(1);
  }
})();

module.exports = app;
