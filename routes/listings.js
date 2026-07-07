'use strict';

const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const { getDb }                    = require('../database/db');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { upload }                    = require('../middleware/upload');
const { createNotification }        = require('./notifications');

const router = express.Router();

// -----------------------------------------------------------------------
// YARDIMCI
// -----------------------------------------------------------------------
function cleanupFiles(files) {
  if (!files) return;
  files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
}

// -----------------------------------------------------------------------
// GET /api/listings  — filtreleme + sayfalama
// -----------------------------------------------------------------------
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const {
      category, subcategory, city, listing_type,
      price_min, price_max, price_type, price_basis, quantity_unit, lot_qty_min, lot_qty_max, search, seller_id,
      page = 1, limit = 24, sort = 'newest'
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 24));
    const offset   = (pageNum - 1) * limitNum;

    const conditions = ['l.status = "active"'];
    const params     = [];

    const { featured } = req.query;
    if (featured === '1') {
      conditions.push('l.is_featured = 1');
    }
    // Coklu deger destegi: "a,b,c" -> IN (?,?,?)
    const addMulti = (raw, col, isInt) => {
      let vals = String(raw).split(',').map(s => s.trim()).filter(Boolean);
      if (isInt) vals = vals.map(v => parseInt(v)).filter(v => Number.isInteger(v));
      if (!vals.length) return;
      conditions.push(`${col} IN (${vals.map(() => '?').join(',')})`);
      params.push(...vals);
    };
    if (category)    addMulti(category, 'c.slug');
    if (subcategory) addMulti(subcategory, 'l.subcategory_id', true);
    if (city)        addMulti(city, 'l.city');
    if (listing_type) addMulti(listing_type, 'l.listing_type');
    if (price_min) {
      conditions.push('l.price >= ?');
      params.push(parseFloat(price_min));
    }
    if (price_max) {
      conditions.push('l.price <= ?');
      params.push(parseFloat(price_max));
    }
    if (price_type)  addMulti(price_type, 'l.price_type');
    if (price_basis) addMulti(price_basis, 'l.price_basis');
    if (quantity_unit) addMulti(quantity_unit, 'l.quantity_unit');
    if (lot_qty_min) { conditions.push('l.lot_quantity >= ?'); params.push(parseInt(lot_qty_min)); }
    if (lot_qty_max) { conditions.push('l.lot_quantity <= ?'); params.push(parseInt(lot_qty_max)); }
    if (search) {
      conditions.push('(l.title LIKE ? OR l.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (seller_id) {
      conditions.push('l.user_id = ?');
      params.push(parseInt(seller_id));
    }
    if (req.query.currency) addMulti(req.query.currency, 'l.currency');

    const WHERE = conditions.join(' AND ');

    const ORDER = {
      oldest:     'l.created_at ASC',
      price_asc:  'l.price ASC',
      price_desc: 'l.price DESC',
      views:      'l.views DESC',
    }[sort] || 'l.created_at DESC';

    const total = db.prepare(
      `SELECT COUNT(*) AS n
       FROM listings l
       LEFT JOIN categories c ON l.category_id = c.id
       WHERE ${WHERE}`
    ).get(...params).n;

    const rows = db.prepare(
      `SELECT
         l.id, l.title, l.price, l.price_type, l.price_unit, l.price_basis, l.currency, l.is_featured,
         l.quantity, l.quantity_unit, l.lot_quantity, l.city, l.district,
         l.listing_type, l.views, l.created_at,
         c.name AS category_name, c.slug AS category_slug,
         sc.name AS subcategory_name,
         u.name AS seller_name, u.company_name,
         (SELECT filename FROM listing_images
          WHERE listing_id = l.id ORDER BY sort_order ASC LIMIT 1) AS thumbnail
       FROM listings l
       LEFT JOIN categories   c  ON l.category_id    = c.id
       LEFT JOIN subcategories sc ON l.subcategory_id = sc.id
       LEFT JOIN users         u  ON l.user_id        = u.id
       WHERE ${WHERE}
       ORDER BY ${ORDER}
       LIMIT ? OFFSET ?`
    ).all(...params, limitNum, offset);

    // Arama varsa eslesen firmalari da dondur
    let sellers = [];
    if (search) {
      sellers = db.prepare(
        `SELECT id, name, company_name, city, is_verified FROM users
         WHERE is_active = 1 AND role != 'admin' AND (name LIKE ? OR company_name LIKE ?)
         LIMIT 5`
      ).all(`%${search}%`, `%${search}%`);
    }

    res.json({
      listings:   rows,
      sellers,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    console.error('[LISTINGS] get:', err.message);
    res.status(500).json({ error: 'İlanlar yüklenirken hata oluştu.' });
  }
});

