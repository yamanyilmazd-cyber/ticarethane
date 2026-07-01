'use strict';

const initSqlJs = require('sql.js');
const path      = require('path');
const fs        = require('fs');
const bcrypt    = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'ticarethane.db');

// Turso HTTP API (Node 18 built-in fetch — no native modules needed)
const TURSO_URL   = (process.env.TURSO_URL || '').replace(/^libsql:\/\//, 'https://');
const TURSO_TOKEN = process.env.TURSO_TOKEN || '';

let _db           = null;
let _dirty        = false;
let _saveTimer    = null;
let _tursoReady   = false;   // true after background restore completes
let _initComplete = false;   // true after initDatabase() finishes
let _tursoQueue   = [];      // runtime writes queued before Turso is ready

// ── Turso HTTP yardımcıları ────────────────────────────────────────────────
function buildArgs(params) {
  return (params || []).map(a => {
    if (a === null || a === undefined) return { type: 'null' };
    if (typeof a === 'number') {
      return Number.isInteger(a)
        ? { type: 'integer', value: String(a) }
        : { type: 'float',   value: String(a) };
    }
    return { type: 'text', value: String(a) };
  });
}

async function tursoHttp(sql, params, timeoutMs) {
  if (!TURSO_URL || !TURSO_TOKEN) return null;
  try {
    const signal = AbortSignal.timeout(timeoutMs || 10000);
    const res = await fetch(`${TURSO_URL}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TURSO_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql, args: buildArgs(params) } },
          { type: 'close' }
        ]
      }),
      signal
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    const result = data.results?.[0];
    if (result?.type === 'error') throw new Error(result.error?.message || 'Turso error');
    const cols = (result?.response?.result?.cols || []).map(c => c.name);
    const rows = (result?.response?.result?.rows || []).map(row => {
      const obj = {};
      cols.forEach((col, i) => {
        const v = row[i];
        obj[col] = (v === null || v?.type === 'null') ? null : (v?.value ?? null);
      });
      return obj;
    });
    return { cols, rows };
  } catch(e) {
    console.error('[TURSO] HTTP hatası:', e.message);
    return null;
  }
}

// fire-and-forget — sadece DML (INSERT/UPDATE/DELETE)
function tursoWrite(sql, params) {
  const t = sql.trim().toUpperCase();
  if (t.startsWith('SELECT') || t.startsWith('PRAGMA') ||
      t.startsWith('CREATE') || t.startsWith('DROP') ||
      t.startsWith('ALTER')  || t.startsWith('BEGIN') ||
      t.startsWith('COMMIT') || t.startsWith('ROLLBACK')) return;
  if (_tursoReady) {
    tursoHttp(sql, params, 8000).catch(() => {});
  } else if (_initComplete) {
    // Runtime write during Turso restore window — queue for later
    _tursoQueue.push({ sql, params });
  }
  // Startup writes (_initComplete=false) are intentionally skipped
}

// ── sql.js kalıcı kayıt ─────────────────────────────────────────────────────
function persistDb() {
  if (!_db || !_dirty) return;
  try {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    _dirty = false;
  } catch (e) {
    console.error('[DB] Kayit hatasi:', e.message);
  }
}

function scheduleSave() {
  _dirty = true;
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => { persistDb(); _saveTimer = null; }, 1000);
}

// ── Statement (sql.js üzerine ince sarmalayıcı) ────────────────────────────
class Statement {
  constructor(sql) { this._sql = sql; }

  _params(args) {
    if (args.length === 1 && Array.isArray(args[0])) return args[0];
    return args;
  }

  get(...args) {
    const stmt = _db.prepare(this._sql);
    try {
      const params = this._params(args);
      if (params.length) stmt.bind(params);
      if (!stmt.step()) return undefined;
      return stmt.getAsObject();
    } finally {
      stmt.free();
    }
  }

  all(...args) {
    const rows = [];
    const stmt = _db.prepare(this._sql);
    try {
      const params = this._params(args);
      if (params.length) stmt.bind(params);
      while (stmt.step()) rows.push(stmt.getAsObject());
    } finally {
      stmt.free();
    }
    return rows;
  }

  run(...args) {
    const params = this._params(args);
    _db.run(this._sql, params);
    const res = _db.exec('SELECT last_insert_rowid() AS id');
    const lastInsertRowid = res[0]?.values[0][0] ?? 0;
    scheduleSave();
    tursoWrite(this._sql, params);
    return { lastInsertRowid };
  }
}

const dbProxy = {
  prepare(sql) { return new Statement(sql); },
  exec(sql)    { _db.run(sql); scheduleSave(); },
  pragma()     {},
  transaction(fn) {
    return (...args) => {
      _db.run('BEGIN');
      try {
        const r = fn(...args);
        _db.run('COMMIT');
        scheduleSave();
        return r;
      } catch (e) {
        _db.run('ROLLBACK');
        throw e;
      }
    };
  }
};

function getDb() { return dbProxy; }

// ── Yerel şema DDL ─────────────────────────────────────────────────────────
const SCHEMA_DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, company_name TEXT,
    email TEXT UNIQUE NOT NULL, phone TEXT, password_hash TEXT NOT NULL,
    city TEXT, role TEXT DEFAULT 'user', is_active INTEGER DEFAULT 1,
    is_verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL, description TEXT, sort_order INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER NOT NULL,
    slug TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL, subcategory_id INTEGER, title TEXT NOT NULL,
    description TEXT NOT NULL, listing_type TEXT NOT NULL DEFAULT 'sell',
    price REAL, price_type TEXT DEFAULT 'negotiable', price_unit TEXT DEFAULT 'TRY',
    price_basis TEXT DEFAULT 'per_unit', currency TEXT DEFAULT 'TRY',
    quantity REAL, quantity_unit TEXT, lot_quantity INTEGER,
    city TEXT NOT NULL, district TEXT, contact_phone TEXT, contact_email TEXT,
    website TEXT, status TEXT DEFAULT 'pending', rejection_reason TEXT,
    is_featured INTEGER DEFAULT 0, featured_until TEXT,
    views INTEGER DEFAULT 0, expires_at TEXT, renewed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS listing_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER NOT NULL,
    filename TEXT NOT NULL, sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER,
    user1_id INTEGER NOT NULL, user2_id INTEGER NOT NULL,
    last_message_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL, content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, listing_id))`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    type TEXT NOT NULL, title TEXT NOT NULL, body TEXT, link TEXT,
    is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS listing_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER NOT NULL,
    reporter_id INTEGER, reason TEXT NOT NULL DEFAULT '', detail TEXT,
    status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS listing_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER NOT NULL,
    tag TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS admin_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, listing_id INTEGER,
    note TEXT NOT NULL, created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_listings_city     ON listings(city)`,
  `CREATE INDEX IF NOT EXISTS idx_listings_status   ON listings(status)`,
  `CREATE INDEX IF NOT EXISTS idx_listings_user     ON listings(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_listing_images    ON listing_images(listing_id)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conv     ON messages(conversation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_conv_user1        ON conversations(user1_id)`,
  `CREATE INDEX IF NOT EXISTS idx_conv_user2        ON conversations(user2_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notif_user        ON notifications(user_id, is_read, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_favorites_user    ON favorites(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id)`,
];

// ── Turso arka plan başlatma (sunucu başladıktan sonra) ────────────────────
async function initTursoBackground() {
  if (!TURSO_URL || !TURSO_TOKEN) return;

  // Sunucunun tamamen başlaması için kısa bekleme
  await new Promise(r => setTimeout(r, 1500));

  console.log('[TURSO] Arka plan başlatma başlıyor...');

  // Şema
  for (const sql of SCHEMA_DDL) {
    if (sql.startsWith('CREATE INDEX') || sql.startsWith('CREATE TABLE')) {
      const r = await tursoHttp(sql, [], 15000);
      if (!r && sql.includes('TABLE')) console.warn('[TURSO] Tablo oluşturulamadı.');
    }
  }
  console.log('[TURSO] Şema hazır.');

  // Restore
  let userCount = 0;
  try {
    const r = await tursoHttp('SELECT COUNT(*) AS c FROM users', [], 10000);
    userCount = Number(r?.rows?.[0]?.c || 0);
  } catch(e) {
    console.warn('[TURSO] Kullanıcı sayısı alınamadı:', e?.message);
  }

  if (userCount > 0) {
    console.log(`[TURSO] ${userCount} kullanıcı bulundu, restore başlıyor...`);
    _db.run('PRAGMA foreign_keys = OFF');

    const tables = [
      'users', 'categories', 'subcategories', 'listings', 'listing_images',
      'conversations', 'messages', 'favorites', 'notifications',
      'listing_reports', 'password_reset_tokens', 'listing_tags', 'admin_notes'
    ];

    let totalRows = 0;
    for (const table of tables) {
      const r = await tursoHttp(`SELECT * FROM ${table}`, [], 20000);
      if (!r || r.rows.length === 0) continue;
      const { cols, rows } = r;
      const placeholders = cols.map(() => '?').join(', ');
      const insertSql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
      for (const row of rows) {
        const vals = cols.map(c => row[c]);
        try { _db.run(insertSql, vals); } catch(e2) {
          console.warn(`[TURSO] ${table} satır hatası:`, e2.message);
        }
      }
      totalRows += rows.length;
      console.log(`[TURSO] ${table}: ${rows.length} satır`);
    }

    _db.run('PRAGMA foreign_keys = ON');
    console.log(`[TURSO] Restore tamamlandı — ${totalRows} satır.`);
  } else {
    console.log('[TURSO] Restore edilecek veri yok.');
  }

  _tursoReady = true;
  // Flush writes that were queued during restore window
  if (_tursoQueue.length > 0) {
    console.log(`[TURSO] ${_tursoQueue.length} bekleyen yazma işlemi gönderiliyor...`);
    for (const { sql, params } of _tursoQueue) {
      tursoHttp(sql, params, 8000).catch(() => {});
    }
    _tursoQueue = [];
  }
  console.log('[TURSO] Hazır. Çift yazma aktif.');
}

// ── Ana başlatma fonksiyonu ─────────────────────────────────────────────────
async function initDatabase() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const SQL = await initSqlJs({
    locateFile: file => require.resolve(`sql.js/dist/${file}`)
  });

  _db = new SQL.Database();
  _db.run('PRAGMA foreign_keys = ON');

  // Yerel şema (senkron, hızlı)
  SCHEMA_DDL.forEach(sql => _db.run(sql));

  // Kategorileri seed et
  const catCount = dbProxy.prepare('SELECT COUNT(*) AS c FROM categories').get();
  if (!catCount || !catCount.c) {
    seedCategories();
  } else {
    migrateCategories();
  }

  // Admin kullanicisi
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPw    = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPw) throw new Error('[FATAL] ADMIN_EMAIL and ADMIN_PASSWORD must be set.');

  const existingAdmin = dbProxy.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    dbProxy.prepare(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')`
    ).run('Yonetici', adminEmail, adminHash);
    console.log(`[DB] Admin oluşturuldu: ${adminEmail}`);
  } else {
    dbProxy.prepare(
      `UPDATE users SET password_hash = ?, role = 'admin' WHERE email = ?`
    ).run(adminHash, adminEmail);
    console.log(`[DB] Admin güncellendi: ${adminEmail}`);
  }

  process.on('exit',    persistDb);
  process.on('SIGINT',  () => { persistDb(); process.exit(0); });
  process.on('SIGTERM', () => { persistDb(); process.exit(0); });

  // Turso arka planda — sunucu önce başlasın
  const tursoEnabled = !!(TURSO_URL && TURSO_TOKEN);
  if (tursoEnabled) {
    initTursoBackground().catch(e => console.error('[TURSO] Arka plan hatası:', e.message));
  }

  _initComplete = true; // Artık runtime yazmaları kuyruğa alınabilir
  console.log('[DB] Veritabanı hazır' + (tursoEnabled ? ' (Turso arka planda)' : ' (yerel mod)') + '.');
}

// ── Kategori yardımcıları ──────────────────────────────────────────────────
function migrateCategories() {
  [['Tekstil & Ham Madde', 'Tekstil & Hammadde']].forEach(([old, neu]) => {
    dbProxy.prepare('UPDATE categories SET name = ? WHERE name = ?').run(neu, old);
  });
  const cats = dbProxy.prepare('SELECT id FROM categories').all();
  cats.forEach(cat => {
    const exists = dbProxy.prepare(
      "SELECT id FROM subcategories WHERE category_id = ? AND name = 'Diğer'"
    ).get(cat.id);
    if (!exists) dbProxy.prepare('INSERT INTO subcategories (category_id, slug, name) VALUES (?, ?, ?)')
      .run(cat.id, 'diger', 'Diğer');
  });
  console.log('[DB] Kategori migrasyonu tamamlandı.');
}

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').replace(/--+/g, '-').substring(0, 60);
}

function seedCategories() {
  const cats = [
    { slug: 'kimya', name: 'Kimya & Hammadde', desc: 'Soda külü, asit, solvent, boya hammaddesi ve kimyasal ürünler',
      subs: ['Asit & Baz', 'Solvent & Thinner', 'Soda Külü & Sodyum Ürünleri', 'Klorlu Bileşikler', 'Boya Hammaddesi', 'Deterjan Hammaddesi', 'Gøbre Kimyasalları', 'Diğer'] },
    { slug: 'demir-celik', name: 'Demir, Çelik & Metal', desc: 'Profil, boru, sac, çelik, aløminyum ve metal ørønler',
      subs: ['HEA/HEB Profil', 'Boru & Tüp', 'Sac & Levha', 'Filmaşin & Tel', 'İnşaat Demiri', 'Aløminyum', 'Bakır', 'Paslanmaz Çelik', 'Hurda Metal', 'Diğer'] },
    { slug: 'tarim-gida', name: 'Tarım & Gıda Hammaddeleri', desc: 'Tahıl, bakliyat, gøbre, zirai ilaç ve gıda hammaddeleri',
      subs: ['Tahıl & Hububat', 'Bakliyat', 'Yağlı Tohumlar', 'Gøbre', 'Zirai İlaç & Pestisit', 'Fide & Tohum', 'Hayvan Yemi', 'Meyve & Sebze (Toptan)', 'Diğer'] },
    { slug: 'plastik-polimer', name: 'Plastik & Polimer', desc: 'PP, PE, PVC, PET ve diğer plastik hammaddeler',
      subs: ['Polipropilen (PP)', 'Polietilen (PE)', 'PVC', 'PET', 'Polistiren (PS)', 'ABS', 'Naylon & Poliamid', 'Plastik Hurda & Regrind', 'Diğer'] },
    { slug: 'insaat', name: 'İnşaat & Yapı Malzemeleri', desc: 'Çimento, tuğla, seramik, yalıtım ve yapı malzemeleri',
      subs: ['Çimento & Beton', 'Tuğla & Kiremit', 'Yalıtım Malzemeleri', 'Seramik & Fayans', 'Alçıpan & Alçı', 'Dekoratif Malzeme', 'Su Yalıtımı', 'Zemin Malzemeleri', 'Diğer'] },
    { slug: 'tekstil', name: 'Tekstil & Hammadde', desc: 'İplik, kumaş, elyaf ve tekstil hammaddeleri',
      subs: ['Pamuk İpliği', 'Polyester İpliği', 'Viskon & Lyocell', 'Örme Kumaş', 'Dokuma Kumaş', 'Nonwoven', 'Elyaf & Vatka', 'Tekstil Kimyasalları', 'Diğer'] },
    { slug: 'kagit-ambalaj', name: 'Kağıt, Karton & Ambalaj', desc: 'Kraft, karton, ambalaj malzemeleri ve kağıt ørønler',
      subs: ['Oluklu Mukavva', 'Kraft Kağıt', 'Ambalaj Filmi', 'Streç Film', 'Torba & Çuval', 'Etiket & Baskı', 'Beyaz Kağıt', 'Kağıt Hurda', 'Diğer'] },
    { slug: 'enerji-yakit', name: 'Enerji & Yakıt', desc: 'Akaryakıt, doğal gaz, kömür, biyoyakıt ve enerji ørønleri',
      subs: ['Motorin & Mazot', 'Fuel Oil', 'LPG', 'Doğal Gaz', 'Kömür', 'Biyodizel', 'Madeni Yağ', 'Solvent & Nafta', 'Diğer'] },
    { slug: 'maden-mineral', name: 'Maden & Mineral', desc: 'Bor, krom, mermer, kum, çakıl ve mineral ørønler',
      subs: ['Bor Mineralleri', 'Krom Cevheri', 'Mermer & Taş', 'Kum & Çakıl', 'Barit', 'Perlit & Vermikølit', 'Kil & Kaolin', 'Bentonit', 'Diğer'] },
    { slug: 'makina-ekipman', name: 'Makina & Sanayi Ekipmanı', desc: 'Üretim makineleri, sanayi ekipmanları ve yedek parçalar',
      subs: ['Üretim Makinaları', 'Kompresör & Pompa', 'Vinç & Yükleme', 'Jeneratör', 'İsı Değiştirici', 'Filtre Sistemleri', 'CNC & İşleme', 'Yedek Parça', 'Diğer'] },
    { slug: 'elektrik-elektronik', name: 'Elektrik & Elektronik Malzeme', desc: 'Kablo, pano, trafo ve elektrik malzemeleri',
      subs: ['Güç Kablosu', 'Trafo & Kompanzasyon', 'Pano & Şalter', 'Aydınlatma', 'Motor & Sørøcø', 'Otomasyon', 'Kablo Raf & Kanal', 'Topraklama', 'Diğer'] },
    { slug: 'ahsap-orman', name: 'Ahşap & Orman Ürünleri', desc: 'Kereste, kontrplak, sunta ve ahşap ørønler',
      subs: ['Kereste', 'Kontrplak', 'Sunta & MDF', 'OSB', 'Parke', 'Mobilya Levhası', 'Yonga & Talaş', 'Orman Ürünleri', 'Diğer'] },
    { slug: 'deri', name: 'Deri & Ham Deri', desc: 'Ham deri, işlenmiş deri ve deri hammaddeleri',
      subs: ['Bøyøkbaş Ham Deri', 'Køçøkbaş Ham Deri', 'Wet-Blue', 'Crust Deri', 'Bitirilmiş Deri', 'Deri Kimyasalları', 'Diğer'] },
    { slug: 'cam-seramik', name: 'Cam & Seramik', desc: 'Døz cam, cam elyaf, seramik hammadde ve ørønler',
      subs: ['Døz Cam', 'Cam Elyaf', 'Seramik Hammadde', 'Refrakter Malzeme', 'Cam Ambalaj', 'Seramik Ürünler', 'Diğer'] },
    { slug: 'lastik-kaucuk', name: 'Lastik & Kauçuk', desc: 'Ham kauçuk, sentetik kauçuk ve lastik ørønler',
      subs: ['Doğal Kauçuk', 'Sentetik Kauçuk', 'Lastik Hurda', 'Kauçuk Profil', 'Köpøk & Sønger', 'Silikon Ürünler', 'Diğer'] },
    { slug: 'boya-kaplama', name: 'Boya, Vernik & Kaplama', desc: 'Sanayi boyası, vernik, toz boya ve yøzey kaplama ørønleri',
      subs: ['Sanayi Boyası', 'Toz Boya', 'Vernik & Lake', 'Epoksi Kaplama', 'Astar & Boya Hammaddesi', 'Pigment & Boya Kimyasalları', 'Diğer'] },
    { slug: 'saglik-kimya', name: 'Sağlık & Hijyen Kimyasalları', desc: 'Dezenfektan, sterilizasyon, ilaç hammaddeleri ve hijyen ørønleri',
      subs: ['Dezenfektan & Antiseptik', 'İlaç Hammaddeleri (API)', 'Tıbbi Sarf Malzeme', 'Laboratuvar Kimyasalları', 'Kozmetik Hammadde', 'Diğer'] },
  ];

  cats.forEach(cat => {
    const existing = dbProxy.prepare('SELECT id FROM categories WHERE slug = ?').get(cat.slug);
    let catId;
    if (!existing) {
      const res = dbProxy.prepare('INSERT INTO categories (slug, name, description) VALUES (?, ?, ?)').run(cat.slug, cat.name, cat.desc);
      catId = res.lastInsertRowid;
    } else {
      catId = existing.id;
    }
    cat.subs.forEach(subName => {
      const subSlug = slugify(subName);
      const existSub = dbProxy.prepare('SELECT id FROM subcategories WHERE category_id = ? AND slug = ?').get(catId, subSlug);
      if (!existSub) dbProxy.prepare('INSERT INTO subcategories (category_id, slug, name) VALUES (?, ?, ?)').run(catId, subSlug, subName);
    });
  });
  console.log('[DB] Kategoriler seed edildi.');
}

module.exports = { initDatabase, getDb };
