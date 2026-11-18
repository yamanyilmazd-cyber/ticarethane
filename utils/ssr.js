'use strict';

// ================================================================
// SEO: sunucu tarafi sayfa uretimi ("SSR-lite")
// ----------------------------------------------------------------
// Uygulama hala tek sayfalik (SPA) — arayuzu public/js/app.js ciziyor.
// Bu modul her gercek URL icin (/ilan/12-kask, /kategori/kimya ...)
// index.html sablonunu alip:
//   1) <!--seo:start-->...<!--seo:end--> arasina sayfaya ozel title,
//      description, canonical, robots, Open Graph ve JSON-LD yazar,
//   2) <!--ssr:start-->...<!--ssr:end--> arasina H1 + taranabilir icerik
//      (ilan bilgileri, ilan linkleri) koyar,
//   3) dogru HTTP durum kodunu dondurur (200 / 301 / 404 / 410).
// app.js yuklenince <main> icerigi zaten uygulama arayuzuyle degisir.
// ================================================================

const fs = require('fs');
const path = require('path');
const { getDb } = require('../database/db');
const { slugify, listingPath } = require('./slug');

const BASE = 'https://www.toptango.com.tr';
const TEMPLATE_PATH = path.join(__dirname, '..', 'public', 'index.html');
const DEFAULT_TITLE = 'Toptango | Ticari Mal ve Hammadde İlan Platformu';
const DEFAULT_DESC = 'Türkiye genelinde toptan ticari mal, hammadde ve sanayi ürünü alım-satım ilanları. Kimya, demir-çelik, tarım, plastik ve daha fazlası; ücretsiz, komisyonsuz.';
const DEFAULT_OG_IMAGE = BASE + '/og-image.png';
const isProd = process.env.NODE_ENV === 'production';

let _tpl = null;
function template() {
  if (!_tpl || !isProd) _tpl = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  return _tpl;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function jsonLd(obj) {
  return '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, '\\u003c') + '</script>';
}
function truncate(s, max) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:–-]+$/, '') + '…';
}
function day(d) { return d ? String(d).slice(0, 10) : null; }

const CURRENCY_SYMBOL = { TRY: '₺', USD: '$', EUR: '€' };
function priceText(l) {
  const p = parseFloat(l.price);
  if (!(p > 0)) return 'Fiyat sorunuz';
  const sym = CURRENCY_SYMBOL[l.currency] || '';
  let t = sym + p.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  if (l.price_basis === 'total') t += ' (toplam)';
  else if (l.quantity_unit) t += ' / ' + l.quantity_unit;
  if (l.price_type === 'negotiable') t += ', pazarlıklı';
  return t;
}
function typeLabel(l) { return l.listing_type === 'buy' ? 'Alınır' : 'Satılır'; }
function imageUrl(filename) { return BASE + '/uploads/' + encodeURIComponent(filename); }

// ----------------------------------------------------------------
// Sayfayi sablona yerlestir ve gonder
// ----------------------------------------------------------------
function send(res, page, status) {
  const title = page.title || DEFAULT_TITLE;
  const desc = page.description || DEFAULT_DESC;
  const robots = page.robots || 'index, follow';
  const ogImage = page.ogImage || DEFAULT_OG_IMAGE;
  const head = [
    '<title>' + esc(title) + '</title>',
    '<meta name="description" content="' + esc(desc) + '" />',
    '<meta name="robots" content="' + robots + '" />',
    page.canonical ? '<link rel="canonical" href="' + esc(page.canonical) + '" />' : '',
    '<meta property="og:type" content="' + (page.ogType || 'website') + '" />',
    page.canonical ? '<meta property="og:url" content="' + esc(page.canonical) + '" />' : '',
    '<meta property="og:title" content="' + esc(page.ogTitle || title) + '" />',
    '<meta property="og:description" content="' + esc(desc) + '" />',
    '<meta property="og:image" content="' + esc(ogImage) + '" />',
    ogImage === DEFAULT_OG_IMAGE ? '<meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />' : '',
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:image" content="' + esc(ogImage) + '" />',
    ...(page.jsonld || []).map(jsonLd),
  ].filter(Boolean).join('\n  ');

  const body =
    '<section class="section home-intro"><div class="container">' +
      '<h1 class="home-intro-title">' + esc(page.h1 || 'Toptango') + '</h1>' +
      (page.intro ? '<p class="home-intro-text">' + esc(page.intro) + '</p>' : '') +
      (page.html ? '<div class="ssr-content">' + page.html + '</div>' : '') +
      '<div class="page-loading"><div class="spinner"></div></div>' +
    '</div></section>';

  const html = template()
    .replace(/<!--seo:start[\s\S]*?<!--seo:end-->/, () => head)
    .replace(/<!--ssr:start-->[\s\S]*?<!--ssr:end-->/, () => body);

  res.status(status || 200);
  res.setHeader('Cache-Control', 'no-cache');
  res.type('html').send(html);
}

