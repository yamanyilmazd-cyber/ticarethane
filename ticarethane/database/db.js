'use strict';

const initSqlJs = require('sql.js');
const path      = require('path');
const fs        = require('fs');
const bcrypt    = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'ticarethane.db');

let _db        = null;
let _dirty     = false;
let _saveTimer = null;

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

function getDb() {
  return dbProxy;
}

async function initDatabase() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const SQL = await initSqlJs({
    locateFile: file => require.resolve(`sql.js/dist/${file}`)
  });

  if (fs.existsSync(DB_PATH)) {
    _db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    _db = new SQL.Database();
  }

  _db.run('PRAGMA foreign_keys = ON');

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      company_name  TEXT,
      email         TEXT    UNIQUE NOT NULL,
      phone         TEXT,
      password_hash TEXT    NOT NULL,
      city          TEXT,
      role          TEXT    DEFAULT 'user',
      is_active     INTEGER DEFAULT 1,
      created_at    TEXT    DEFAULT (datetime('now')),
      updated_at    TEXT    DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      description TEXT,
      sort_order  INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS subcategories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      slug        TEXT    NOT NULL,
      name        TEXT    NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS listings (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL,
      category_id      INTEGER NOT NULL,
      subcategory_id   INTEGER,
      title            TEXT    NOT NULL,
      description      TEXT    NOT NULL,
      listing_type     TEXT    NOT NULL DEFAULT 'sell',
      price            REAL,
      price_type       TEXT    DEFAULT 'negotiable',
      price_unit       TEXT    DEFAULT 'TRY',
      quantity         REAL,
      quantity_unit    TEXT,
      city             TEXT    NOT NULL,
      district         TEXT,
      contact_phone    TEXT,
      contact_email    TEXT,
      website          TEXT,
      status           TEXT    DEFAULT 'pending',
      views            INTEGER DEFAULT 0,
      created_at       TEXT    DEFAULT (datetime('now')),
      updated_at       TEXT    DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS listing_images (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      filename   TEXT    NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT    DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS conversations (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id       INTEGER,
      user1_id         INTEGER NOT NULL,
      user2_id         INTEGER NOT NULL,
      last_message_at  TEXT    DEFAULT (datetime('now')),
      created_at       TEXT    DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id       INTEGER NOT NULL,
      content         TEXT    NOT NULL,
      is_read         INTEGER DEFAULT 0,
      created_at      TEXT    DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS admin_notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER,
      listing_id INTEGER,
      note       TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_listings_city     ON listings(city)`,
    `CREATE INDEX IF NOT EXISTS idx_listings_status   ON listings(status)`,
    `CREATE INDEX IF NOT EXISTS idx_listings_user     ON listings(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_listing_images    ON listing_images(listing_id)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_conv     ON messages(conversation_id)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_sender   ON messages(sender_id)`,
    `CREATE TABLE IF NOT EXISTS listing_tags (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      tag        TEXT    NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_conv_user1        ON conversations(user1_id)`,
    `CREATE INDEX IF NOT EXISTS idx_conv_user2        ON conversations(user2_id)`,
  ];

  tables.forEach(sql => _db.run(sql));

  // Ek performans indexleri (IF NOT EXISTS = güvenli)
  [
    "CREATE INDEX IF NOT EXISTS idx_listings_cat      ON listings(category_id, status)",
    "CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured, status)",
    "CREATE INDEX IF NOT EXISTS idx_notif_user        ON notifications(user_id, is_read, created_at)",
    "CREATE INDEX IF NOT EXISTS idx_favorites_user    ON favorites(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id)",
    "CREATE INDEX IF NOT EXISTS idx_reports_status    ON listing_reports(status, created_at)",
  ].forEach(sql => { try { _db.run(sql); } catch(e) {} });

  // Yeni tablolar (varsa atla)
  [
    `CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, listing_id)
    )`,
    `CREATE TABLE IF NOT EXISTS listing_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reason TEXT NOT NULL,
      detail TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
  ].forEach(sql => _db.run(sql));

  // Migrasyon — price_basis kolonu
  try { _db.run("ALTER TABLE listings ADD COLUMN price_basis TEXT DEFAULT 'per_unit'"); } catch(e) {}
  try { _db.run("ALTER TABLE listings ADD COLUMN currency TEXT DEFAULT 'TRY'"); } catch(e) {}
  try { _db.run("ALTER TABLE listings ADD COLUMN is_featured INTEGER DEFAULT 0"); } catch(e) {}
  try { _db.run("ALTER TABLE listings ADD COLUMN featured_until TEXT"); } catch(e) {}
  try { _db.run("ALTER TABLE listings ADD COLUMN renewed_at TEXT"); } catch(e) {}
  try { _db.run("ALTER TABLE listings ADD COLUMN lot_quantity INTEGER"); } catch(e) {}
  try { _db.run("ALTER TABLE listings ADD COLUMN expires_at TEXT"); } catch(e) {}
  try { _db.run("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0"); } catch(e) {}
  try { _db.run("ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0"); } catch(e) {}
  try { _db.run("ALTER TABLE subcategories ADD COLUMN sort_order INTEGER DEFAULT 0"); } catch(e) {}
  try { _db.run("ALTER TABLE listing_reports ADD COLUMN reason TEXT NOT NULL DEFAULT ''"); } catch(e) {}
  try { _db.run("ALTER TABLE listing_reports ADD COLUMN detail TEXT"); } catch(e) {}
  try { _db.run("ALTER TABLE listings ADD COLUMN rejection_reason TEXT"); } catch(e) {}



  const catCount = dbProxy.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  if (!catCount) {
    seedCategories();
  } else {
    migrateCategories();
  }

  // Admin kullanicisi — .env degisince sifre guncellenir
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ticarethane.com';
  const adminPw    = process.env.ADMIN_PASSWORD || 'Admin123456!';
  const adminHash  = bcrypt.hashSync(adminPw, 12);

  const existingAdmin = dbProxy.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    dbProxy.prepare(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')`
    ).run('Yonetici', adminEmail, adminHash);
    console.log(`[DB] Admin olusturuldu: ${adminEmail}`);
  } else {
    dbProxy.prepare(
      `UPDATE users SET password_hash = ?, role = 'admin' WHERE email = ?`
    ).run(adminHash, adminEmail);
    console.log(`[DB] Admin guncellendi: ${adminEmail}`);
  }

  process.on('exit',    persistDb);
  process.on('SIGINT',  () => { persistDb(); process.exit(0); });
  process.on('SIGTERM', () => { persistDb(); process.exit(0); });

  console.log('[DB] Veritabani hazir.');
}

