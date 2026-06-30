'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('[FATAL] JWT_SECRET environment variable is not set. Set it in Railway variables.');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Giris yapmaniz gerekiyor.' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.userId   = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Oturum suresi dolmus. Lutfen tekrar giris yapin.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Bu islem icin yetkiniz yok.' });
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

module.exports = { authenticate, requireAdmin, optionalAuth };