function listingLinksHTML(rows, heading) {
  if (!rows.length) return '';
  return (heading ? '<h2>' + esc(heading) + '</h2>' : '') + '<ul>' + rows.map(l =>
    '<li><a href="' + listingPath(l) + '">' + esc(l.title) + '</a> — ' +
    esc(typeLabel(l)) + ', ' + esc(priceText(l)) + (l.city ? ', ' + esc(l.city) : '') + '</li>'
  ).join('') + '</ul>';
}
function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => Object.assign(
      { '@type': 'ListItem', position: i + 1, name: it.name },
      it.url ? { item: it.url } : {}
    )),
  };
}

const LISTING_COLS = `l.id, l.title, l.price, l.price_type, l.price_basis, l.currency, l.quantity, l.quantity_unit,
  l.city, l.listing_type, l.updated_at`;

// ----------------------------------------------------------------
// Sayfa tipleri
// ----------------------------------------------------------------
function pageHome(db) {
  const cats = db.prepare(
    `SELECT c.slug, c.name, (SELECT COUNT(*) FROM listings l WHERE l.category_id = c.id AND l.status='active') AS n
     FROM categories c ORDER BY c.sort_order ASC`).all();
  const latest = db.prepare(
    `SELECT ${LISTING_COLS} FROM listings l WHERE l.status='active' ORDER BY l.created_at DESC LIMIT 24`).all();
  return {
    canonical: BASE + '/',
    h1: "Türkiye'nin ticari mal ve hammadde ilan platformu",
    intro: "Toptango, toptan ticari mal, hammadde ve sanayi ürünü alıcılarını ve satıcılarını sektörel kategorilerde buluşturan bir B2B ilan platformudur. Satış (Satılır) ve alım (Alınır) ilanı vermek ücretsizdir; satışlardan komisyon alınmaz. Türkiye'nin 81 ilinden ilanlara ulaşabilir, satıcılarla platform içinden mesajlaşabilirsiniz.",
    html: '<h2>Sektörler</h2><ul>' + cats.map(c =>
      '<li><a href="/kategori/' + esc(c.slug) + '">' + esc(c.name) + '</a> (' + c.n + ' ilan)</li>').join('') + '</ul>' +
      listingLinksHTML(latest, 'Son İlanlar'),
  };
}

