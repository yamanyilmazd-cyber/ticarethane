'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { getDb }        = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('[FATAL] JWT_SECRET environment variable is not set.');
const JWT_EXP    = '30d';
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

function signToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXP });
}

// Basit XSS temizleyici — script etiketlerini kaldır
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim().substring(0, 500);
}

// Geçici/sahte e-posta domain kara listesi
const BLOCKED_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.biz','guerrillamail.de','guerrillamail.info',
  'tempmail.com','temp-mail.org','temp-mail.io','tmpmail.net','tmpmail.org',
  'throwam.com','throwaway.email','dispostable.com','sharklasers.com',
  'guerrillamailblock.com','grr.la','guerrillamail.biz','spam4.me',
  'yopmail.com','yopmail.fr','cool.fr.nf','jetable.fr.nf','nospam.ze.tc',
  'nomail.xl.cx','mega.zik.dj','speed.1s.fr','courriel.fr.nf',
  'moncourrier.fr.nf','monemail.fr.nf','monmail.fr.nf',
  'maildrop.cc','trashmail.com','trashmail.at','trashmail.io',
  'trashmail.me','trashmail.net','trashmail.org','wegwerfmail.de',
  'trash-mail.at','discard.email','fakeinbox.com','mailnull.com',
  'mailnew.com','mailscrap.com','mailsiphon.com','mailzilla.com',
  'spamgourmet.com','spamgourmet.net','spamgourmet.org',
  'spamgourmet.com','getairmail.com','spamoff.de',
  'filzmail.com','einrot.com','coroborner.com','temporaryemail.net',
  'throwam.com','spamcorpse.com','mailboxy.fun','dropmail.me',
  'mohmal.com','spamtrap.ro','mailforspam.com','spam.la',
  'spamthisplease.com','spamhereplease.com','tempinbox.com',
  'spamavert.com','10minutemail.com','10minutemail.net','10minutemail.org',
  '10minemail.com','10mail.org','minuteemails.com','email60.com',
  '20minutemail.com','25minutemail.com','30minutemail.com',
  'filzmail.de','mailnesia.com','mailnull.com','spamslicer.com',
  'spamspot.com','spamstack.net','spamtrail.com',
  'jetable.com','jetable.net','jetable.org','netzidiot.de',
  'urfunktion.de','pookmail.com','spamfree24.org','spamfree24.de',
  'kasmail.com','spammotel.com','ieatspam.eu','ieatspam.info',
  'inboxalias.com','fakemailgenerator.com','mailexpire.com',
  'throwam.com','spamgourmet.com','noclickemail.com',
  'emailondeck.com','33mail.com','spamgob.com',
  'dispostable.com','spambox.us','spambox.info','mailbucket.org',
]);

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
    if (!name || !email || !password || !phone)
      return res.status(400).json({ error: 'Ad, e-posta, telefon ve şifre zorunludur.' });

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

    // Geçici/sahte e-posta domain engeli
    const emailDomain = email.split('@')[1];
    if (BLOCKED_DOMAINS.has(emailDomain))
      return res.status(400).json({ error: 'Bu e-posta adresi ile kayıt olunamamaktadır. Lütfen kurumsal veya kalıcı bir e-posta adresi kullanın.' });

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
      if (user && user.google_id)
        return res.status(401).json({ error: 'Bu hesap Google ile bağlı. Lütfen "Google ile Giriş Yap" butonunu kullanın.' });
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

