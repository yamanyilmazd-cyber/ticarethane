'use strict';

const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const { getDb }                       = require('../database/db');
const { authenticate, requireAdmin }  = require('../middleware/auth');
const { createNotification }          = require('./notifications');

const router = express.Router();
router.use(authenticate, requireAdmin);

// ================================================================
// ÖZET İSTATİSTİKLER
// ================================================================
router.get('/stats', (_req, res) => {
  try {
    const db = getDb();
    res.json({
      total_listings:      db.prepare('SELECT COUNT(*) AS n FROM listings').get().n,
      pending_listings:    db.prepare('SELECT COUNT(*) AS n FROM listings WHERE status="pending"').get().n,
      active_listings:     db.prepare('SELECT COUNT(*) AS n FROM listings WHERE status="active"').get().n,
      rejected_listings:   db.prepare('SELECT COUNT(*) AS n FROM listings WHERE status="rejected"').get().n,
      sold_listings:       db.prepare('SELECT COUNT(*) AS n FROM listings WHERE status="sold"').get().n,
      total_users:         db.prepare('SELECT COUNT(*) AS n FROM users WHERE role="user"').get().n,
      active_users:        db.prepare('SELECT COUNT(*) AS n FROM users WHERE role="user" AND is_active=1').get().n,
      banned_users:        db.prepare('SELECT COUNT(*) AS n FROM users WHERE role="user" AND is_active=0').get().n,
      new_users_today:     db.prepare(`SELECT COUNT(*) AS n FROM users WHERE DATE(created_at)=DATE('now')`).get().n,
      new_listings_today:  db.prepare(`SELECT COUNT(*) AS n FROM listings WHERE DATE(created_at)=DATE('now')`).get().n,
      total_messages:      db.prepare('SELECT COUNT(*) AS n FROM messages').get().n,
      total_conversations: db.prepare('SELECT COUNT(*) AS n FROM conversations').get().n,
      total_views:         db.prepare('SELECT COALESCE(SUM(views),0) AS n FROM listings').get().n,
      listings_this_week:  db.prepare(`SELECT COUNT(*) AS n FROM listings WHERE created_at >= DATE('now','-7 days')`).get().n,
      users_this_week:     db.prepare(`SELECT COUNT(*) AS n FROM users WHERE created_at >= DATE('now','-7 days') AND role='user'`).get().n,
    });
  } catch (err) {
    console.error('[ADMIN] stats:', err.message);
    res.status(500).json({ error: 'İstatistikler yüklenemedi.' });
  }
});