function pageCategory(db, slug) {
  const cat = db.prepare('SELECT id, slug, name, description FROM categories WHERE slug = ?').get(slug);
  if (!cat) return null;
  const rows = db.prepare(
    `SELECT ${LISTING_COLS} FROM listings l WHERE l.status='active' AND l.category_id = ?
     ORDER BY l.is_featured DESC, l.created_at DESC LIMIT 100`).all(cat.id);
  const subs = db.prepare('SELECT name FROM subcategories WHERE category_id = ? ORDER BY sort_order ASC').all(cat.id);
  const url = BASE + '/kategori/' + cat.slug;
  const descBase = cat.description ? cat.description.replace(/\.?\s*$/, '.') + ' ' : '';
  const jsonld = [breadcrumbLd([{ name: 'Ana Sayfa', url: BASE + '/' }, { name: cat.name, url }])];
  if (rows.length) {
    jsonld.push({
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Toptan ' + cat.name + ' İlanları',
      itemListElement: rows.slice(0, 50).map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: BASE + listingPath(l), name: l.title })),
    });
  }
  return {
    title: 'Toptan ' + cat.name + ' İlanları | Toptango',
    description: truncate(descBase + (rows.length
      ? rows.length + ' aktif toptan ' + cat.name.toLocaleLowerCase('tr-TR') + ' alım-satım ilanı. Ücretsiz ilan verin, satıcılarla doğrudan iletişime geçin.'
      : 'Toptan ' + cat.name.toLocaleLowerCase('tr-TR') + ' alım-satım ilanları. Bu sektörde ilk ilanı ücretsiz verin.'), 158),
    canonical: url,
    // Bos kategori sayfasi "ince icerik" — ilan gelene kadar dizine eklenmesin
    robots: rows.length ? 'index, follow' : 'noindex, follow',
    h1: 'Toptan ' + cat.name + ' İlanları',
    intro: cat.description || '',
    html: '<nav><a href="/">Ana Sayfa</a> / ' + esc(cat.name) + '</nav>' +
      (subs.length ? '<p>Alt kategoriler: ' + subs.map(s => esc(s.name)).join(', ') + '</p>' : '') +
      (rows.length ? listingLinksHTML(rows, 'İlanlar') : '<p>Bu sektörde henüz aktif ilan yok.</p>'),
    jsonld,
  };
}

// { redirect } | { gone } | page | null
function pageListing(db, idSlug, reqPath) {
  const id = parseInt(idSlug, 10);
  if (!Number.isFinite(id) || String(id) !== String(idSlug).split('-')[0]) return null;
  const l = db.prepare(
    `SELECT l.*, c.name AS category_name, c.slug AS category_slug, sc.name AS subcategory_name,
            u.company_name, u.id AS seller_id
     FROM listings l
     LEFT JOIN categories c ON l.category_id = c.id
     LEFT JOIN subcategories sc ON l.subcategory_id = sc.id
     LEFT JOIN users u ON l.user_id = u.id
     WHERE l.id = ?`).get(id);
  if (!l) return null;
  if (l.status !== 'active') return { gone: ['expired', 'sold', 'rejected'].includes(l.status) };
  const canonicalPath = listingPath(l);
  if (reqPath !== canonicalPath) return { redirect: canonicalPath };

  const images = db.prepare('SELECT filename FROM listing_images WHERE listing_id = ? ORDER BY sort_order').all(l.id);
  const url = BASE + canonicalPath;
  const catUrl = l.category_slug ? BASE + '/kategori/' + l.category_slug : null;
  const qty = l.quantity ? (parseFloat(l.quantity).toLocaleString('tr-TR') + ' ' + (l.quantity_unit || '')).trim() : '';
  const desc = String(l.description || '').replace(/\s+/g, ' ').trim();
  const metaDesc = desc.length >= 80
    ? truncate(desc, 158)
    : truncate(l.title + ' – ' + typeLabel(l) + ' ilanı' + (l.city ? ', ' + l.city : '') + (qty ? ', ' + qty : '') +
        '. ' + priceText(l) + '. ' + (desc ? desc.replace(/[.!?…]?$/, '.') + ' ' : '') + "Toptango'da toptan " + (l.category_name || 'ticari mal') + ' ilanı.', 158);

  const jsonld = [breadcrumbLd([
    { name: 'Ana Sayfa', url: BASE + '/' },
    ...(catUrl ? [{ name: l.category_name, url: catUrl }] : []),
    { name: l.title },
  ])];
  // Product yalnizca satis ilaninda ve gorsel varsa (Google'in Product icin beklentisi).
  if (l.listing_type !== 'buy' && images.length) {
    const product = {
      '@context': 'https://schema.org', '@type': 'Product', '@id': url + '#product',
      name: l.title, description: truncate(desc || l.title, 500),
      image: images.slice(0, 5).map(i => imageUrl(i.filename)),
      category: l.subcategory_name || l.category_name || undefined,
    };
    const price = parseFloat(l.price);
    if (price > 0 && CURRENCY_SYMBOL[l.currency]) {
      product.offers = {
        '@type': 'Offer', url, price: String(price), priceCurrency: l.currency,
        availability: 'https://schema.org/InStock',
        ...(l.company_name ? { seller: { '@type': 'Organization', name: l.company_name } } : {}),
      };
    }
    jsonld.push(product);
  }

  const row = (k, v) => v ? '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>' : '';
  return {
    title: l.title + (l.city ? ' – ' + l.city : '') + ' | Toptango',
    ogTitle: l.title,
    description: metaDesc,
    canonical: url,
    ogImage: images.length ? imageUrl(images[0].filename) : null,
    h1: l.title,
    html:
      '<nav><a href="/">Ana Sayfa</a>' + (catUrl ? ' / <a href="/kategori/' + esc(l.category_slug) + '">' + esc(l.category_name) + '</a>' : '') + '</nav>' +
      (desc ? '<p>' + esc(desc) + '</p>' : '') +
      '<dl>' +
        row('İlan türü', typeLabel(l)) + row('Fiyat', priceText(l)) + row('Miktar', qty) +
        row('Sektör', l.category_name) + row('Alt kategori', l.subcategory_name) +
        row('Konum', [l.city, l.district].filter(Boolean).join(' / ')) +
        row('İlan tarihi', day(l.created_at)) +
      '</dl>' +
      (l.seller_id ? '<p><a href="/satici/' + l.seller_id + '">' + esc(l.company_name || 'Satıcının') + ' tüm ilanları</a></p>' : ''),
    jsonld,
  };
}

