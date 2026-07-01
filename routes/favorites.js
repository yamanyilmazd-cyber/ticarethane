'use strict';
const express = require('express');
const { getDb } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { createNotification } = require('./notifications');
const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT l.id, l.title, l.price, l.currency, l.price_type, l.price_basis,
        l.city, l.listing_type, l.status, l.views, l.created_at, l.is_featured,
        c.name AS category_name, c.slug AS category_slug,
        u.name AS seller_name, u.company_name,
        f.created_at AS favorited_at,
        (SELECT filename FROM listing_images WHERE listing_id=l.id ORDER BY sort_order LIMIT 1) AS thumbnail
      FROM favorites f
      JOIN listings l ON l.id = f.listing_id
      LEFT JOIN categories c ON c.id = l.category_id
      LEFT JOIN users u ON u.id = l.user_id
      WHERE f.user_id = ? AND l.status = 'active'
      ORDER BY f.created_at DESC
    `).all(req.userId);
    res.json({ favorites: rows });
  } catch(err) {
    res.status(500).json({ error: 'Favoriler yüklenemedi.' });
  }
});

router.post('/:listingId', (req, res) => {
  try {
    const db = getDb();
    const listing = db.prepare('SELECT id, user_id, title FROM listings WHERE id=? AND status="active"').get(req.params.listingId);
    if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });
    if (listing.user_id === req.userId) return res.status(400).json({ error: 'Kendi ilanınızı favorilere ekleyemezsiniz.' });
    try {
      db.prepare('INSERT INTO favorites (user_id, listing_id) VALUES (?,?)').run(req.userId, req.params.listingId);
    } catch(e) {
      if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Zaten favorilerde.' });
      throw e;
    }

    // İlan sahibine bildirim gönder
    try {
      const adder = db.prepare('SELECT name, company_name FROM users WHERE id=?').get(req.userId);
      const adderLabel = adder?.company_name || adder?.name || 'Biri';
      createNotification(
        db, listing.user_id, 'favorite',
        'İlanınız Favorilere Eklendi',
        `${adderLabel} "${listing.title}" ilanınızı favorilere ekledi.`,
        '/ilan/' + listing.id
      );
    } catch(e) {}

    res.json({ message: 'Favorilere eklendi.' });
  } catch(err) {
    res.status(500).json({ error: 'Favori eklenemedi.' });
  }
});

router.delete('/:listingId', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM favorites WHERE user_id=? AND listing_id=?').run(req.userId, req.params.listingId);
    res.json({ message: 'Favorilerden kaldırıldı.' });
  } catch(err) {
    res.status(500).json({ error: 'Favori kaldırılırken hata oluştu.' });
  }
});

router.get('/check/:listingId', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT id FROM favorites WHERE user_id=? AND listing_id=?').get(req.userId, req.params.listingId);
    res.json({ isFavorite: !!row });
  } catch(err) {
    res.json({ isFavorite: false });
  }
});

module.exports = router;