// ================================================================
// DETAYLI İSTATİSTİKLER
// ================================================================
router.get('/stats/detailed', (_req, res) => {
  try {
  const db = getDb();

  // Sektöre göre detaylı (fiyat + değişim dahil)
  const byCategory = db.prepare(`
    SELECT c.name, c.slug,
      COUNT(l.id) AS total,
      SUM(CASE WHEN l.status='active'  THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN l.status='pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN l.status='sold'    THEN 1 ELSE 0 END) AS sold,
      COALESCE(SUM(l.views),0) AS total_views,
      ROUND(AVG(CASE WHEN l.price>0 THEN l.price END),0) AS avg_price,
      MIN(CASE WHEN l.price>0 THEN l.price END) AS min_price,
      MAX(CASE WHEN l.price>0 THEN l.price END) AS max_price,
      SUM(CASE WHEN l.created_at >= DATE('now','-7 days') THEN 1 ELSE 0 END) AS this_week,
      SUM(CASE WHEN l.created_at >= DATE('now','-14 days') AND l.created_at < DATE('now','-7 days') THEN 1 ELSE 0 END) AS last_week
    FROM categories c
    LEFT JOIN listings l ON l.category_id=c.id
    GROUP BY c.id ORDER BY total DESC
  `).all();

  // Şehir dağılımı
  const byCity = db.prepare(`
    SELECT city, COUNT(*) AS count,
      ROUND(AVG(CASE WHEN price>0 THEN price END),0) AS avg_price
    FROM listings WHERE status='active' AND city!=''
    GROUP BY city ORDER BY count DESC LIMIT 20
  `).all();

  // İlan türü
  const byListingType = db.prepare(`
    SELECT listing_type, COUNT(*) AS count,
      ROUND(AVG(CASE WHEN price>0 THEN price END),0) AS avg_price
    FROM listings WHERE status='active'
    GROUP BY listing_type
  `).all();

  // Miktar birimi dağılımı (lot, ton, kg, vb.)
  const byUnit = db.prepare(`
    SELECT COALESCE(quantity_unit,'Belirtilmedi') AS unit,
      COUNT(*) AS count,
      ROUND(AVG(CASE WHEN price>0 THEN price END),0) AS avg_price,
      MIN(CASE WHEN price>0 THEN price END) AS min_price,
      MAX(CASE WHEN price>0 THEN price END) AS max_price
    FROM listings WHERE status='active'
    GROUP BY quantity_unit ORDER BY count DESC
  `).all();

  // Fiyat türü dağılımı
  const byPriceType = db.prepare(`
    SELECT COALESCE(price_type,'Belirtilmedi') AS price_type, COUNT(*) AS count
    FROM listings WHERE status='active'
    GROUP BY price_type ORDER BY count DESC
  `).all();

  // Son 30 gün ilan trendi
  const last30Days = db.prepare(`
    SELECT DATE(created_at) AS gun, COUNT(*) AS listings
    FROM listings
    WHERE created_at >= DATE('now','-29 days')
    GROUP BY DATE(created_at) ORDER BY gun ASC
  `).all();

  // Son 30 gün üye trendi
  const last30DaysUsers = db.prepare(`
    SELECT DATE(created_at) AS gun, COUNT(*) AS users
    FROM users
    WHERE created_at >= DATE('now','-29 days') AND role='user'
    GROUP BY DATE(created_at) ORDER BY gun ASC
  `).all();

  // Sektöre göre haftalık trend (son 8 hafta, en aktif 5 sektör)
  const weeklyByCat = db.prepare(`
    SELECT c.name AS category,
      strftime('%Y-W%W', l.created_at) AS week,
      COUNT(*) AS count
    FROM listings l JOIN categories c ON c.id=l.category_id
    WHERE l.created_at >= DATE('now','-56 days')
    GROUP BY c.id, week ORDER BY week ASC, count DESC
  `).all();

  // Sektöre göre fiyat trendi (aylık ort. fiyat, son 6 ay)
  const priceByMonth = db.prepare(`
    SELECT c.name AS category,
      strftime('%Y-%m', l.created_at) AS month,
      ROUND(AVG(CASE WHEN l.price>0 THEN l.price END),0) AS avg_price,
      COUNT(*) AS count
    FROM listings l JOIN categories c ON c.id=l.category_id
    WHERE l.status='active' AND l.created_at >= DATE('now','-180 days')
    GROUP BY c.id, month ORDER BY month ASC
  `).all();

  // Birim başına fiyat analizi (ton başı, lot başı, kg başı vb.)
  const pricePerUnit = db.prepare(`
    SELECT
      COALESCE(quantity_unit,'Birim Yok') AS unit,
      COALESCE(currency,'TRY') AS currency,
      COUNT(*) AS listing_count,
      ROUND(AVG(CASE WHEN price>0 THEN price END),0) AS avg_price,
      MIN(CASE WHEN price>0 THEN price END) AS min_price,
      MAX(CASE WHEN price>0 THEN price END) AS max_price,
      ROUND(AVG(CASE WHEN price>0 AND quantity>0 THEN price/quantity END),2) AS avg_unit_price
    FROM listings WHERE status='active'
    GROUP BY quantity_unit, currency ORDER BY listing_count DESC
  `).all();

  // Sektöre göre birim başı ort. fiyat
  const pricePerUnitByCat = db.prepare(`
    SELECT c.name AS category,
      COALESCE(l.quantity_unit,'—') AS unit,
      COALESCE(l.currency,'TRY') AS currency,
      COUNT(*) AS count,
      ROUND(AVG(CASE WHEN l.price>0 THEN l.price END),0) AS avg_price,
      ROUND(AVG(CASE WHEN l.price>0 AND l.quantity>0 THEN l.price/l.quantity END),2) AS avg_unit_price
    FROM listings l JOIN categories c ON c.id=l.category_id
    WHERE l.status='active' AND l.price > 0
    GROUP BY c.id, l.quantity_unit, l.currency
    HAVING count >= 1
    ORDER BY count DESC LIMIT 40
  `).all();

  // En çok görüntülenen
  const topListings = db.prepare(`
    SELECT l.id, l.title, l.views, l.status, l.price, l.price_type, l.price_basis,
      l.currency, l.quantity_unit, l.lot_quantity, l.is_featured,
      c.name AS category_name, u.name AS user_name, l.created_at
    FROM listings l
    LEFT JOIN categories c ON l.category_id=c.id
    LEFT JOIN users      u ON l.user_id=u.id
    WHERE l.status='active'
    ORDER BY l.views DESC LIMIT 10
  `).all();

  // Değişim karşılaştırması (bu hafta vs geçen hafta)
  const changeStats = {
    listings_this_week: db.prepare(`SELECT COUNT(*) AS n FROM listings WHERE created_at >= DATE('now','-7 days')`).get().n,
    listings_last_week: db.prepare(`SELECT COUNT(*) AS n FROM listings WHERE created_at >= DATE('now','-14 days') AND created_at < DATE('now','-7 days')`).get().n,
    users_this_week:    db.prepare(`SELECT COUNT(*) AS n FROM users WHERE created_at >= DATE('now','-7 days') AND role='user'`).get().n,
    users_last_week:    db.prepare(`SELECT COUNT(*) AS n FROM users WHERE created_at >= DATE('now','-14 days') AND created_at < DATE('now','-7 days') AND role='user'`).get().n,
    views_this_week:    db.prepare(`SELECT COALESCE(SUM(views),0) AS n FROM listings WHERE created_at >= DATE('now','-7 days')`).get().n,
    listings_this_month: db.prepare(`SELECT COUNT(*) AS n FROM listings WHERE created_at >= DATE('now','-30 days')`).get().n,
    listings_last_month: db.prepare(`SELECT COUNT(*) AS n FROM listings WHERE created_at >= DATE('now','-60 days') AND created_at < DATE('now','-30 days')`).get().n,
    active_this_week:   db.prepare(`SELECT COUNT(*) AS n FROM listings WHERE status='active' AND updated_at >= DATE('now','-7 days')`).get().n,
    sold_this_week:     db.prepare(`SELECT COUNT(*) AS n FROM listings WHERE status='sold' AND updated_at >= DATE('now','-7 days')`).get().n,
    msgs_this_week:     db.prepare(`SELECT COUNT(*) AS n FROM messages WHERE created_at >= DATE('now','-7 days')`).get().n,
  };

  // Genel fiyat istatistikleri (para birimine göre ayrı)
  const priceStatsByCur = db.prepare(`
    SELECT
      COALESCE(currency,'TRY') AS currency,
      COUNT(*) AS count_with_price,
      ROUND(AVG(price),0) AS avg_price,
      MIN(price) AS min_price,
      MAX(price) AS max_price,
      ROUND(AVG(CASE WHEN quantity_unit='Ton'   THEN price END),0) AS avg_per_ton,
      ROUND(AVG(CASE WHEN quantity_unit='Kg'    THEN price END),0) AS avg_per_kg,
      ROUND(AVG(CASE WHEN quantity_unit='Adet'  THEN price END),0) AS avg_per_adet,
      ROUND(AVG(CASE WHEN quantity_unit='Palet' THEN price END),0) AS avg_per_palet
    FROM listings WHERE price IS NOT NULL AND price > 0 AND status='active'
    GROUP BY currency
  `).all();
  // Geriye dönük uyumluluk için ilk TRY kaydı (veya tümü)
  const priceStats = priceStatsByCur.find(function(r){ return r.currency==='TRY'; }) || priceStatsByCur[0] || {};

  const msgStats = db.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN is_read=0 THEN 1 ELSE 0 END) AS unread
    FROM messages
  `).get();

  // Firma istatistikleri — en çok ilan veren firmalar
  const topCompanies = db.prepare(`
    SELECT
      u.id AS user_id,
      COALESCE(u.company_name, u.name) AS company_name,
      u.city,
      u.created_at AS member_since,
      COUNT(l.id) AS total_listings,
      SUM(CASE WHEN l.status='active'  THEN 1 ELSE 0 END) AS active_listings,
      SUM(CASE WHEN l.status='sold'    THEN 1 ELSE 0 END) AS sold_listings,
      SUM(CASE WHEN l.status='pending' THEN 1 ELSE 0 END) AS pending_listings,
      COALESCE(SUM(l.views), 0) AS total_views,
      ROUND(AVG(CASE WHEN l.price > 0 THEN l.price END), 0) AS avg_price,
      MAX(l.created_at) AS last_listing_at
    FROM users u
    LEFT JOIN listings l ON l.user_id = u.id
    WHERE u.role = 'user'
    GROUP BY u.id
    HAVING total_listings > 0
    ORDER BY total_listings DESC
    LIMIT 50
  `).all();

  // Sektör dağılımı firmalar bazında
  const companySectorDist = db.prepare(`
    SELECT
      COALESCE(u.company_name, u.name) AS company_name,
      u.id AS user_id,
      c.name AS category,
      COUNT(*) AS count
    FROM listings l
    JOIN users u ON u.id = l.user_id
    JOIN categories c ON c.id = l.category_id
    WHERE l.status = 'active'
    GROUP BY u.id, c.id
    ORDER BY count DESC
    LIMIT 30
  `).all();

  // Genel firma metrikleri
  const companyStats = db.prepare(`
    SELECT
      COUNT(DISTINCT u.id) AS total_companies,
      COUNT(DISTINCT CASE WHEN u.company_name IS NOT NULL AND u.company_name != '' THEN u.id END) AS named_companies,
      COUNT(DISTINCT CASE WHEN l.id IS NOT NULL THEN u.id END) AS companies_with_listings,
      ROUND(AVG(sub.cnt), 1) AS avg_listings_per_company
    FROM users u
    LEFT JOIN listings l ON l.user_id = u.id AND l.status = 'active'
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS cnt FROM listings GROUP BY user_id
    ) sub ON sub.user_id = u.id
    WHERE u.role = 'user'
  `).get();

  // Son aktiviteler — son 20 ilan + son 10 üye
  const recentActivity = [
    ...db.prepare(`
      SELECT 'listing' AS type, l.title AS text, l.status, u.name AS user_name, l.created_at
      FROM listings l JOIN users u ON u.id=l.user_id
      ORDER BY l.created_at DESC LIMIT 10
    `).all().map(r => ({ ...r })),
    ...db.prepare(`
      SELECT 'user' AS type, name AS text, NULL AS status, name AS user_name, created_at
      FROM users WHERE role='user' ORDER BY created_at DESC LIMIT 10
    `).all().map(r => ({ ...r })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 15);

  res.json({
    byCategory, byCity, byListingType, byUnit, byPriceType,
    last30Days, last30DaysUsers, weeklyByCat, priceByMonth,
    pricePerUnit, pricePerUnitByCat,
    topListings, changeStats, priceStats, priceStatsByCur, msgStats,
    topCompanies, companySectorDist, companyStats,
    recentActivity
  });
  } catch (err) {
    console.error('[ADMIN] stats/detailed:', err.message);
    res.status(500).json({ error: 'Detaylı istatistikler yüklenemedi.' });
  }
});

// ================================================================
// BEKLEYEN İLANLAR
// ================================================================
router.get('/listings/pending', (_req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT l.*, c.name AS category_name, sc.name AS subcategory_name,
      u.name AS user_name, u.email AS user_email, u.company_name, u.phone,
      (SELECT COUNT(*) FROM listing_images WHERE listing_id=l.id) AS image_count
    FROM listings l
    LEFT JOIN categories    c  ON l.category_id=c.id
    LEFT JOIN subcategories sc ON l.subcategory_id=sc.id
    LEFT JOIN users         u  ON l.user_id=u.id
    WHERE l.status='pending'
    ORDER BY l.created_at ASC
  `).all();
  res.json(rows);
});