function pageSeller(db, userId) {
  const id = parseInt(userId, 10);
  if (!Number.isFinite(id) || String(id) !== String(userId)) return null;
  const u = db.prepare("SELECT id, name, company_name, city FROM users WHERE id = ? AND is_active = 1 AND role != 'admin'").get(id);
  if (!u) return null;
  const rows = db.prepare(
    `SELECT ${LISTING_COLS} FROM listings l WHERE l.status='active' AND l.user_id = ? ORDER BY l.created_at DESC LIMIT 100`).all(id);
  const name = u.company_name || u.name || 'Firma';
  return {
    title: name + ' İlanları | Toptango',
    description: truncate(name + (u.city ? ' (' + u.city + ')' : '') + ' firmasının Toptango\'daki ' + rows.length + ' aktif toptan ticari mal ve hammadde ilanı.', 158),
    canonical: BASE + '/satici/' + id,
    robots: rows.length ? 'index, follow' : 'noindex, follow',
    h1: name + ' İlanları',
    html: rows.length ? listingLinksHTML(rows) : '<p>Aktif ilan bulunamadı.</p>',
  };
}

function pageVitrin(db) {
  const rows = db.prepare(
    `SELECT ${LISTING_COLS} FROM showcase_listings s JOIN listings l ON l.id = s.listing_id AND l.status='active'
     ORDER BY l.is_featured DESC, s.created_at DESC LIMIT 60`).all();
  return {
    title: 'Vitrin – Öne Çıkan Toptan İlanlar | Toptango',
    description: 'Toptango ekibinin seçtiği öne çıkan toptan ticari mal, hammadde ve sanayi ürünü ilanları.',
    canonical: BASE + '/vitrin',
    h1: 'Vitrin: Öne Çıkan İlanlar',
    html: listingLinksHTML(rows),
  };
}