// -----------------------------------------------------------------------
// GET /api/listings/my/listings  — kendi ilanlari
// -----------------------------------------------------------------------
router.get('/my/listings', authenticate, (req, res) => {
  try {
    const db   = getDb();
    const rows = db.prepare(
      `SELECT l.*, c.name AS category_name,
         (SELECT filename FROM listing_images WHERE listing_id = l.id ORDER BY sort_order LIMIT 1) AS thumbnail
       FROM listings l
       LEFT JOIN categories c ON l.category_id = c.id
       WHERE l.user_id = ?
       ORDER BY l.is_featured DESC, l.created_at DESC`
    ).all(req.userId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'İlanlar yüklenirken hata oluştu.' });
  }
});

// -----------------------------------------------------------------------
// GET /api/listings/:id  — tek ilan
// -----------------------------------------------------------------------
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const db      = getDb();
    const ownerId = req.userId || -1;

    const listing = db.prepare(
      `SELECT l.*,
         c.name AS category_name, c.slug AS category_slug,
         sc.name AS subcategory_name,
         u.name AS seller_name, u.company_name, u.city AS seller_city,
         u.is_verified AS seller_verified,
         u.phone AS seller_phone
       FROM listings l
       LEFT JOIN categories    c  ON l.category_id    = c.id
       LEFT JOIN subcategories sc ON l.subcategory_id = sc.id
       LEFT JOIN users         u  ON l.user_id        = u.id
       WHERE l.id = ? AND (l.status = 'active' OR l.user_id = ? OR ? = 'admin')`
    ).get(req.params.id, ownerId, req.userRole || '');

    if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });

    // Sahip kendi ilanını açarsa sayaç artmasın
    if (!req.userId || req.userId !== listing.user_id) {
      db.prepare('UPDATE listings SET views = views + 1 WHERE id = ?').run(listing.id);
    }

    const images = db.prepare(
      'SELECT * FROM listing_images WHERE listing_id = ? ORDER BY sort_order'
    ).all(listing.id);

    const tags = db.prepare(
      'SELECT tag FROM listing_tags WHERE listing_id = ?'
    ).all(listing.id).map(t => t.tag);

    const actualViews = (req.userId && req.userId === listing.user_id) ? listing.views : listing.views + 1;
    res.json({ ...listing, views: actualViews, images, tags });
  } catch (err) {
    console.error('[LISTINGS] get one:', err.message);
    res.status(500).json({ error: 'İlan yüklenirken hata oluştu.' });
  }
});

// -----------------------------------------------------------------------
// POST /api/listings  — ilan olustur
// -----------------------------------------------------------------------
router.post('/', authenticate, upload.array('images', 8), (req, res) => {
  try {
    const db = getDb();
    const {
      title, description, category_id, subcategory_id,
      price, price_type, quantity, quantity_unit,
      city, district, listing_type,
      contact_phone, contact_email, website, tags,
      price_basis, currency, lot_quantity
    } = req.body;

    if (!title || !description || !category_id || !city) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: 'Başlık, açıklama, kategori ve şehir zorunludur.' });
    }
    if (title.trim().length < 5 || title.trim().length > 150) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: 'Başlık 5-150 karakter arasında olmalıdır.' });
    }
    if (description.trim().length < 20 || description.trim().length > 5000) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: 'Açıklama 20-5000 karakter arasında olmalıdır.' });
    }

    if (!db.prepare('SELECT id FROM categories WHERE id = ?').get(parseInt(category_id))) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: 'Geçersiz kategori.' });
    }

    // Enum ve e-posta validasyonlari
    const VALID_LISTING_TYPES = ['sell', 'buy', 'rent', 'service'];
    const VALID_PRICE_TYPES   = ['fixed', 'negotiable', 'exchange', 'free'];
    const VALID_CURRENCIES    = ['TRY', 'USD', 'EUR'];
    if (listing_type && !VALID_LISTING_TYPES.includes(listing_type)) {
      cleanupFiles(req.files); return res.status(400).json({ error: 'Geçersiz ilan türü.' });
    }
    if (price_type && !VALID_PRICE_TYPES.includes(price_type)) {
      cleanupFiles(req.files); return res.status(400).json({ error: 'Geçersiz fiyat türü.' });
    }
    if (currency && !VALID_CURRENCIES.includes(currency)) {
      cleanupFiles(req.files); return res.status(400).json({ error: 'Geçersiz para birimi.' });
    }
    if (contact_email && contact_email.trim()) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRe.test(contact_email.trim())) {
        cleanupFiles(req.files); return res.status(400).json({ error: 'Geçersiz iletişim e-postası.' });
      }
    }

    const expires = new Date();
    expires.setDate(expires.getDate() + 60);

    const r = db.prepare(
      `INSERT INTO listings
         (user_id, category_id, subcategory_id, title, description, price_basis, currency,
          price, price_type, quantity, quantity_unit, lot_quantity,
          city, district, listing_type,
          contact_phone, contact_email, website,
          status, expires_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,  'pending',?)`
    ).run(
      req.userId,
      parseInt(category_id),
      subcategory_id ? parseInt(subcategory_id) : null,
      title.trim(),
      description.trim(),
      price_basis || 'per_unit',
      currency    || 'TRY',
      price       ? parseFloat(price) : null,
      price_type  || 'fixed',
      quantity    ? parseFloat(quantity) : null,
      quantity_unit?.trim() || null,
      lot_quantity ? parseInt(lot_quantity) : null,
      city.trim(),
      district?.trim()      || null,
      listing_type || 'sell',
      contact_phone?.trim() || null,
      contact_email?.trim() || null,
      (website?.trim() && !/^https?:\/\//i.test(website.trim()) ? 'https://' + website.trim() : website?.trim() || null),
      expires.toISOString()
    );

    const lid = r.lastInsertRowid;

    if (req.files?.length) {
      const ins = db.prepare('INSERT INTO listing_images (listing_id, filename, sort_order) VALUES (?,?,?)');
      req.files.forEach((f, i) => ins.run(lid, tag));
    }

    if (tags) {
      try {
        const tagList = (Array.isArray(tags) ? tags : tags.split(',')).map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 10);
        const ins = db.prepare('INSERT INTO listing_tags (listing_id, tag) VALUES (?,?)');
        tagList.forEach(tag => ins.run(lid, tag));
      } catch(tagErr) { console.error('[LISTINGS] tag insert:', tagErr.message); }
    }

    res.status(201).json({ message: 'İlanınız moderasyon onayına gönderildi.', listing_id: lid });
  } catch (err) {
    cleanupFiles(req.files);
    console.error('[LISTINGS] create:', err.message);
    res.status(500).json({ error: err.message || 'İlan oluşturulurken hata oluştu.' });
  }
});

