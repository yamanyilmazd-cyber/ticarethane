'use strict';

const express  = require('express');
const { getDb } = require('../database/db');

const router = express.Router();

router.get('/', (_req, res) => {
  try {
    const db   = getDb();
    const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
    res.json(cats);
  } catch(err) { res.status(500).json({ error: 'Sunucu hatasi.' }); }
});

router.get('/:slug', (req, res) => {
  try {
    const db  = getDb();
    const cat = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
    if (!cat) return res.status(404).json({ error: 'Kategori bulunamadi.' });
    const subs = db.prepare('SELECT * FROM subcategories WHERE category_id = ? ORDER BY sort_order ASC').all(cat.id);
    res.json({ ...cat, subcategories: subs });
  } catch(err) { res.status(500).json({ error: 'Sunucu hatasi.' }); }
});

module.exports = router;
