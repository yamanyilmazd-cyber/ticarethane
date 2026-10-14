'use strict';

const express  = require('express');
const { getDb } = require('../database/db');

const router = express.Router();

// -----------------------------------------------------------------------
// GET /api/banners — Ana sayfa slider'i: sadece yayinda olan gorseller
// -----------------------------------------------------------------------
router.get('/', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT id, image, link_url FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
    ).all();
    res.json({ banners: rows });
  } catch (err) {
    console.error('[BANNERS] get:', err.message);
    res.status(500).json({ error: 'Slider gorselleri yuklenemedi.' });
  }
});

module.exports = router;