// ================================================================
// TÜM İLANLAR (filtreli + sayfalı)
// ================================================================
router.get('/listings', (req, res) => {
  const db = getDb();
  const { status, search, category, city, page = 1, limit = 30 } = req.query;
  const pageNum  = parseInt(page);
  const limitNum = parseInt(limit);
  const offset   = (pageNum - 1) * limitNum;

  const conds = []; const params = [];
  if (status)   { conds.push('l.status=?'); params.push(status); }
  if (city)     { conds.push('l.city=?');   params.push(city); }
  if (category) { conds.push('c.slug=?');   params.push(category); }
  if (search)   { conds.push('(l.title LIKE ? OR u.email LIKE ? OR u.name LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  const WHERE = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

  const total = db.prepare(`
    SELECT COUNT(*) AS n FROM listings l
    LEFT JOIN categories c ON l.category_id=c.id
    LEFT JOIN users u ON l.user_id=u.id ${WHERE}
  `).get(...params).n;

  const rows = db.prepare(`
    SELECT l.*, c.name AS category_name, sc.name AS subcategory_name,
      u.name AS user_name, u.email AS user_email, u.company_name,
      (SELECT COUNT(*) FROM listing_images WHERE listing_id=l.id) AS image_count
    FROM listings l
    LEFT JOIN categories    c  ON l.category_id=c.id
    LEFT JOIN subcategories sc ON l.subcategory_id=sc.id
    LEFT JOIN users         u  ON l.user_id=u.id
    ${WHERE} ORDER BY l.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset);

  res.json({ listings: rows, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

// ---- İlan detayı (admin) ----
router.get('/listings/:id', (req, res) => {
  const db = getDb();
  const l  = db.prepare(`
    SELECT l.*, c.name AS category_name, sc.name AS subcategory_name,
      u.name AS seller_name, u.email AS seller_email, u.company_name
    FROM listings l
    LEFT JOIN categories    c  ON l.category_id=c.id
    LEFT JOIN subcategories sc ON l.subcategory_id=sc.id
    LEFT JOIN users         u  ON l.user_id=u.id
    WHERE l.id=?
  `).get(req.params.id);
  if (!l) return res.status(404).json({ error: 'İlan bulunamadı.' });
  const images = db.prepare('SELECT * FROM listing_images WHERE listing_id=? ORDER BY sort_order').all(l.id);
  res.json({ ...l, images });
});

// ---- Onayla ----
router.patch('/listings/:id/approve', (req, res) => {
  try {
    const db = getDb();
    const listing = db.prepare('SELECT id, user_id, title FROM listings WHERE id=?').get(req.params.id);
    if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });
    db.prepare(
      "UPDATE listings SET status='active', rejection_reason=NULL, updated_at=datetime('now'), " +
      "expires_at=datetime('now', '+30 days') WHERE id=?"
    ).run(req.params.id);
    try {
      createNotification(db, listing.user_id, 'listing_approved',
        'İlanınız Onaylandı',
        `"${listing.title}" ilanınız moderasyon onayından geçti ve yayına alındı.`,
        '/ilan/' + listing.id
      );
    } catch(e) {}
    res.json({ message: 'İlan onaylandı.' });
  } catch(err) { res.status(500).json({ error: "İşlem başarısız." }); }
});

// ---- Reddet ----
router.patch('/listings/:id/reject', (req, res) => {
  try {
  const db     = getDb();
  const reason = req.body.reason || 'İlan kurallara aykırıdır.';
  const listing = db.prepare('SELECT id, user_id, title FROM listings WHERE id=?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });
  db.prepare('UPDATE listings SET status="rejected", rejection_reason=?, updated_at=datetime("now") WHERE id=?').run(reason, req.params.id);
  try {
    createNotification(db, listing.user_id, 'listing_rejected',
      'İlanınız Reddedildi',
      `"${listing.title}" ilanınız reddedildi. Neden: ${reason}`,
      '/hesabim'
    );
  } catch(e) {}
  res.json({ message: 'İlan reddedildi.' });
  } catch(err) { res.status(500).json({ error: "İşlem başarısız." }); }
});

// ---- Toplu onayla ----
router.post('/listings/bulk-approve', (req, res) => {
  const db  = getDb();
  const ids = req.body.ids;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ID listesi gerekli.' });
  if (ids.length > 100) return res.status(400).json({ error: 'En fazla 100 ilan onaylanabilir.' });
  const validIds = ids.map(Number).filter(id => Number.isInteger(id) && id > 0);
  if (!validIds.length) return res.status(400).json({ error: 'Geçersiz ID listesi.' });
  validIds.forEach(id => {
    db.prepare('UPDATE listings SET status="active", updated_at=datetime("now") WHERE id=? AND status="pending"').run(id);
  });
  res.json({ message: `${validIds.length} ilan onaylandı.` });
});

// ---- Sil ----
router.delete('/listings/:id', (req, res) => {
  const db      = getDb();
  const listing = db.prepare('SELECT id FROM listings WHERE id=?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });
  const imgs = db.prepare('SELECT filename FROM listing_images WHERE listing_id=?').all(listing.id);
  imgs.forEach(img => { try { fs.unlinkSync(path.join(__dirname, '..', 'uploads', img.filename)); } catch {} });
  db.prepare('DELETE FROM listing_images WHERE listing_id=?').run(listing.id);
  db.prepare('DELETE FROM listings WHERE id=?').run(listing.id);
  res.json({ message: 'İlan silindi.' });
});

// ================================================================
// KULLANICILAR
// ================================================================
router.get('/users', (req, res) => {
  const db = getDb();
  const { page = 1, limit = 30, search, role = 'user', is_active } = req.query;
  const pageNum  = parseInt(page);
  const limitNum = parseInt(limit);
  const offset   = (pageNum - 1) * limitNum;

  const safeRole = role === 'admin' ? 'admin' : 'user';
  const conds = ['u.role=?']; const params = [safeRole];
  if (search)    { conds.push('(u.name LIKE ? OR u.email LIKE ? OR u.company_name LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (is_active !== undefined && is_active !== '') { conds.push('u.is_active=?'); params.push(parseInt(is_active)); }
  const WHERE = 'WHERE ' + conds.join(' AND ');

  const total = db.prepare(`SELECT COUNT(*) AS n FROM users u ${WHERE}`).get(...params).n;
  const users = db.prepare(`
    SELECT u.id, u.name, u.company_name, u.email, u.phone, u.city, u.is_active, u.created_at,
      COUNT(l.id) AS listing_count,
      SUM(CASE WHEN l.status='active' THEN 1 ELSE 0 END) AS active_listings
    FROM users u LEFT JOIN listings l ON l.user_id=u.id
    ${WHERE} GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset);

  res.json({ users, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

// ---- Kullanıcı detayı ----
router.get('/users/:id', (req, res) => {
  const db   = getDb();
  const user = db.prepare(`
    SELECT u.*, COUNT(l.id) AS listing_count
    FROM users u LEFT JOIN listings l ON l.user_id=u.id
    WHERE u.id=? GROUP BY u.id
  `).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  const listings = db.prepare(`
    SELECT l.id, l.title, l.status, l.views, l.created_at, c.name AS category_name
    FROM listings l LEFT JOIN categories c ON l.category_id=c.id
    WHERE l.user_id=? ORDER BY l.created_at DESC LIMIT 20
  `).all(req.params.id);

  delete user.password_hash;
  res.json({ ...user, listings });
});

// ---- Askıya al / aktifleştir ----
router.patch('/users/:id/toggle', (req, res) => {
  const db   = getDb();
  const user = db.prepare('SELECT id, is_active FROM users WHERE id=? AND role!="admin"').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  const newState = user.is_active ? 0 : 1;
  db.prepare('UPDATE users SET is_active=?, updated_at=datetime("now") WHERE id=?').run(newState, user.id);
  // Askıya alınırsa ilanları da pasif yap
  if (!newState) {
    db.prepare('UPDATE listings SET status="rejected", rejection_reason="Hesap askıya alındı." WHERE user_id=? AND status IN ("active","pending")').run(user.id);
  }
  res.json({ message: newState ? 'Kullanıcı aktifleştirildi.' : 'Kullanıcı ve ilanları askıya alındı.', is_active: newState });
});

// ---- Kullanıcı sil (admin) ----
router.delete('/users/:id', (req, res) => {
  try {
    const db  = getDb();
    const uid = parseInt(req.params.id);
    const user = db.prepare('SELECT id FROM users WHERE id=? AND role!="admin"').get(uid);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı veya silme izni yok.' });

    // Görselleri sil
    const imgs = db.prepare(
      'SELECT filename FROM listing_images WHERE listing_id IN (SELECT id FROM listings WHERE user_id=?)'
    ).all(uid);
    imgs.forEach(function(img) {
      try { fs.unlinkSync(path.join(__dirname, '..', 'uploads', img.filename)); } catch(e) {}
    });

    // Veritabanından temizle
    db.prepare('DELETE FROM listing_images WHERE listing_id IN (SELECT id FROM listings WHERE user_id=?)').run(uid);
    db.prepare('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user1_id=? OR user2_id=?)').run(uid, uid);
    db.prepare('DELETE FROM conversations WHERE user1_id=? OR user2_id=?').run(uid, uid);
    db.prepare('DELETE FROM listings WHERE user_id=?').run(uid);
    db.prepare('DELETE FROM users WHERE id=?').run(uid);

    res.json({ message: 'Kullanıcı ve tüm verileri silindi.' });
  } catch(err) {
    console.error('[ADMIN] user delete:', err.message);
    res.status(500).json({ error: 'Silme sırasında hata oluştu.' });
  }
});

// ---- Admin notu ekle ----
router.post('/users/:id/note', (req, res) => {
  try {
    const db   = getDb();
    const note = req.body.note;
    if (!note) return res.status(400).json({ error: 'Not boş olamaz.' });
    db.prepare('INSERT INTO admin_notes (user_id, note, created_by) VALUES (?, ?, ?)').run(req.params.id, note, req.userId);
    res.json({ message: 'Not eklendi.' });
  } catch(err) { res.status(500).json({ error: 'Not eklenemedi.' }); }
});

// ================================================================
// MESAJLAR (admin görünümü)
// ================================================================
router.get('/messages', (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const total = db.prepare('SELECT COUNT(*) AS n FROM conversations').get().n;
    const rows  = db.prepare(`
      SELECT c.id, c.created_at, c.last_message_at,
        u1.name AS user1_name, u1.email AS user1_email,
        u2.name AS user2_name, u2.email AS user2_email,
        l.title AS listing_title,
        (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id) AS msg_count,
        m.content AS last_message
      FROM conversations c
      JOIN users u1 ON u1.id=c.user1_id
      JOIN users u2 ON u2.id=c.user2_id
      LEFT JOIN listings l ON l.id=c.listing_id
      LEFT JOIN messages m ON m.id=(SELECT id FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1)
      ORDER BY c.last_message_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);

    res.json({ conversations: rows, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch(err) { res.status(500).json({ error: 'Mesajlar yüklenemedi.' }); }
});

router.get('/messages/:convId', (req, res) => {
  try {
    const db   = getDb();
    const conv = db.prepare('SELECT * FROM conversations WHERE id=?').get(req.params.convId);
    if (!conv) return res.status(404).json({ error: 'Konuşma bulunamadı.' });
    const msgs = db.prepare(`
      SELECT m.*, u.name AS sender_name
      FROM messages m JOIN users u ON u.id=m.sender_id
      WHERE m.conversation_id=? ORDER BY m.created_at ASC
    `).all(conv.id);
    res.json({ conversation: conv, messages: msgs });
  } catch(err) { res.status(500).json({ error: 'Konuşma yüklenemedi.' }); }
});

// ================================================================
// KATEGORİ YÖNETİMİ
// ================================================================
router.get('/categories', (_req, res) => {
  try {
    const db   = getDb();
    const cats = db.prepare(`
      SELECT c.*,
        COUNT(l.id) AS listing_count,
        SUM(CASE WHEN l.status='active' THEN 1 ELSE 0 END) AS active_count
      FROM categories c LEFT JOIN listings l ON l.category_id=c.id
      GROUP BY c.id ORDER BY c.sort_order
    `).all();
    res.json(cats);
  } catch(err) { res.status(500).json({ error: 'Kategoriler yüklenemedi.' }); }
});

router.patch('/categories/:id', (req, res) => {
  try {
    const db   = getDb();
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'İsim zorunludur.' });
    db.prepare('UPDATE categories SET name=?, description=? WHERE id=?').run(name, description || '', req.params.id);
    res.json({ message: 'Kategori güncellendi.' });
  } catch(err) { res.status(500).json({ error: 'Kategori güncellenemedi.' }); }
});

// ================================================================
// SİSTEM BİLGİSİ
// ================================================================
router.get('/system', (_req, res) => {
  try {
  const db = getDb();
  const uptimeSec = process.uptime();
  const h = Math.floor(uptimeSec / 3600);
  const m = Math.floor((uptimeSec % 3600) / 60);

  let dbSizeKB = 0;
  try {
    const dbPath = process.env.DB_PATH || require('path').join(__dirname, '../database/ticarethane.db');
    if (require('fs').existsSync(dbPath)) dbSizeKB = Math.round(require('fs').statSync(dbPath).size / 1024);
  } catch {}

  const uploadDir = require('path').join(__dirname, '../uploads');
  let uploadCount = 0, uploadSizeKB = 0;
  try {
    const files = require('fs').readdirSync(uploadDir);
    uploadCount = files.length;
    uploadSizeKB = Math.round(files.reduce((s, f) => {
      try { return s + require('fs').statSync(require('path').join(uploadDir, f)).size; } catch { return s; }
    }, 0) / 1024);
  } catch {}

  res.json({
    uptime: `${h} saat ${m} dakika`,
    node_version: process.version,
    memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    db_size_kb: dbSizeKB,
    upload_count: uploadCount,
    upload_size_kb: uploadSizeKB,
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
  });
  } catch(err) { res.status(500).json({ error: 'Sistem bilgisi alınamadı.' }); }
});

// ================================================================
// ONE CIKAN ILAN
// ================================================================
router.patch('/listings/:id/feature', (req, res) => {
  try {
    const db = getDb();
    const listing = db.prepare('SELECT id, is_featured FROM listings WHERE id=?').get(req.params.id);
    if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });
    const newState = listing.is_featured ? 0 : 1;
    const until = newState ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
    db.prepare('UPDATE listings SET is_featured=?, featured_until=? WHERE id=?').run(newState, until, req.params.id);
    res.json({ message: newState ? 'Ilan one cikartildi.' : 'One cikartma kaldirildi.', is_featured: newState });
  } catch(err) {
    res.status(500).json({ error: 'İşlem başarısız.' });
  }
});

// ================================================================
// FIRMA DOGRULAMA
// ================================================================
router.patch('/users/:id/verify', (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, is_verified FROM users WHERE id=? AND role!="admin"').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    const newState = user.is_verified ? 0 : 1;
    db.prepare('UPDATE users SET is_verified=? WHERE id=?').run(newState, user.id);
    res.json({ message: newState ? 'Firma dogrulandi.' : 'Dogrulama kaldirildi.', is_verified: newState });
  } catch(err) {
    res.status(500).json({ error: 'İşlem başarısız.' });
  }
});

// ================================================================
// RAPORLAR
// ================================================================
router.get('/reports', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT r.id, r.listing_id, r.reporter_id, r.reason, r.detail, r.status, r.created_at,
        l.title AS listing_title, l.status AS listing_status,
        u.name AS reporter_name, u.email AS reporter_email
      FROM listing_reports r
      LEFT JOIN listings l ON l.id = r.listing_id
      LEFT JOIN users u ON u.id = r.reporter_id
      ORDER BY r.created_at DESC LIMIT 200
    `).all();
    const pending = db.prepare("SELECT COUNT(*) AS n FROM listing_reports WHERE status='pending'").get().n;
    res.json({ reports: rows, pending });
  } catch(err) {
    res.status(500).json({ error: 'Raporlar yüklenemedi.' });
  }
});

router.patch('/reports/:id/resolve', (req, res) => {
  try {
    const db = getDb();
    db.prepare("UPDATE listing_reports SET status='resolved' WHERE id=?").run(req.params.id);
    res.json({ message: 'Rapor kapatıldı.' });
  } catch(err) {
    res.status(500).json({ error: 'Güncelleme başarısız.' });
  }
});


// Global hata yakalayici
router.use(function(err, req, res, _next) {
  console.error("[ADMIN] route error:", err.message);
  res.status(500).json({ error: "Sunucu hatası." });
});

module.exports = router;
