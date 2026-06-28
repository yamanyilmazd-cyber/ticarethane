'use strict';
const express = require('express');
const { getDb } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

// Bildirim listesi
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50'
    ).all(req.userId);
    const unread = db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id=? AND is_read=0').get(req.userId).n;
    res.json({ notifications: rows, unread });
  } catch(err) {
    res.status(500).json({ error: 'Bildirimler yuklenemedi.' });
  }
});

// Tumunu okundu isaretle
router.patch('/read-all', (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=?').run(req.userId);
    res.json({ message: 'Tumu okundu.' });
  } catch(err) {
    res.status(500).json({ error: 'Guncelleme basarisiz.' });
  }
});

// Tek bildirim okundu
router.patch('/:id/read', (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?').run(req.params.id, req.userId);
    res.json({ message: 'Okundu.' });
  } catch(err) {
    res.status(500).json({ error: 'Guncelleme basarisiz.' });
  }
});

// Yardimci: bildirim olustur (diger route'lardan kullanilir)
function createNotification(db, userId, type, title, body, link) {
  try {
    db.prepare('INSERT INTO notifications (user_id, type, title, body, link) VALUES (?,?,?,?,?)')
      .run(userId, type, title, body || null, link || null);
  } catch(e) {}
}

module.exports = router;
module.exports.createNotification = createNotification;
