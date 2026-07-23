'use strict';

const express  = require('express');
const { getDb } = require('../database/db');

const router = express.Router();

// -----------------------------------------------------------------------
// GET /api/showcase — Vitrin: admin'in elle sectigi ilanlar
// -----------------------------------------------------------------------
router.get('/', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      `SELECT
         l.id, l.title, l.price, l.price_type, l.price_unit, l.price_basis, l.currency, l.vat_included, l.is_featured,
         l.quantity, l.quantity_unit, l.lot_quantity, l.city, l.district,
         l.listing_type, l.views, l.created_at,
         c.name AS category_name, c.slug AS category_slug,
         sc.name AS subcategory_name,
         u.name AS seller_name, u.company_name,
         (SELECT filename FROM listing_images
          WHERE listing_id = l.id ORDER BY sort_order ASC LIMIT 1) AS thumbnail
       FROM showcase_listings s
       JOIN listings l          ON l.id = s.listing_id AND l.status = 'active'
       LEFT JOIN categories    c  ON l.category_id    = c.id
       LEFT JOIN subcategories sc ON l.subcategory_id = sc.id
       LEFT JOIN users         u  ON l.user_id        = u.id
       ORDER BY s.created_at DESC LIMIT 60`
    ).all();

    res.json({ listings: rows });
  } catch (err) {
    console.error('[SHOWCASE] get:', err.message);
    res.status(500).json({ error: 'Vitrin yüklenirken hata oluştu.' });
  }
});

module.exports = router;