// ---- Google ile giriş ----
router.post('/google', async (req, res) => {
  try {
    if (!googleClient) return res.status(500).json({ error: 'Google ile giriş yapılandırılmamış.' });
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Google kimlik bilgisi eksik.' });

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch (e) {
      return res.status(401).json({ error: 'Google girişi doğrulanamadı.' });
    }
    if (!payload.email_verified) return res.status(400).json({ error: 'Google e-postanız doğrulanmamış.' });

    const email = payload.email.toLowerCase();
    const db    = getDb();
    let user = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(payload.sub, email);

    if (user) {
      if (!user.is_active)
        return res.status(403).json({ error: 'Hesabınız askıya alınmıştır. Yönetici ile iletişime geçin.' });
      if (!user.google_id)
        db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(payload.sub, user.id);
    } else {
      const randomHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      const name = sanitize(payload.name || email.split('@')[0]);
      const result = db.prepare(
        `INSERT INTO users (name, email, password_hash, google_id, is_verified) VALUES (?, ?, ?, ?, 1)`
      ).run(name, email, randomHash, payload.sub);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

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
    console.error('[AUTH] google giris hatasi:', err.message);
    res.status(500).json({ error: 'Google ile giriş sırasında hata oluştu.' });
  }
});

// ---- Mevcut kullanıcı ----
// GET /api/auth/seller/:id — herkese açık firma profili
router.get('/seller/:id', (req, res) => {
  try {
    const db = getDb();
    const u  = db.prepare(
      'SELECT id, name, company_name, city, is_verified, created_at FROM users WHERE id = ? AND is_active = 1'
    ).get(parseInt(req.params.id));
    if (!u) return res.status(404).json({ error: 'Firma bulunamadı.' });
    res.json(u);
  } catch (err) {
    res.status(500).json({ error: 'Firma yüklenemedi.' });
  }
});

router.get('/me', authenticate, (req, res) => {
  try {
  const db   = getDb();
  const user = db.prepare(
    'SELECT id, name, company_name, email, phone, city, role, created_at, google_id FROM users WHERE id = ?'
  ).get(req.userId);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  user.google_linked = !!user.google_id;
  delete user.google_id;
  res.json(user);
  } catch(err) { res.status(500).json({ error: 'Sunucu hatası.' }); }
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
      if (new_pw.length > 128)
        return res.status(400).json({ error: 'Yeni şifre en fazla 128 karakter olabilir.' });
      const user = db.prepare('SELECT password_hash, google_id FROM users WHERE id = ?').get(req.userId);
      if (!user.google_id) {
        const valid = await bcrypt.compare(current_pw || '', user.password_hash);
        if (!valid)
          return res.status(401).json({ error: 'Mevcut şifre hatalı.' });
      }
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

    const user = db.prepare('SELECT * FROM users WHERE id=? AND role!="admin"').get(uid);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    if (!user.google_id) {
      if (!password) return res.status(400).json({ error: 'Şifre zorunludur.' });
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Şifre hatalı.' });
    }

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
    if (!user) return res.json({ message: 'Şifre sıfırlama linki gönderildi.' });

    const crypto = require('crypto');
    const token  = crypto.randomBytes(32).toString('hex');
    const exp    = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 saat

    // Onceki token'lari iptal et
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id=?').run(user.id);
    db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?,?,?)').run(user.id, token, exp);

    // E-posta gonder
    const base = process.env.APP_URL || 'http://localhost:3000';
    const resetLink = base + '/#/sifre-sifirla?token=' + token;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    console.info('[MAIL] KEY mevcut:', !!RESEND_API_KEY, '| FROM:', process.env.SMTP_FROM || '(YOK)');
    if (RESEND_API_KEY) {
      // Resend HTTP API (SMTP port bloklarina takilmaz)
      try {
        const fromAddr = process.env.SMTP_FROM || 'Ticarethane <onboarding@resend.dev>';
        console.info('[MAIL] Gonderiliyor:', email, '| FROM:', fromAddr);
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: fromAddr,
            to: [email],
            subject: 'Şifre Sıfırlama - Ticarethane',
            html: [
              '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">',
              '<div style="background:#1e3a8a;padding:24px 32px;">',
              '<h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:700;">Ticarethane</h1>',
              '<p style="color:#93c5fd;font-size:13px;margin:6px 0 0;">B2B Ticaret Platformu</p>',
              '</div>',
              '<div style="padding:32px;">',
              '<h2 style="color:#111827;font-size:18px;margin:0 0 16px;">Şifre Sıfırlama Talebi</h2>',
              '<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">Merhaba <strong>' + user.name + '</strong>,</p>',
              '<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">Hesabınıza ait şifre sıfırlama talebini aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz. Bağlantı <strong>1 saat</strong> geçerlidir.</p>',
              '<div style="text-align:center;margin:0 0 28px;">',
              '<a href="' + resetLink + '" style="background:#1e3a8a;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">Şifremi Sıfırla</a>',
              '</div>',
              '<p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 6px;">Butona tıklayamıyorsanız aşağıdaki bağlantıyı tarayıcınıza kopyalayabilirsiniz:</p>',
              '<p style="color:#1e3a8a;font-size:12px;word-break:break-all;margin:0 0 24px;">' + resetLink + '</p>',
              '<hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;" />',
              '<p style="color:#9ca3af;font-size:12px;margin:0;">Bu talebi siz yapmadıysanız bu e-postayı dikkate almayınız. Hesabınız güvende kalmaya devam edecektir.</p>',
              '</div>',
              '<div style="background:#f9fafb;padding:16px 32px;text-align:center;">',
              '<p style="color:#9ca3af;font-size:11px;margin:0;">&copy; 2025 Ticarethane &middot; <a href="https://ticaret-hane.net" style="color:#6b7280;text-decoration:none;">ticaret-hane.net</a></p>',
              '</div>',
              '</div>',
            ].join(''),
          }),
        });
        const result = await resp.json();
        if (!resp.ok) console.error('[AUTH] Resend hatasi:', JSON.stringify(result));
        else console.info('[AUTH] Mail gonderildi:', result.id);
      } catch(mailErr) {
        console.error('[AUTH] mail error:', mailErr.message);
      }
    } else {
      // Yapilandirilmamis — dev modda linki don
      console.info('[AUTH] Sifre sifirlama linki (MAIL YOK):', resetLink);
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ message: 'Mail yapılandırılmamış. Aşağıdaki linki kullanın:', dev_link: resetLink });
      }
    }

    res.json({ message: 'Şifre sıfırlama linki gönderildi.' });
  } catch(err) {
    console.error('[AUTH] forgot-password:', err.message);
    res.status(500).json({ error: 'İşlem sırasında hata oluştu.' });
  }
});

