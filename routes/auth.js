'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getDb }        = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ticarethane-gizli-anahtar-uretimde-degistirin';
const JWT_EXP    = '30d';

function signToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXP });
}

// Basit XSS temizleyici — script etiketlerini kaldır
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim().substring(0, 500);
}

// ---- Kayıt ----
router.post('/register', async (req, res) => {
  try {
    const name         = sanitize(req.body.name);
    const company_name = sanitize(req.body.company_name);
    const email        = sanitize(req.body.email)?.toLowerCase();
    const phone        = sanitize(req.body.phone);
    const password     = req.body.password;
    const city         = sanitize(req.body.city);

    // Zorunlu alanlar
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Ad, e-posta ve şifre zorunludur.' });

    // Uzunluk kontrolleri
    if (name.length < 2 || name.length > 100)
      return res.status(400).json({ error: 'Ad alanı 2-100 karakter arasında olmalıdır.' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Şifre en az 8 karakter olmalıdır.' });
    if (password.length > 128)
      return res.status(400).json({ error: 'Şifre en fazla 128 karakter olabilir.' });

    // E-posta formatı
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRe.test(email))
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
    if (email.length > 254)
      return res.status(400).json({ error: 'E-posta adresi çok uzun.' });

    const db = getDb();

    // Mevcut e-posta kontrolü
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email))
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });

    // Şifre hash'i
    const hash   = await bcrypt.hash(password, 12);
    const result = db.prepare(
      `INSERT INTO users (name, company_name, email, phone, password_hash, city)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      name,
      company_name || null,
      email,
      phone || null,
      hash,
      city  || null
    );

    if (!result.lastInsertRowid)
      throw new Error('Kayıt oluşturulamadı.');

    const token = signToken(result.lastInsertRowid, 'user');
    res.status(201).json({
      message: 'Kayıt başarılı. Hoş geldiniz!',
      token,
      user: {
        id:    result.lastInsertRowid,
        name,
        email,
        role: 'user',
      },
    });
  } catch (err) {
    console.error('[AUTH] kayıt hatası:', err.message);
    // Tekrar eden e-posta constraint hatası sql.js'den gelebilir
    if (err.message && err.message.includes('UNIQUE'))
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });
    res.status(500).json({ error: 'Kayıt sırasında hata oluştu. Lütfen tekrar deneyin.' });
  }
});

// ---- Giriş ----
// Hesap bazlı başarısız giriş takibi
const _loginAttempts = new Map(); // email -> { count, lockedUntil }
const MAX_ATTEMPTS   = 5;
const LOCK_MS        = 15 * 60 * 1000; // 15 dakika

function getAttempts(email) {
  const a = _loginAttempts.get(email);
  if (!a) return { count: 0, lockedUntil: 0 };
  // Kilit süresi geçtiyse sıfırla
  if (a.lockedUntil && Date.now() > a.lockedUntil) {
    _loginAttempts.delete(email);
    return { count: 0, lockedUntil: 0 };
  }
  return a;
}
function recordFailure(email) {
  const a = getAttempts(email);
  const count = a.count + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0;
  _loginAttempts.set(email, { count, lockedUntil });
  return { count, lockedUntil };
}
function clearAttempts(email) { _loginAttempts.delete(email); }

router.post('/login', async (req, res) => {
  try {
    const email    = sanitize(req.body.email)?.toLowerCase();
    const password = req.body.password;

    if (!email || !password)
      return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });

    // Hesap kilitli mi?
    const att = getAttempts(email);
    if (att.lockedUntil) {
      const kalan = Math.ceil((att.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({ error: `Çok fazla başarısız deneme. Hesap ${kalan} dakika kilitli.` });
    }

    const db   = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    // Zamanlama saldırılarına karşı her zaman hash karşılaştır
    const dummyHash = '$2a$12$invalidhashfordummycomparison0000000000000000000000000';
    const valid = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !valid) {
      const { count, lockedUntil } = recordFailure(email);
      const kalan = MAX_ATTEMPTS - count;
      if (lockedUntil) {
        console.warn('[AUTH] hesap kilitlendi:', email, 'IP:', req.ip);
        return res.status(429).json({ error: 'Çok fazla başarısız deneme. Hesap 15 dakika kilitlendi.' });
      }
      return res.status(401).json({ error: `E-posta veya şifre hatalı. (${kalan} deneme hakkı kaldı)` });
    }

    if (!user.is_active)
      return res.status(403).json({ error: 'Hesabınız askıya alınmıştır. Yönetici ile iletişime geçin.' });

    // Admin girişini logla
    if (user.role === 'admin') {
      console.info('[AUTH] admin girisi:', email, '| IP:', req.ip, '| UA:', req.get('user-agent')?.substring(0,80));
    }

    clearAttempts(email);
    const token = signToken(user.id, user.role);
    res.json({
      token,
      user: {
        id:           user.id,
        name:         user.name,
        company_name: user.company_name,
        email:        user.email,
        role:         user.role,
      },
    });
  } catch (err) {
    console.error('[AUTH] giris hatasi:', err.message);
    res.status(500).json({ error: 'Giriş sırasında hata oluştu. Lütfen tekrar deneyin.' });
  }
});

// ---- Mevcut kullanıcı ----
router.get('/me', authenticate, (req, res) => {
  try {
  const db   = getDb();
  const user = db.prepare(
    'SELECT id, name, company_name, email, phone, city, role, created_at FROM users WHERE id = ?'
  ).get(req.userId);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  res.json(user);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ---- Profil güncelleme ----
router.put('/profile', authenticate, async (req, res) => {
  try {
    const name         = sanitize(req.body.name);
    const company_name = sanitize(req.body.company_name);
    const phone        = sanitize(req.body.phone);
    const city         = sanitize(req.body.city);
    const current_pw   = req.body.current_password;
    const new_pw       = req.body.new_password;

    if (!name)
      return res.status(400).json({ error: 'Ad alanı boş bırakılamaz.' });

    const db = getDb();

    if (new_pw) {
      if (new_pw.length < 8)
        return res.status(400).json({ error: 'Yeni şifre en az 8 karakter olmalıdır.' });
      const user  = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
      const valid = await bcrypt.compare(current_pw || '', user.password_hash);
      if (!valid)
        return res.status(401).json({ error: 'Mevcut şifre hatalı.' });
      const hash = await bcrypt.hash(new_pw, 12);
      db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(hash, req.userId);
    }

    db.prepare(
      `UPDATE users SET name = ?, company_name = ?, phone = ?, city = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(name, company_name || null, phone || null, city || null, req.userId);

    res.json({ message: 'Profil güncellendi.' });
  } catch (err) {
    console.error('[AUTH] profil güncelleme hatası:', err.message);
    res.status(500).json({ error: 'Güncelleme sırasında hata oluştu.' });
  }
});