// -----------------------------------------------------------------------
// PUT /api/listings/:id  — ilan guncelle
// -----------------------------------------------------------------------
router.put('/:id', authenticate, upload.array('images', 8), (req, res) => {
  try {
    const db      = getDb();
    const listing = db.prepare('SELECT * FROM listings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);

    if (!listing) { cleanupFiles(req.files); return res.status(404).json({ error: 'İlan bulunamadı.' }); }
    if (listing.status === 'sold') { cleanupFiles(req.files); return res.status(400).json({ error: 'Satılmış ilan düzenlenemez.' }); }

    const {
      title, description, category_id, subcategory_id,
      price, price_type, price_basis, currency, quantity, quantity_unit, lot_quantity,
      city, district, listing_type,
      contact_phone, contact_email, website, delete_images
    } = req.body;

    db.prepare(
      `UPDATE listings SET
         title=?, description=?, category_id=?, subcategory_id=?,
         price=?, price_type=?, price_basis=?, currency=?, quantity=?, quantity_unit=?, lot_quantity=?,
         city=?, district=?, listing_type=?,
         contact_phone=?, contact_email=?, website=?,
         status='pending', updated_at=CURRENT_TIMESTAMP
       WHERE id=?`
    ).run(
      title?.trim()         || listing.title,
      description?.trim()   || listing.description,
      category_id ? parseInt(category_id) : listing.category_id,
      subcategory_id ? parseInt(subcategory_id) : listing.subcategory_id,
      price    ? parseFloat(price)    : listing.price,
      price_type    || listing.price_type,
      price_basis   || listing.price_basis || 'per_unit',
      currency      || listing.currency || 'TRY',
      quantity ? parseFloat(quantity) : listing.quantity,
      quantity_unit?.trim() || listing.quantity_unit,
      (lot_quantity !== undefined && lot_quantity !== null && lot_quantity !== '') ? (parseInt(lot_quantity) || null) : (listing.lot_quantity ?? null),
      city?.trim()          || listing.city,
      district?.trim()      || listing.district,
      listing_type          || listing.listing_type,
      contact_phone?.trim() || listing.contact_phone,
      contact_email?.trim() || listing.contact_email,
      website?.trim()       || listing.website,
      listing.id
    );

    // Silinecek gorseller
    if (delete_images) {
      const toDelete = Array.isArray(delete_images) ? delete_images : [delete_images];
      toDelete.forEach(imgId => {
        const img = db.prepare('SELECT filename FROM listing_images WHERE id=? AND listing_id=?').get(parseInt(imgId), listing.id);
        if (img) {
          try { fs.unlinkSync(path.join(__dirname, '..', 'uploads', img.filename)); } catch {}
          db.prepare('DELETE FROM listing_images WHERE id=?').run(parseInt(imgId));
        }
      });
      // sort_order'i yeniden sırala (gaps kalmadan)
      const remaining = db.prepare('SELECT id FROM listing_images WHERE listing_id=? ORDER BY sort_order ASC').all(listing.id);
      const reorder   = db.prepare('UPDATE listing_images SET sort_order=? WHERE id=?');
      remaining.forEach((img, i) => reorder.run(i, img.id));
    }

    // Yeni gorseller
    if (req.files?.length) {
      const maxOrder = db.prepare('SELECT MAX(sort_order) AS m FROM listing_images WHERE listing_id=?').get(listing.id);
      let start = (maxOrder?.m ?? -1) + 1;
      const ins = db.prepare('INSERT INTO listing_images (listing_id, filename, sort_order) VALUES (?,?,?)');
      req.files.forEach((f, i) => ins.run(listing.id, f.filename, start + i));
    }

    // Fiyat degistiyse bildirim gonder
    const newPrice = price ? parseFloat(price) : listing.price;
    if (newPrice && listing.price && Math.abs(newPrice - listing.price) > 0.001) {
      try {
        const db2 = getDb();
        // Ilan sahibine bildirim
        createNotification(db2, listing.user_id, 'price_change',
          'Fiyat Guncellendi',
          `"${listing.title}" ilanınızın fiyatı guncellendi: ${listing.price} → ${newPrice} ${listing.currency || 'TRY'}`,
          '/ilan/' + listing.id
        );
        // Favoriye alanlara bildirim
        const favUsers = db2.prepare(
          'SELECT DISTINCT user_id FROM favorites WHERE listing_id=? AND user_id!=?'
        ).all(listing.id, listing.user_id);
        favUsers.forEach(function(fu) {
          createNotification(db2, fu.user_id, 'price_change',
            'Favori İlandaki Fiyat Degisti',
            `Takip ettiginiz "${listing.title}" ilanının fiyatı guncellendi.`,
            '/ilan/' + listing.id
          );
        });
      } catch(notifErr) { /* bildirim hatasi kritik degil */ }
    }

    res.json({ message: 'İlan güncellendi ve onay için tekrar gönderildi.' });
  } catch (err) {
    cleanupFiles(req.files);
    console.error('[LISTINGS] update:', err.message);
    res.status(500).json({ error: 'İlan güncellenirken hata oluştu.' });
  }
});

// -----------------------------------------------------------------------
// DELETE /api/listings/:id
// -----------------------------------------------------------------------
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db      = getDb();
    const listing = db.prepare('SELECT * FROM listings WHERE id=? AND user_id=?').get(req.params.id, req.userId);
    if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });

    const imgs = db.prepare('SELECT filename FROM listing_images WHERE listing_id=?').all(listing.id);
    imgs.forEach(img => { try { fs.unlinkSync(path.join(__dirname, '..', 'uploads', img.filename)); } catch {} });

    db.prepare('DELETE FROM listings WHERE id=?').run(listing.id);
    res.json({ message: 'İlan silindi.' });
  } catch (err) {
    console.error('[LISTINGS] delete:', err.message);
    res.status(500).json({ error: 'İlan silinirken hata oluştu.' });
  }
});

