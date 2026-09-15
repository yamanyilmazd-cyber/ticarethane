'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ticarethane-gizli-anahtar-uretimde-degistirin';

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.userId   = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
  }
  next();
}

// Kisitli adminler (can_manage_users=0) icin kullanici silme/askiya alma
// gibi hassas islemleri engeller. JWT'ye guvenmek yerine veritabanindan
// taze okuyoruz — izin sonradan degistirilirse eski token hemen yansisin.
function requireFullAdmin(req, res, next) {
  const { getDb } = require('../database/db');
  const db = getDb();
  const row = db.prepare('SELECT can_manage_users FROM users WHERE id = ?').get(req.userId);
  if (!row || row.can_manage_users === 0) {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
  }
  next();
}

// Ilk ilanini vermeden once e-postasini dogrulamamis kullanicilari engeller.
// Mevcut kullanicilar (bu ozellik eklenmeden once kayitli olanlar) migrasyon
// sirasinda email_verified=1 ile isaretlendigi icin etkilenmez — yalnizca
// bundan sonra kayit olan ve henuz kod ile dogrulamamis kullanicilar icin
// devreye girer.
function requireEmailVerified(req, res, next) {
  const { getDb } = require('../database/db');
  const db = getDb();
  const row = db.prepare('SELECT email_verified FROM users WHERE id = ?').get(req.userId);
  if (row && row.email_verified === 0) {
    return res.status(403).json({ error: 'İlan verebilmek için önce e-posta adresinizi doğrulamanız gerekiyor.', code: 'EMAIL_VERIFICATION_REQUIRED' });
  }
  next();
}

// Opsiyonel auth: token varsa ayrisstirir, yoksa devam eder
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
      req.userId   = decoded.userId;
      req.userRole = decoded.role;
    } catch { /* yoksay */ }
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireFullAdmin, requireEmailVerified, optionalAuth };
