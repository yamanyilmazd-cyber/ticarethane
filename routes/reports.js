'use strict';
const express = require('express');
const { getDb } = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Ilan raporu gonder
router.post('/:listingId', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { reason, detail } = req.body;
    if (!reason || !String(reason).trim()) return res.status(400).json({ error: 'Sebep belirtmeniz gerekiyor.' });
    const listing = db.prepare('SELECT id, user_id FROM listings WHERE id=?').get(req.params.listingId);
    if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });
    // Kendi ilanini sikayet edemezsini
    if (listing.user_id === req.userId) return res.status(400).json({ error: 'Kendi ilanınızı şikayet edemezsiniz.' });
    // Daha once rapor ettiyse tekrar gondertme
    const existing = db.prepare('SELECT id FROM listing_reports WHERE listing_id=? AND reporter_id=?').get(req.params.listingId, req.userId);
    if (existing) return res.status(409).json({ error: 'Bu ilanı daha önce raporladınız.' });
    db.prepare('INSERT INTO listing_reports (listing_id, reporter_id, reason, detail) VALUES (?,?,?,?)')
      .run(req.params.listingId, req.userId, String(reason).trim(), detail ? String(detail).trim().substring(0, 500) : null);
    res.json({ message: 'Rapor gönderildi. İnceleme yapılacaktır.' });
  } catch(err) {
    res.status(500).json({ error: 'Rapor gönderilemedi.' });
  }
});

// Admin: raporlari listele
router.get('/', authenticate, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT r.id, r.listing_id, r.reporter_id, r.reason, r.detail, r.status, r.created_at,
             l.title AS listing_title, l.status AS listing_status,
             u.name AS reporter_name, u.email AS reporter_email
      FROM listing_reports r
      LEFT JOIN listings l ON l.id = r.listing_id
      LEFT JOIN users u ON u.id = r.reporter_id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC LIMIT 100
    `).all();
    res.json({ reports: rows });
  } catch(err) {
    res.status(500).json({ error: 'Raporlar yüklenemedi.' });
  }
});

// Admin: raporu kapat
router.patch('/:id/resolve', authenticate, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    db.prepare("UPDATE listing_reports SET status='resolved' WHERE id=?").run(req.params.id);
    res.json({ message: 'Rapor kapatıldı.' });
  } catch(err) {
    res.status(500).json({ error: 'Güncelleme başarısız.' });
  }
});

module.exports = router;