// ---- Sifre sifirla ----
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token ve şifre zorunludur.' });
    if (password.length < 8) return res.status(400).json({ error: 'Şifre en az 8 karakter olmalıdır.' });
    if (password.length > 128) return res.status(400).json({ error: 'Şifre en fazla 128 karakter olabilir.' });

    const db  = getDb();
    const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token=? AND used=0').get(token);
    if (!row) return res.status(400).json({ error: 'Geçersiz veya kullanılmış sıfırlama linki.' });
    if (new Date(row.expires_at) < new Date()) {
      db.prepare('DELETE FROM password_reset_tokens WHERE id=?').run(row.id);
      return res.status(400).json({ error: 'Sıfırlama linkinin süresi dolmuş. Lütfen tekrar talep edin.' });
    }

    const hash = await bcrypt.hash(password, 12);
    db.prepare('UPDATE users SET password_hash=?, updated_at=datetime("now") WHERE id=?').run(hash, row.user_id);
    db.prepare('UPDATE password_reset_tokens SET used=1 WHERE id=?').run(row.id);
    // Diger aktif tokenlari da iptal et
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id=? AND id!=?').run(row.user_id, row.id);

    res.json({ message: 'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.' });
  } catch(err) {
    console.error('[AUTH] reset-password:', err.message);
    res.status(500).json({ error: 'Şifre sıfırlanamadı.' });
  }
});


module.exports = router;