// Bilgi / yasal sayfalar: [title, description, h1]
const STATIC_PAGES = {
  '/hakkimizda': ['Hakkımızda | Toptango', "Toptango: Türkiye genelinde toptan ticari mal ve hammadde alıcılarını ve satıcılarını buluşturan, ücretsiz ve komisyonsuz B2B ilan platformu.", 'Hakkımızda'],
  '/iletisim': ['İletişim | Toptango', 'Toptango ile iletişime geçin: destek@toptango.com.tr · Reşatbey Mah., Seyhan / Adana.', 'İletişim'],
  '/ilan-kurallari': ['İlan Kuralları | Toptango', "Toptango'da ilan verme kuralları: listelenebilecek ürünler, ilan içeriği ve moderasyon süreci.", 'İlan Kuralları'],
  '/sozlesme': ['Kullanım Koşulları | Toptango', 'Toptango kullanım koşulları ve üyelik sözleşmesi.', 'Kullanım Koşulları'],
  '/kvkk': ['KVKK Aydınlatma Metni | Toptango', 'Toptango kişisel verilerin korunması kanunu (KVKK) kapsamında aydınlatma metni.', 'KVKK Aydınlatma Metni'],
  '/gizlilik-politikasi': ['Gizlilik Politikası | Toptango', 'Toptango gizlilik politikası: hangi verilerin toplandığı, nasıl kullanıldığı ve haklarınız.', 'Gizlilik Politikası'],
  '/cerez-politikasi': ['Çerez Politikası | Toptango', 'Toptango çerez politikası: kullanılan çerezler ve çerez tercihlerinizi yönetme.', 'Çerez Politikası'],
  '/ucretlendirme': ['Ücretlendirme ve İade | Toptango', "Toptango'da ilan vermek ücretsizdir. Ücretlendirme ve iade koşulları.", 'Ücretlendirme ve İade'],
  '/hesap-silme': ['Hesap ve Veri Silme | Toptango', 'Toptango hesabınızı ve kişisel verilerinizi nasıl sileceğiniz.', 'Hesap ve Veri Silme'],
};

// Uygulama ici / kisisel sayfalar: kullanici icin calisir, dizine eklenmez.
const PRIVATE_ROUTES = [
  [/^\/ara$/, 'İlan Ara'], [/^\/giris$/, 'Giriş Yap'], [/^\/kayit$/, 'Üye Ol'],
  [/^\/hesabim$/, 'Hesabım'], [/^\/mesajlar(\/[^/]+)?$/, 'Mesajlar'], [/^\/admin$/, 'Yönetim'],
  [/^\/favorilerim$/, 'Favorilerim'], [/^\/bildirimler$/, 'Bildirimler'],
  [/^\/sifre-sifirla$/, 'Şifre Sıfırla'], [/^\/sifremi-unuttum$/, 'Şifremi Unuttum'],
  [/^\/ilan-ver$/, 'İlan Ver'], [/^\/ilan-duzenle\/[^/]+$/, 'İlanı Düzenle'], [/^\/hizli-ilan\/[^/]+$/, 'Hızlı İlan'],
];

const NOT_FOUND_PAGE = {
  title: 'Sayfa bulunamadı | Toptango', robots: 'noindex, follow', h1: 'Sayfa bulunamadı',
  intro: 'Aradığınız sayfa taşınmış, kaldırılmış ya da hiç var olmamış olabilir.',
};