// ---- Hesap sil ----
router.delete('/account', authenticate, async (req, res) => {
  try {
    const db   = getDb();
    const uid  = req.userId;
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: 'Şifre zorunludur.' });

    const user = db.prepare('SELECT * FROM users WHERE id=? AND role!="admin"').get(uid);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Şifre hatalı.' });

    // Görselleri sil
    const fs   = require('fs');
    const path = require('path');
    const imgs = db.prepare(
      'SELECT filename FROM listing_images WHERE listing_id IN (SELECT id FROM listings WHERE user_id=?)'
    ).all(uid);
    imgs.forEach(function(img) {
      try { fs.unlinkSync(path.join(__dirname, '..', 'uploads', img.filename)); } catch(e) {}
    });

    // Veritabanından sil
    db.prepare('DELETE FROM listing_images WHERE listing_id IN (SELECT id FROM listings WHERE user_id=?)').run(uid);
    db.prepare('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user1_id=? OR user2_id=?)').run(uid, uid);
    db.prepare('DELETE FROM conversations WHERE user1_id=? OR user2_id=?').run(uid, uid);
    db.prepare('DELETE FROM listings WHERE user_id=?').run(uid);
    db.prepare('DELETE FROM users WHERE id=?').run(uid);

    res.json({ message: 'Hesabınız silindi.' });
  } catch(err) {
    console.error('[AUTH] delete account:', err.message);
    res.status(500).json({ error: 'Hesap silinirken hata oluştu.' });
  }
});