// Mevcut DB icin migrasyon — imla duzeltmeleri + Diger alt kategorisi
function migrateCategories() {
  const nameFixes = [
    ['Tekstil & Ham Madde', 'Tekstil & Hammadde'],
  ];
  nameFixes.forEach(([old, neu]) => {
    dbProxy.prepare('UPDATE categories SET name = ? WHERE name = ?').run(neu, old);
  });

  const cats = dbProxy.prepare('SELECT id FROM categories').all();
  cats.forEach(cat => {
    const exists = dbProxy.prepare(
      "SELECT id FROM subcategories WHERE category_id = ? AND (name = 'Diğer' OR name = 'Diğer')"
    ).get(cat.id);
    if (!exists) {
      dbProxy.prepare('INSERT INTO subcategories (category_id, slug, name) VALUES (?, ?, ?)')
        .run(cat.id, 'diger', 'Diğer');
    }
  });

  console.log('[DB] Kategori migrasyonu tamamlandi.');
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-')
    .substring(0, 60);
}

function seedCategories() {
  const cats = [
    { slug: 'kimya', name: 'Kimya & Hammadde', desc: 'Soda külü, asit, solvent, boya hammaddesi ve kimyasal ürünler',
      subs: ['Asit & Baz', 'Solvent & Thinner', 'Soda Külü & Sodyum Ürünleri', 'Klorlu Bileşikler', 'Boya Hammaddesi', 'Deterjan Hammaddesi', 'Gübre Kimyasalları', 'Diğer'] },
    { slug: 'demir-celik', name: 'Demir, Çelik & Metal', desc: 'Profil, boru, sac, çelik, alüminyum ve metal ürünler',
      subs: ['HEA/HEB Profil', 'Boru & Tüp', 'Sac & Levha', 'Filmaşin & Tel', 'İnşaat Demiri', 'Alüminyum', 'Bakır', 'Paslanmaz Çelik', 'Hurda Metal', 'Diğer'] },
    { slug: 'tarim-gida', name: 'Tarım & Gıda Hammaddeleri', desc: 'Tahıl, bakliyat, gübre, zirai ilaç ve gıda hammaddeleri',
      subs: ['Tahıl & Hububat', 'Bakliyat', 'Yağlı Tohumlar', 'Gübre', 'Zirai İlaç & Pestisit', 'Fide & Tohum', 'Hayvan Yemi', 'Meyve & Sebze (Toptan)', 'Diğer'] },
    { slug: 'plastik-polimer', name: 'Plastik & Polimer', desc: 'PP, PE, PVC, PET ve diğer plastik hammaddeler',
      subs: ['Polipropilen (PP)', 'Polietilen (PE)', 'PVC', 'PET', 'Polistiren (PS)', 'ABS', 'Naylon & Poliamid', 'Plastik Hurda & Regrind', 'Diğer'] },
    { slug: 'insaat', name: 'İnşaat & Yapı Malzemeleri', desc: 'Çimento, tuğla, seramik, yalıtım ve yapı malzemeleri',
      subs: ['Çimento & Beton', 'Tuğla & Kiremit', 'Yalıtım Malzemeleri', 'Seramik & Fayans', 'Alçıpan & Alçı', 'Dekoratif Malzeme', 'Su Yalıtımı', 'Zemin Malzemeleri', 'Diğer'] },
    { slug: 'tekstil', name: 'Tekstil & Hammadde', desc: 'İplik, kumaş, elyaf ve tekstil hammaddeleri',
      subs: ['Pamuk İpliği', 'Polyester İpliği', 'Viskon & Lyocell', 'Örme Kumaş', 'Dokuma Kumaş', 'Nonwoven', 'Elyaf & Vatka', 'Tekstil Kimyasalları', 'Diğer'] },
    { slug: 'kagit-ambalaj', name: 'Kağıt, Karton & Ambalaj', desc: 'Kraft, karton, ambalaj malzemeleri ve kağıt ürünler',
      subs: ['Oluklu Mukavva', 'Kraft Kağıt', 'Ambalaj Filmi', 'Streç Film', 'Torba & Çuval', 'Etiket & Baskı', 'Beyaz Kağıt', 'Kağıt Hurda', 'Diğer'] },
    { slug: 'enerji-yakit', name: 'Enerji & Yakıt', desc: 'Akaryakıt, doğal gaz, kömür, biyoyakıt ve enerji ürünleri',
      subs: ['Motorin & Mazot', 'Fuel Oil', 'LPG', 'Doğal Gaz', 'Kömür', 'Biyodizel', 'Madeni Yağ', 'Solvent & Nafta', 'Diğer'] },
    { slug: 'maden-mineral', name: 'Maden & Mineral', desc: 'Bor, krom, mermer, kum, çakıl ve mineral ürünler',
      subs: ['Bor Mineralleri', 'Krom Cevheri', 'Mermer & Taş', 'Kum & Çakıl', 'Barit', 'Perlit & Vermikülit', 'Kil & Kaolin', 'Bentonit', 'Diğer'] },
    { slug: 'makina-ekipman', name: 'Makina & Sanayi Ekipmanı', desc: 'Üretim makineleri, sanayi ekipmanları ve yedek parçalar',
      subs: ['Üretim Makinaları', 'Kompresör & Pompa', 'Vinç & Yükleme', 'Jeneratör', 'İsı Değiştirici', 'Filtre Sistemleri', 'CNC & İşleme', 'Yedek Parça', 'Diğer'] },
    { slug: 'elektrik-elektronik', name: 'Elektrik & Elektronik Malzeme', desc: 'Kablo, pano, trafo ve elektrik malzemeleri',
      subs: ['Güç Kablosu', 'Trafo & Kompanzasyon', 'Pano & Şalter', 'Aydınlatma', 'Motor & Sürücü', 'Otomasyon', 'Kablo Raf & Kanal', 'Topraklama', 'Diğer'] },
    { slug: 'ahsap-orman', name: 'Ahşap & Orman Ürünleri', desc: 'Kereste, kontrplak, sunta ve ahşap ürünler',
      subs: ['Kereste', 'Kontrplak', 'Sunta & MDF', 'OSB', 'Parke', 'Mobilya Levhası', 'Yonga & Talaş', 'Orman Ürünleri', 'Diğer'] },
    { slug: 'deri', name: 'Deri & Ham Deri', desc: 'Ham deri, işlenmiş deri ve deri hammaddeleri',
      subs: ['Büyükbaş Ham Deri', 'Küçükbaş Ham Deri', 'Wet-Blue', 'Crust Deri', 'Bitirilmiş Deri', 'Deri Kimyasalları', 'Diğer'] },
    { slug: 'cam-seramik', name: 'Cam & Seramik', desc: 'Düz cam, cam elyaf, seramik hammadde ve ürünler',
      subs: ['Düz Cam', 'Cam Elyaf', 'Seramik Hammadde', 'Refrakter Malzeme', 'Cam Ambalaj', 'Seramik Ürünler', 'Diğer'] },
    { slug: 'lastik-kaucuk', name: 'Lastik & Kauçuk', desc: 'Ham kauçuk, sentetik kauçuk ve lastik ürünler',
      subs: ['Doğal Kauçuk', 'Sentetik Kauçuk', 'Lastik Hurda', 'Kauçuk Profil', 'Köpük & Sünger', 'Silikon Ürünler', 'Diğer'] },
    { slug: 'boya-kaplama', name: 'Boya, Vernik & Kaplama', desc: 'Sanayi boyası, vernik, toz boya ve yüzey kaplama ürünleri',
      subs: ['Sanayi Boyası', 'Toz Boya', 'Vernik & Lake', 'Epoksi Kaplama', 'Astar & Boya Hammaddesi', 'Pigment & Boya Kimyasalları', 'Diğer'] },
    { slug: 'saglik-kimya', name: 'Sağlık & Hijyen Kimyasalları', desc: 'Dezenfektan, sterilizasyon, ilaç hammaddeleri ve hijyen ürünleri',
      subs: ['Dezenfektan & Antiseptik', 'İlaç Hammaddeleri (API)', 'Tıbbi Sarf Malzeme', 'Laboratuvar Kimyasalları', 'Kozmetik Hammadde', 'Diğer'] },
  ];

  cats.forEach(cat => {
    const existing = dbProxy.prepare('SELECT id FROM categories WHERE slug = ?').get(cat.slug);
    let catId;
    if (!existing) {
      const res = dbProxy.prepare(
        'INSERT INTO categories (slug, name, description) VALUES (?, ?, ?)'
      ).run(cat.slug, cat.name, cat.desc);
      catId = res.lastInsertRowid;
    } else {
      catId = existing.id;
    }
    cat.subs.forEach(subName => {
      const subSlug = slugify(subName);
      const existSub = dbProxy.prepare(
        'SELECT id FROM subcategories WHERE category_id = ? AND slug = ?'
      ).get(catId, subSlug);
      if (!existSub) {
        dbProxy.prepare(
          'INSERT INTO subcategories (category_id, slug, name) VALUES (?, ?, ?)'
        ).run(catId, subSlug, subName);
      }
    });
  });

  console.log('[DB] Kategoriler seed edildi.');
}

module.exports = { initDatabase, getDb };
