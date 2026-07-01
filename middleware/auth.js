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