// -----------------------------------------------------------------------
// PATCH /api/listings/:id/sold
// -----------------------------------------------------------------------
router.patch('/:id/sold', authenticate, (req, res) => {
  try {
    const db      = getDb();
    const listing = db.prepare('SELECT id FROM listings WHERE id=? AND user_id=?').get(req.params.id, req.userId);
    if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });
    db.prepare('UPDATE listings SET status="sold", updated_at=CURRENT_TIMESTAMP WHERE id=?').run(listing.id);
    res.json({ message: 'İlan satıldı olarak işaretlendi.' });
  } catch (err) {
    console.error('[LISTINGS] sold:', err.message);
    res.status(500).json({ error: 'İşlem sırasında hata oluştu.' });
  }
});

// ---- Ilan yenile (30 gun uzat) ----
router.patch('/:id/renew', authenticate, (req, res) => {
  try {
    const db      = getDb();
    const listing = db.prepare('SELECT * FROM listings WHERE id=? AND user_id=?').get(req.params.id, req.userId);
    if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });
    if (!['active','rejected'].includes(listing.status))
      return res.status(400).json({ error: 'Sadece aktif veya reddedilmiş ilanlar yenilenebilir.' });
    const newExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const newStatus = listing.status === 'rejected' ? 'pending' : 'active';
    db.prepare('UPDATE listings SET expires_at=?, renewed_at=datetime("now"), status=?, updated_at=datetime("now") WHERE id=?')
      .run(newExp, newStatus, req.params.id);
    res.json({ message: 'İlan yenilendi.', expires_at: newExp });
  } catch (err) {
    console.error('[LISTINGS] renew:', err.message);
    res.status(500).json({ error: 'Yenileme sırasında hata oluştu.' });
  }
});

module.exports = router;