// ---- Sifremi unuttum ----
router.post('/forgot-password', async (req, res) => {
  try {
    const email = sanitize(req.body.email)?.toLowerCase();
    if (!email) return res.status(400).json({ error: 'E-posta zorunludur.' });
    const db   = getDb();
    const user = db.prepare('SELECT id, name FROM users WHERE email=?').get(email);
    // Her durumda 200 don (kullanici varligini gizle)
    if (!user) return res.json({ message: 'Sifre sifirlama linki gonderildi.' });

    const crypto = require('crypto');
    const token  = crypto.randomBytes(32).toString('hex');
    const exp    = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 saat

    // Onceki token'lari iptal et
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id=?').run(user.id);
    db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?,?,?)').run(user.id, token, exp);

    // E-posta gonder (nodemailer yapilandirmasi varsa)
    const SMTP_HOST = process.env.SMTP_HOST;
    if (SMTP_HOST) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        const base = process.env.APP_URL || 'http://localhost:3000';
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'Ticarethane <noreply@ticarethane.com>',
          to: email,
          subject: 'Sifre Sifirlama - Ticarethane',
          html: '<p>Merhaba ' + user.name + ',</p><p>Sifrenizi sifirlamak icin asagidaki linke tiklayin (1 saat gecerli):</p><p><a href="' + base + '/#/sifre-sifirla?token=' + token + '">Sifremi Sifirla</a></p><p>Bu istegi siz yapmadiysa dikkate almayiniz.</p>',
        });
      } catch(mailErr) {
        console.error('[AUTH] mail error:', mailErr.message);
      }
    } else {
      // SMTP yapilandirilmamis — linki response'a ekle (uretimde gizlenir)
      const base = process.env.APP_URL || 'http://localhost:3000';
      const resetLink = base + '/#/sifre-sifirla?token=' + token;
      console.info('[AUTH] Sifre sifirlama linki (SMTP YOK):', resetLink);
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ message: 'SMTP yapilandirilmamis. Asagidaki linki kullanin:', dev_link: resetLink });
      }
    }

    res.json({ message: 'Sifre sifirlama linki gonderildi.' });
  } catch(err) {
    console.error('[AUTH] forgot-password:', err.message);
    res.status(500).json({ error: 'Islem sirasinda hata olustu.' });
  }
});

// ---- Sifre sifirla ----
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token ve sifre zorunludur.' });
    if (password.length < 8) return res.status(400).json({ error: 'Sifre en az 8 karakter olmalidir.' });

    const db  = getDb();
    const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token=? AND used=0').get(token);
    if (!row) return res.status(400).json({ error: 'Gecersiz veya kullanilmis sifirlama linki.' });
    if (new Date(row.expires_at) < new Date()) {
      db.prepare('DELETE FROM password_reset_tokens WHERE id=?').run(row.id);
      return res.status(400).json({ error: 'Sifirlama linkinin suresi dolmus. Lutfen tekrar talep edin.' });
    }

    const hash = await bcrypt.hash(password, 12);
    db.prepare('UPDATE users SET password_hash=?, updated_at=datetime("now") WHERE id=?').run(hash, row.user_id);
    db.prepare('UPDATE password_reset_tokens SET used=1 WHERE id=?').run(row.id);
    // Diger aktif tokenlari da iptal et
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id=? AND id!=?').run(row.user_id, row.id);

    res.json({ message: 'Sifreniz basariyla guncellendi. Giris yapabilirsiniz.' });
  } catch(err) {
    console.error('[AUTH] reset-password:', err.message);
    res.status(500).json({ error: 'Sifre sifirlanamadi.' });
  }
});


module.exports = router;