// ----------------------------------------------------------------
// Express handler — SPA rotalari; eslesmeyen yol icin next() (gercek 404)
// ----------------------------------------------------------------
function handle(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  let p = req.path;
  // Sondaki egik cizgi: /kategori/kimya/ -> /kategori/kimya
  if (p.length > 1 && p.endsWith('/')) {
    const q = req.originalUrl.indexOf('?');
    return res.redirect(301, p.replace(/\/+$/, '') + (q >= 0 ? req.originalUrl.slice(q) : ''));
  }
  let m;
  try {
    const db = getDb();
    if (p === '/') return send(res, pageHome(db));
    if ((m = p.match(/^\/kategori\/([^/]+)$/))) {
      const page = pageCategory(db, decodeURIComponent(m[1]));
      return page ? send(res, page) : send(res, NOT_FOUND_PAGE, 404);
    }
    if ((m = p.match(/^\/ilan\/([^/]+)$/))) {
      const r = pageListing(db, decodeURIComponent(m[1]), p);
      if (!r) return send(res, NOT_FOUND_PAGE, 404);
      if (r.redirect) {
        const q = req.originalUrl.indexOf('?');
        return res.redirect(301, r.redirect + (q >= 0 ? req.originalUrl.slice(q) : ''));
      }
      if ('gone' in r) {
        // Sahibi/admin kendi pasif ilanini uygulama icinden yine gorebilir (API yetki kontrolu yapar).
        return send(res, Object.assign({}, NOT_FOUND_PAGE, { title: 'İlan yayında değil | Toptango', h1: 'Bu ilan artık yayında değil' }), r.gone ? 410 : 404);
      }
      return send(res, r);
    }
    if ((m = p.match(/^\/satici\/([^/]+)$/))) {
      const page = pageSeller(db, m[1]);
      return page ? send(res, page) : send(res, NOT_FOUND_PAGE, 404);
    }
    if (p === '/vitrin') return send(res, pageVitrin(db));
    if (STATIC_PAGES[p]) {
      const [title, description, h1] = STATIC_PAGES[p];
      return send(res, { title, description, h1, canonical: BASE + p });
    }
    const priv = PRIVATE_ROUTES.find(([re]) => re.test(p));
    if (priv) return send(res, { title: priv[1] + ' | Toptango', h1: priv[1], robots: 'noindex, follow', canonical: BASE + p });
  } catch (err) {
    console.error('[SSR] hata:', p, err.message);
    return send(res, { robots: 'noindex, follow' }, 500);
  }
  return next();
}

// Bilinmeyen sayfa: uygulama kabugu 404 durum koduyla (kullanici yine
// menuye/aramaya ulasabilir; app.js kendi "bulunamadi" ekranini gosterir).
function notFound(req, res) {
  send(res, NOT_FOUND_PAGE, 404);
}

// ----------------------------------------------------------------
// sitemap.xml — sadece gercek, dizine eklenebilir URL'ler
// ----------------------------------------------------------------
function sitemap(_req, res) {
  try {
    const db = getDb();
    const listings = db.prepare("SELECT id, title, updated_at FROM listings WHERE status='active' ORDER BY id ASC").all();
    const cats = db.prepare(
      `SELECT c.slug, MAX(l.updated_at) AS lastmod FROM categories c
       JOIN listings l ON l.category_id = c.id AND l.status='active'
       GROUP BY c.id ORDER BY c.sort_order ASC`).all();
    const sellers = db.prepare(
      `SELECT u.id, MAX(l.updated_at) AS lastmod FROM users u
       JOIN listings l ON l.user_id = u.id AND l.status='active'
       WHERE u.is_active = 1 AND u.role != 'admin' GROUP BY u.id ORDER BY u.id ASC`).all();
    const newest = listings.reduce((m, l) => (l.updated_at && l.updated_at > m ? l.updated_at : m), '');

    const urls = [];
    urls.push({ loc: BASE + '/', lastmod: day(newest) });
    urls.push({ loc: BASE + '/vitrin' });
    Object.keys(STATIC_PAGES).forEach(p => urls.push({ loc: BASE + p }));
    cats.forEach(c => urls.push({ loc: BASE + '/kategori/' + c.slug, lastmod: day(c.lastmod) }));
    listings.forEach(l => urls.push({ loc: BASE + listingPath(l), lastmod: day(l.updated_at) }));
    sellers.forEach(s => urls.push({ loc: BASE + '/satici/' + s.id, lastmod: day(s.lastmod) }));

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(u => '  <url><loc>' + esc(u.loc) + '</loc>' + (u.lastmod ? '<lastmod>' + u.lastmod + '</lastmod>' : '') + '</url>').join('\n') +
      '\n</urlset>\n';
    res.type('application/xml').send(xml);
  } catch (err) {
    console.error('[SITEMAP] hata:', err.message);
    res.status(500).type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}

module.exports = { handle, notFound, sitemap, slugify };
