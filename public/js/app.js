/* ============================================================
   Ticarethane — Frontend SPA
   ============================================================ */

const API = '/api';

// Türkiye'nin 81 ili — en büyük 5 şehir önce (plaka sırasına göre), sonra diğerleri
const CITIES_TOP5 = ['Ankara', 'Antalya', 'Bursa', 'İstanbul', 'İzmir'];
const CITIES_REST = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya','Ardahan','Artvin',
  'Aydın','Balıkesir','Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis',
  'Bolu','Burdur','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Düzce',
  'Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun',
  'Gümüşhane','Hakkari','Hatay','Iğdır','Isparta','Kahramanmaraş','Karabük',
  'Karaman','Kars','Kastamonu','Kayseri','Kilis','Kırıkkale','Kırklareli',
  'Kırşehir','Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin','Mersin',
  'Muğla','Muş','Nevşehir','Niğde','Ordu','Osmaniye','Rize','Sakarya','Samsun',
  'Siirt','Sinop','Sivas','Şanlıurfa','Şırnak','Tekirdağ','Tokat','Trabzon',
  'Tunceli','Uşak','Van','Yalova','Yozgat','Zonguldak'
];
const CITIES = CITIES_TOP5.concat(CITIES_REST);

// Sektör ikonları (SVG)
const SECTOR_ICONS = [
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M9 3v6l-4 7a1 1 0 00.9 1.5h12.2a1 1 0 00.9-1.5L15 9V3"/><circle cx="9.5" cy="15" r=".7" fill="currentColor" stroke="none"/><circle cx="13.5" cy="17" r=".7" fill="currentColor" stroke="none"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="5" width="20" height="3" rx="1"/><rect x="2" y="11" width="20" height="3" rx="1"/><rect x="2" y="17" width="20" height="3" rx="1"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10"/><path d="M7 12c0-4 5-8 5-8s5 4 5 8"/><path d="M5 17c0-2 3-4 7-4s7 2 7 4"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><circle cx="6" cy="6" r="1.5"/><circle cx="18" cy="6" r="1.5"/><circle cx="6" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/><line x1="8" y1="7" x2="11" y2="11"/><line x1="16" y1="7" x2="13" y2="11"/><line x1="8" y1="17" x2="11" y2="13"/><line x1="16" y1="17" x2="13" y2="13"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="14" width="8" height="8"/><rect x="14" y="8" width="8" height="14"/><path d="M6 14V8l6-6 6 6"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="6" r="3"/><path d="M15.5 8.5L3 21"/><path d="M5 9c0-2.2 3-5 7-5"/><path d="M5 9s3 1 4 4"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"/><path d="M23 3H1l2 5h18l2-5z"/><line x1="12" y1="8" x2="12" y2="21"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="8.5" x2="22" y2="8.5"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 22V13l-5-4-5 4v9"/><path d="M12 22V9"/><path d="M2 22h20"/><path d="M5 9L12 2l7 7"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4c0 0 1 4 4 6s8 2 10 6c-2 0-6-1-9 1C6 19 4 22 4 22V4z"/><path d="M20 4c0 0-1 4-4 6"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 12 12 22 2 12 12 2"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11a7 7 0 01-7 7m7-7a7 7 0 00-7-7m7 7H3"/><path d="M12 18c1 2 1 4-1 4s-2-2-1-4"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C9 6 7 10 7 13a5 5 0 0010 0c0-3-2-7-5-11z"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 014 4c0 2-4 6-4 6S8 8 8 6a4 4 0 014-4z"/><rect x="4" y="12" width="16" height="10" rx="2"/><line x1="8" y1="12" x2="8" y2="22"/><line x1="16" y1="12" x2="16" y2="22"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`,
];

// ---- Global durum ----
const State = {
  token:      localStorage.getItem('tc_token') || sessionStorage.getItem('tc_token') || null,
  user:       JSON.parse(localStorage.getItem('tc_user') || sessionStorage.getItem('tc_user') || 'null'),
  categories: [],
};

// ── Döviz kuru cache ──────────────────────────────────────────────────────
var _fxRates   = { USD: 40, EUR: 43 };   // fallback (2026 yaklaşık)
var _fxFetched = 0;

async function getFxRates() {
  if (Date.now() - _fxFetched < 30 * 60 * 1000) return _fxRates; // 30 dk cache
  try {
    var r = await fetch('/api/rates');
    if (!r.ok) throw new Error('rate fetch failed');
    var d = await r.json();
    if (d.USD && d.EUR) {
      _fxRates   = { USD: d.USD, EUR: d.EUR };
      _fxFetched = Date.now();
    }
  } catch(e) { /* fallback'i koru */ }
  return _fxRates;
}

function toTRY(amount, currency) {
  if (!amount) return null;
  if (!currency || currency === 'TRY') return amount;
  var rate = _fxRates[currency] || null;
  return rate ? amount * rate : null;
}
// ─────────────────────────────────────────────────────────────────────────────

function setAuth(token, user, remember) {
  State.token = token; State.user = user;
  var store = (remember === false) ? sessionStorage : localStorage;
  // Clear both storages first
  localStorage.removeItem('tc_token'); localStorage.removeItem('tc_user');
  sessionStorage.removeItem('tc_token'); sessionStorage.removeItem('tc_user');
  store.setItem('tc_token', token);
  store.setItem('tc_user', JSON.stringify(user));
}
function clearAuth() {
  State.token = null; State.user = null;
  localStorage.removeItem('tc_token'); localStorage.removeItem('tc_user');
  sessionStorage.removeItem('tc_token'); sessionStorage.removeItem('tc_user');
}
function isLoggedIn() { return !!State.token; }
function isAdmin()    { return State.user && State.user.role === 'admin'; }

// ================================================================
// API yardımcı
// ================================================================
async function api(method, path, data, isForm) {
  const opts = { method: method.toUpperCase(), headers: {} };
  if (State.token) opts.headers['Authorization'] = 'Bearer ' + State.token;
  if (data) {
    if (isForm) { opts.body = data; }
    else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(data); }
  }
  const res  = await fetch(API + path, opts);
  const json = await res.json().catch(function() { return {}; });
  if (!res.ok) {
    if (res.status === 401 && State.token) {
      clearAuth();
      toast('Oturumunuz sona erdi, lütfen tekrar giriş yapın.', 'error', 4000);
      goTo('/giris');
    }
    const err = new Error(json.error || ('Sunucu hatası (' + res.status + ')'));
    err.status = res.status;
    throw err;
  }
  return json;
}

// ================================================================
// TOAST & MODAL
// ================================================================
function toast(msg, type, ms) {
  type = type || 'info'; ms = ms || 4000;
  const c   = document.getElementById('toastContainer');
  const div = document.createElement('div');
  div.className = 'toast ' + type;
  div.textContent = msg;
  c.appendChild(div);
  setTimeout(function() { div.remove(); }, ms);
}

// ================================================================
// ROUTER — href="#/path" ile çalışır, onclick gerekmez
// ================================================================
var routes = {
  '/':                    renderHome,
  '/ara':                 renderSearch,
  '/ilan/:id':            renderListingDetail,
  '/ilan-ver':            renderCreateListing,
  '/ilan-duzenle/:id':    renderEditListing,
  '/kategori/:slug':      renderCategory,
  '/giris':               renderLogin,
  '/kayit':               renderRegister,
  '/hesabim':             renderDashboard,
  '/mesajlar':            renderMessages,
  '/mesajlar/:convId':    renderConversation,
  '/admin':               renderAdmin,
  '/satici/:userId':       renderSellerPage,
  '/favorilerim':          renderFavorites,
  '/bildirimler':          renderNotifications,
  '/sifre-sifirla':        renderResetPassword,
  '/sifremi-unuttum':      renderForgotPassword,
};

function getHash() {
  return window.location.hash || '#/';
}

function matchRoute(hash) {
  var path = (hash.replace(/^#/, '') || '/').split('?')[0];
  var patterns = Object.keys(routes);
  for (var i = 0; i < patterns.length; i++) {
    var pattern = patterns[i];
    var keys  = [];
    var regex = new RegExp('^' + pattern.replace(/:(\w+)/g, function(_, k) { keys.push(k); return '([^/]+)'; }) + '$');
    var match = path.match(regex);
    if (match) {
      var params = {};
      keys.forEach(function(k, idx) { params[k] = decodeURIComponent(match[idx + 1]); });
      return { fn: routes[pattern], params: params };
    }
  }
  return null;
}

function goTo(path) {
  window.location.hash = path;
}

function router() {
  var hash   = getHash();
  var result = matchRoute(hash);
  updateNavbar();
  updateCatBar(hash);

  if (!result) { render404(); return; }

  // Koruma
  var protected_ = ['/hesabim', '/ilan-ver', '/ilan-duzenle'];
  var isProtected = protected_.some(function(p) { return hash.includes(p); });
  if (isProtected && !isLoggedIn()) { goTo('/giris'); return; }
  if (hash.includes('/admin') && !isAdmin()) {
    if (isLoggedIn()) {
      // Giriş yapılmış ama admin değil — login döngüsü oluşmaması için hesabıma yönlendir
      document.getElementById('app').innerHTML =
        '<div class="container" style="text-align:center;padding:80px 24px;">' +
        '<div style="font-size:3rem;">🔒</div>' +
        '<div class="empty-state-title" style="margin-top:12px;">Yetkisiz Erişim</div>' +
        '<div class="empty-state-sub">Bu sayfaya giriş yetkiniz yok.</div>' +
        '<a href="#/" class="btn btn-primary" style="margin-top:16px;">Ana Sayfaya Dön</a>' +
        '</div>';
    } else {
      goTo('/giris');
    }
    return;
  }

  // Form state temizle — eski sayfa kalıntısı yüklenmesin
  _pendingFiles = [];
  _toDeleteImgs = new Set();

  var app = document.getElementById('app');
  app.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

  Promise.resolve(result.fn(result.params)).catch(function(err) {
    console.error('[Router]', err);
    app.innerHTML = '<div class="container" style="padding:60px 0;text-align:center;"><p class="text-muted">Sayfa yüklenemedi.</p><a href="#/" class="btn btn-primary" style="margin-top:16px;">Ana Sayfaya Dön</a></div>';
  });
}

window.addEventListener('hashchange', router);
window.addEventListener('load', function() {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  loadCategories().then(function() {
    buildCatBar();
    setupNavSearch();
    router();
    if (isLoggedIn()) startUnreadPoller();
  });
});

var _unreadTimer = null;
function startUnreadPoller() {
  updateUnreadBadge();
  _unreadTimer = setInterval(updateUnreadBadge, 30000);
}
function stopUnreadPoller() {
  if (_unreadTimer) { clearInterval(_unreadTimer); _unreadTimer = null; }
}
async function updateUnreadBadge() {
  if (!isLoggedIn()) return;
  try {
    var r = await api('GET', '/messages/unread');
    var badge = document.getElementById('msgBadge');
    if (badge) {
      badge.textContent = r.unread > 0 ? r.unread : '';
      badge.style.display = r.unread > 0 ? 'inline-flex' : 'none';
    }
  } catch(e) {}
}

// ================================================================
// KATEGORİLER
// ================================================================
async function loadCategories() {
  try { State.categories = await api('GET', '/categories'); } catch(e) { State.categories = []; }
}

function buildCatBar() {
  var el = document.getElementById('catBarInner');
  var html = '<a class="cat-bar-item" href="#/ara">Tüm İlanlar</a>';
  State.categories.forEach(function(c) {
    html += '<a class="cat-bar-item" data-slug="' + c.slug + '" href="#/kategori/' + c.slug + '">' + esc(c.name) + '</a>';
  });
  el.innerHTML = html;
}

function updateCatBar(hash) {
  document.querySelectorAll('.cat-bar-item').forEach(function(el) {
    el.classList.remove('active');
    var slug = el.dataset.slug;
    if (!slug && (hash === '#/' || hash.startsWith('#/ara'))) el.classList.add('active');
    else if (slug && hash.includes(slug)) el.classList.add('active');
  });
}

// ================================================================
// NAVBAR
// ================================================================
async function fetchNotifCount() {
  if (!isLoggedIn()) return;
  try {
    var d = await api('GET', '/notifications');
    var badge = document.getElementById('notifBadge');
    if (badge) {
      if (d.unread > 0) {
        badge.textContent = d.unread > 9 ? '9+' : d.unread;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch(e) {}
}

function updateNavbar() {
  var el = document.getElementById('navActions');
  if (isLoggedIn()) {
    var name = (State.user && State.user.name) ? State.user.name.split(' ')[0] : 'Hesabım';
    el.innerHTML =
      '<a href="#/favorilerim" class="btn-nav btn-nav-ghost" title="Favorilerim" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>' +
      '</a>' +
      '<a href="#/bildirimler" class="btn-nav btn-nav-ghost" style="position:relative;">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><span id="notifBadge" style="display:none;position:absolute;top:-4px;right:-4px;background:var(--red);color:#fff;border-radius:99px;font-size:.6rem;font-weight:700;min-width:16px;height:16px;line-height:16px;text-align:center;padding:0 3px;"></span>' +
      '</a>' +
      '<a href="#/mesajlar" class="btn-nav btn-nav-ghost" style="position:relative;">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:block;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
        '<span id="msgBadge" style="display:none;position:absolute;top:-4px;right:-6px;background:var(--red);color:#fff;border-radius:99px;font-size:.65rem;font-weight:700;width:17px;height:17px;align-items:center;justify-content:center;"></span>' +
      '</a>' +
      '<a href="#/hesabim" class="btn-nav btn-nav-ghost">' + esc(name) + '</a>' +
      (isAdmin() ? '<a href="#/admin" class="btn-nav btn-nav-ghost">Yönetim</a>' : '') +
      '<a href="#/ilan-ver" class="btn-nav btn-nav-accent">+ İlan Ver</a>' +
      '<button class="btn-nav btn-nav-ghost" id="logoutBtn">Çıkış</button>';
    var lb = document.getElementById('logoutBtn');
    if (lb) lb.addEventListener('click', function() {
      clearAuth(); goTo('/'); toast('Çıkış yapıldı.', 'success');
    });
    // Bildirim sayısı
    fetchNotifCount();
  } else {
    el.innerHTML =
      '<a href="#/giris" class="btn-nav btn-nav-ghost">Giriş Yap</a>' +
      '<a href="#/kayit" class="btn-nav btn-nav-accent">Üye Ol</a>';
  }
}

function setupNavSearch() {
  document.getElementById('navSearchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var q = document.getElementById('navSearchInput').value.trim();
    if (q) goTo('/ara?search=' + encodeURIComponent(q));
  });
}

// ================================================================
// YARDIMCI
// ================================================================
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatPrice(l) {
  if (l.price_type === 'on_request') return 'Fiyat Sorunuz';
  if (!l.price) return l.price_type === 'negotiable' ? 'Pazarlık Usulü' : '—';
  var cur  = l.currency || 'TRY';
  var sym  = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₺';
  try {
    var formatted = new Intl.NumberFormat('tr-TR', { style:'currency', currency: cur, maximumFractionDigits:0 }).format(l.price);
    var suffix = '';
    if (l.price_basis === 'per_unit' && l.quantity_unit) suffix = ' / ' + l.quantity_unit;
    else if (l.price_basis === 'total') suffix = ' (Toplam)';
    return formatted + suffix;
  } catch(e) {
    var suffix2 = l.price_basis === 'per_unit' && l.quantity_unit ? ' / ' + l.quantity_unit : '';
    return sym + Number(l.price).toLocaleString('tr-TR') + suffix2;
  }
}

function timeAgo(dateStr) {
  var diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)     return 'Az önce';
  if (diff < 3600)   return Math.floor(diff/60) + ' dk önce';
  if (diff < 86400)  return Math.floor(diff/3600) + ' saat önce';
  if (diff < 604800) return Math.floor(diff/86400) + ' gün önce';
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

function citySelectHTML(name, selected) {
  return '<select name="' + name + '" class="form-control" id="' + name + '">' +
    '<option value="">— Şehir Seçin —</option>' +
    '<optgroup label="Büyük Şehirler">' +
    CITIES_TOP5.map(function(c) { return '<option value="' + c + '"' + (c === selected ? ' selected' : '') + '>' + c + '</option>'; }).join('') +
    '</optgroup>' +
    '<optgroup label="Diğer İller">' +
    CITIES_REST.map(function(c) { return '<option value="' + c + '"' + (c === selected ? ' selected' : '') + '>' + c + '</option>'; }).join('') +
    '</optgroup>' +
    '</select>';
}

// Türk GSM numarası doğrulama
function validateTurkishPhone(val) {
  if (!val) return 'Telefon numarası zorunludur.';
  var digits = val.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('90')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length !== 10) return 'Geçerli bir telefon numarası giriniz (+90 5XX XXX XX XX).';
  if (!digits.startsWith('5')) return 'Cep telefonu numarası 5 ile başlamalıdır.';
  if (parseInt(digits[1]) > 7) return 'Geçersiz GSM numarası. Lütfen gerçek numaranızı giriniz.';
  if (/^(.)\1{9}$/.test(digits)) return 'Geçerli bir telefon numarası giriniz.';
  if (digits === '5000000000' || digits === '5111111111' || digits === '5123456789') return 'Geçerli bir telefon numarası giriniz.';
  return null;
}

function catSelectHTML(selected, name) {
  name = name || 'category_id';
  return '<select name="' + name + '" class="form-control" id="' + name + '">' +
    '<option value="">— Sektör Seçin —</option>' +
    State.categories.map(function(c) { return '<option value="' + c.id + '"' + (c.id == selected ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') +
    '</select>';
}

async function loadSubcats(catId) {
  var el = document.getElementById('subcategory_id');
  if (!el) return;
  if (!catId) { el.innerHTML = '<option value="">— Alt Kategori —</option>'; return; }
  try {
    var cat = State.categories.find(function(c) { return c.id == catId; });
    if (!cat) return;
    var data = await api('GET', '/categories/' + cat.slug);
    el.innerHTML = '<option value="">— Alt Kategori (İsteğe Bağlı) —</option>' +
      data.subcategories.map(function(s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('');
  } catch(e) { el.innerHTML = '<option value="">— Alt Kategori —</option>'; }
}
window.loadSubcats = loadSubcats;

function togglePriceInput() {
  var t = document.getElementById('priceTypeSelect');
  var g = document.getElementById('priceInputGroup');
  if (t && g) g.style.display = (t.value === 'on_request') ? 'none' : '';
}
window.togglePriceInput = togglePriceInput;

// Dövizli kartları güncelle — önce fallback, sonra gerçek kur
function renderFxCards(listings, rates) {
  if (!listings || !listings.length) return;
  listings.forEach(function(l) {
    if (!l.price || !l.currency || l.currency === 'TRY') return;
    var el = document.getElementById('fx_' + l.id);
    if (!el) return;
    try {
      var rate = rates[l.currency];
      if (!rate) { el.textContent = ''; return; }
      var tryAmt = parseFloat(l.price) * rate;
      var formatted = new Intl.NumberFormat('tr-TR', { maximumFractionDigits:0 }).format(tryAmt);
      var label = l.price_basis === 'total' ? ' toplam' : (l.quantity_unit ? ' / ' + l.quantity_unit : '');
      el.textContent = '~₺' + formatted + label + ' (tahmini)';
    } catch(e) { el.textContent = ''; }
  });
}

async function updateFxCards(listings) {
  if (!listings || !listings.length) return;
  var foreign = listings.filter(function(l) { return l.price && l.currency && l.currency !== 'TRY'; });
  if (!foreign.length) return;
  // Önce fallback ile göster
  renderFxCards(foreign, _fxRates);
  // Sonra gerçek kuru çek, güncelle
  try {
    var rates = await getFxRates();
    renderFxCards(foreign, rates);
  } catch(e) { /* fallback gösterim kalır */ }
}

function infoRow(label, val) {
  if (val == null || val === '') return '';
  return '<div class="info-row"><span class="info-row-label">' + esc(label) + '</span><span class="info-row-val">' + esc(String(val)) + '</span></div>';
}

function listingCardHTML(l) {
  var img = l.thumbnail
    ? '<img class="listing-card-img" src="/uploads/' + l.thumbnail + '" alt="' + esc(l.title) + '" loading="lazy" />'
    : '<div class="listing-card-img-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.3;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span style="font-size:.68rem;margin-top:6px;text-align:center;">' + esc(l.category_name||'Görsel Yok') + '</span></div>';
  var priceHtml = '<div class="listing-card-price">' + formatPrice(l) + '</div>';
  var qtyNum = l.quantity ? parseFloat(l.quantity) : 0;
  if (l.price && qtyNum > 0) {
    var sym = l.currency === 'USD' ? '$' : l.currency === 'EUR' ? '€' : '₺';
    var priceVal = parseFloat(l.price);
    if (l.price_basis === 'total' && l.quantity_unit) {
      // Toplam fiyat → birim başı hesapla
      var perUnit = priceVal / qtyNum;
      priceHtml += '<div style="font-size:.76rem;color:var(--text-muted);margin-top:2px;">' + sym + perUnit.toLocaleString('tr-TR', {minimumFractionDigits:2,maximumFractionDigits:2}) + ' / ' + esc(l.quantity_unit) + '</div>';
    } else if (l.price_basis !== 'total' && l.quantity_unit) {
      // Birim fiyat → toplamı hesapla
      var totalPrice = priceVal * qtyNum;
      priceHtml += '<div style="font-size:.76rem;color:var(--text-muted);margin-top:2px;">Toplam: ' + sym + totalPrice.toLocaleString('tr-TR', {maximumFractionDigits:0}) + '</div>';
    }
  }
  return '<a class="listing-card" href="#/ilan/' + l.id + '">' +
    img +
    '<div class="listing-card-body">' +
      '<div class="listing-card-cat">' + esc(l.category_name || '') + '</div>' +
      '<div class="listing-card-title">' + (l.is_featured ? '<span class="badge-featured">Öne Çıkan</span> ' : '') + esc(l.title) + '</div>' +
      priceHtml +
      '<div class="listing-card-seller">' + esc(l.company_name || l.seller_name || '') + '</div>' +
      (l.price && l.currency && l.currency !== 'TRY' ? '<div class="listing-card-fx" id="fx_' + l.id + '">~₺ hesaplanıyor...</div>' : '') +
      '<div class="listing-card-meta">' +
        '<span class="badge badge-' + l.listing_type + '">' + (l.listing_type === 'sell' ? 'Satılır' : 'Alınır') + '</span>' +
        '<span>' + esc(l.city) + '</span>' +
      '</div>' +
    '</div>' +
  '</a>';
}

function paginationHTML(pag, baseHash) {
  if (!pag || pag.pages <= 1) return '';
  function pageLink(p) {
    var u = new URL('http://x' + baseHash.replace('#',''));
    u.searchParams.set('page', p);
    return '#' + u.toString().replace('http://x','');
  }
  var btns = '<a class="page-btn' + (pag.page===1?' disabled':'') + '" href="' + (pag.page>1?pageLink(pag.page-1):'#') + '">‹</a>';
  for (var p = Math.max(1,pag.page-2); p <= Math.min(pag.pages,pag.page+2); p++) {
    btns += '<a class="page-btn' + (p===pag.page?' active':'') + '" href="' + pageLink(p) + '">' + p + '</a>';
  }
  btns += '<a class="page-btn' + (pag.page===pag.pages?' disabled':'') + '" href="' + (pag.page<pag.pages?pageLink(pag.page+1):'#') + '">›</a>';
  return '<div class="pagination">' + btns + '</div>';
}

// ================================================================
// ANA SAYFA
// ================================================================
async function renderHome() {
  var app = document.getElementById('app');
  try {
    var results = await Promise.all([
      api('GET', '/listings?limit=12&sort=newest'),
      api('GET', '/listings?limit=4&sort=newest&featured=1').catch(function() { return { listings: [] }; }),
    ]);
    var data = results[0];
    var featData = results[1];
    var featuredListings = (featData.listings || []).filter(function(l) { return l.is_featured; });

    var catCards =
      '<a class="cat-card cat-card-all" href="#/ara">' +
        '<div class="cat-icon-wrap ic-all"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>' +
        '<div class="cat-card-name">Tüm İlanlar</div>' +
      '</a>' +
      State.categories.map(function(c, i) {
        return '<a class="cat-card" href="#/kategori/' + c.slug + '">' +
          '<div class="cat-icon-wrap ic-' + (i % 18) + '">' + SECTOR_ICONS[i % SECTOR_ICONS.length] + '</div>' +
          '<div class="cat-card-name">' + esc(c.name) + '</div>' +
        '</a>';
      }).join('');

    var listings = (data.listings && data.listings.length)
      ? '<div class="listing-grid">' + data.listings.map(listingCardHTML).join('') + '</div>'
      : '<div class="empty-state"><div class="empty-state-icon">◈</div><div class="empty-state-title">Henüz ilan yok</div></div>';

    var featuredHTML = featuredListings.length > 0
      ? '<section class="section" style="padding-top:0;">' +
          '<div class="container">' +
            '<div class="section-header"><div><div class="section-title">Öne Çıkan İlanlar</div><div class="section-sub">Öne çıkarılmış seçkin ilanlar</div></div></div>' +
            '<div class="listing-grid">' + featuredListings.map(listingCardHTML).join('') + '</div>' +
          '</div>' +
        '</section>'
      : '';

    app.innerHTML =
      '<section class="hero">' +
        '<div class="container">' +
          '<div class="hero-inner">' +
            '<div class="hero-label">Ticari Mal Platformu</div>' +
            '<h1>Türkiye Ticari Mal<br><span>İlan Merkezi</span></h1>' +
            '<p>Kimyadan demire, tarımdan plastige — alıcı ve satıcıları sektörel kategorilerle buluşturuyoruz.</p>' +
            '<form class="hero-search" id="heroSearchForm">' +
              '<input type="text" id="heroSearchInput" placeholder="Ürün, hammadde veya sektör arayın..." />' +
              '<button type="submit">Ara</button>' +
            '</form>' +
            '<div class="hero-stats">' +
              '<div><em class="hero-stat-val">' + (data.pagination ? data.pagination.total : (data.total || 0)) + '</em><span class="hero-stat-lbl">Aktif İlan</span></div>' +
              '<div><em class="hero-stat-val">' + State.categories.length + '</em><span class="hero-stat-lbl">Sektör</span></div>' +
              '<div><em class="hero-stat-val">81 İl</em><span class="hero-stat-lbl">Hizmet Bölgesi</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="section" style="padding-bottom:16px;">' +
        '<div class="container">' +
          '<div class="section-header"><div><div class="section-title">Sektörler</div><div class="section-sub">Aradığınız ticari malı sektörüne göre bulun</div></div><a href="#/ara" class="btn btn-ghost btn-sm">Tüm İlanlar</a></div>' +
          '<div class="cat-grid">' + catCards + '</div>' +
        '</div>' +
      '</section>' +
      featuredHTML +
      '<section class="section">' +
        '<div class="container">' +
          '<div class="section-header"><div><div class="section-title">Son İlanlar</div><div class="section-sub">Platforma yeni eklenen ilanlar</div></div><a href="#/ara" class="btn btn-ghost btn-sm">Tümünü Gör</a></div>' +
          listings +
        '</div>' +
      '</section>';

    document.getElementById('heroSearchForm').addEventListener('submit', function(e) {
      e.preventDefault();
      var q = document.getElementById('heroSearchInput').value.trim();
      if (q) goTo('/ara?search=' + encodeURIComponent(q));
    });

    updateFxCards(data.listings || []);
  } catch(err) {
    app.innerHTML = '<div class="container" style="padding:40px;"><div class="alert alert-error">' + esc(err.message) + '</div></div>';
  }
}

async function renderSearch() {
  try {
    var qs     = new URLSearchParams((getHash().split('?')[1]) || '');
    var search = qs.get('search')       || '';
    var city   = qs.get('city')         || '';
    var type   = qs.get('listing_type') || '';
    var cat    = qs.get('category')     || '';
    var sort   = qs.get('sort')         || 'newest';
    var page   = parseInt(qs.get('page') || '1') || 1;
  
    var priceMin  = qs.get('price_min') || '';
    var priceMax  = qs.get('price_max') || '';
    var ptype     = qs.get('price_type') || '';
    var pbasis    = qs.get('price_basis') || '';
    var currency  = qs.get('currency') || '';
    var qunit     = qs.get('quantity_unit') || '';
    var lotMin    = qs.get('lot_min') || '';
    var lotMax    = qs.get('lot_max') || '';
  
    var q = new URLSearchParams();
    if (search)   q.set('search', search);
    if (city)     q.set('city', city);
    if (type)     q.set('listing_type', type);
    if (cat)      q.set('category', cat);
    if (priceMin) q.set('price_min', priceMin);
    if (priceMax) q.set('price_max', priceMax);
    if (ptype)    q.set('price_type', ptype);
    if (pbasis)   q.set('price_basis', pbasis);
    if (currency) q.set('currency', currency);
    if (qunit)    q.set('quantity_unit', qunit);
    if (lotMin)   q.set('lot_qty_min', lotMin);
    if (lotMax)   q.set('lot_qty_max', lotMax);
    q.set('sort', sort); q.set('page', page);
  
    var data = await api('GET', '/listings?' + q.toString());
    var app  = document.getElementById('app');
  
    function aLink(overrides) {
      var p = {};
      if (search)   p.search        = search;
      if (city)     p.city          = city;
      if (type)     p.listing_type  = type;
      if (cat)      p.category      = cat;
      if (priceMin) p.price_min     = priceMin;
      if (priceMax) p.price_max     = priceMax;
      if (ptype)    p.price_type    = ptype;
      if (pbasis)   p.price_basis   = pbasis;
      if (currency) p.currency      = currency;
      if (qunit)    p.quantity_unit = qunit;
      if (lotMin)   p.lot_min       = lotMin;
      if (lotMax)   p.lot_max       = lotMax;
      p.sort = sort;
      Object.assign(p, overrides);
      Object.keys(p).forEach(function(k) { if (!p[k]) delete p[k]; });
      return '#/ara?' + new URLSearchParams(p).toString();
    }
  
    var activeCount = [search,city,type,cat,priceMin,priceMax,ptype,pbasis,currency,qunit,lotMin,lotMax].filter(Boolean).length;
  
    var priceFormId = 'priceRangeForm_' + Date.now();
    var sidebar =
      (activeCount > 0 ? '<a href="#/ara' + (search?'?search='+encodeURIComponent(search):'') + '" class="btn btn-ghost btn-sm w-100" style="margin-bottom:10px;">Filtreleri Temizle (' + activeCount + ')</a>' : '') +
      filterSidebar([
        { title:'İlan Türü', name:'f_type', current:type, options:[['','Tümü'],['sell','Satılır'],['buy','Alınır']], linkFn: function(v){ return aLink({listing_type:v, page:1}); } },
        { title:'Sıralama',  name:'f_sort', current:sort, options:[['newest','En Yeni'],['oldest','En Eski'],['price_asc','Ucuzdan Pahalıya'],['price_desc','Pahalıdan Ucuza'],['views','En Çok Görüntülenen']], linkFn: function(v){ return aLink({sort:v}); } },
        { title:'Sektör', name:'f_cat', current:cat, options:[['','Tümü']].concat(State.categories.map(function(c){ return [c.slug, c.name]; })), linkFn: function(v){ return aLink({category:v, page:1}); } },
        { title:'Şehir',    name:'f_city', current:city, options:[['','Tümü']].concat(CITIES.map(function(c){return[c,c];})), linkFn: function(v){ return aLink({city:v, page:1}); } },
        { title:'Fiyat Bazı', name:'f_pbasis', current:qs.get('price_basis')||'', options:[['','Tümü'],['per_unit','Lot Başı'],['total','Toplam Fiyat']], linkFn: function(v){ return aLink({price_basis:v, page:1}); } },
        { title:'Fiyat Türü', name:'f_ptype', current:ptype, options:[['','Tümü'],['fixed','Sabit Fiyat'],['negotiable','Pazarlık Usulü'],['on_request','Fiyat Sorunuz']], linkFn: function(v){ return aLink({price_type:v, page:1}); } },
        { title:'Para Birimi', name:'f_cur', current:qs.get('currency')||'', options:[['','Tümü'],['TRY','₺ TRY'],['USD','$ USD'],['EUR','€ EUR']], linkFn: function(v){ return aLink({currency:v, page:1}); } },
        { title:'Miktar Birimi', name:'f_qunit', current:qunit, options:[['','Tümü'],['Ton','Ton'],['Kg','Kg'],['Litre','Litre'],['m³','m³'],['Adet','Adet'],['Palet','Palet'],['Lot','Lot'],['Konteyner','Konteyner']], linkFn: function(v){ return aLink({quantity_unit:v, page:1}); } },
      ]) +
      '<div class="filter-block"><div class="filter-block-title">Fiyat Aralığı</div><div class="filter-block-body">' +
        '<form id="' + priceFormId + '" style="display:flex;flex-direction:column;gap:8px;">' +
          '<input type="number" placeholder="Min ₺" value="' + priceMin + '" id="pMin" class="form-control" style="font-size:.82rem;padding:6px 10px;" min="0" />' +
          '<input type="number" placeholder="Max ₺" value="' + priceMax + '" id="pMax" class="form-control" style="font-size:.82rem;padding:6px 10px;" min="0" />' +
          '<button type="submit" class="btn btn-primary btn-sm w-100">Uygula</button>' +
          (priceMin||priceMax ? '<a href="' + aLink({price_min:'',price_max:''}) + '" class="btn btn-ghost btn-sm w-100">Temizle</a>' : '') +
        '</form>' +
      '</div></div>' +
      '<div class="filter-block"><div class="filter-block-title">Lot Adedi Aralığı</div><div class="filter-block-body">' +
        '<form id="lotRangeForm" style="display:flex;flex-direction:column;gap:8px;">' +
          '<input type="number" placeholder="Min lot" value="' + lotMin + '" id="lMin" class="form-control" style="font-size:.82rem;padding:6px 10px;" min="0" />' +
          '<input type="number" placeholder="Max lot" value="' + lotMax + '" id="lMax" class="form-control" style="font-size:.82rem;padding:6px 10px;" min="0" />' +
          '<button type="submit" class="btn btn-primary btn-sm w-100">Uygula</button>' +
          (lotMin||lotMax ? '<a href="' + aLink({lot_min:'',lot_max:''}) + '" class="btn btn-ghost btn-sm w-100">Temizle</a>' : '') +
        '</form>' +
      '</div></div>';
  
    app.innerHTML =
      '<div class="container">' +
        '<div class="breadcrumb"><a href="#/">Anasayfa</a><span class="breadcrumb-sep">/</span><span>' + (search ? '"'+esc(search)+'"' : 'Tüm İlanlar') + '</span></div>' +
        '<div class="page-layout">' +
          '<aside class="filter-sidebar">' + sidebar + '</aside>' +
          '<div>' +
            '<div class="section-header">' +
              '<div><div class="section-title">' + (search ? '"'+esc(search)+'" için sonuçlar' : 'Tüm İlanlar') + ' <span class="text-muted fs-sm">(' + data.pagination.total + ' ilan)</span></div></div>' +
              (isLoggedIn() ? '<a href="#/ilan-ver" class="btn btn-accent btn-sm">+ İlan Ver</a>' : '') +
            '</div>' +
            (data.listings.length
              ? '<div class="listing-grid">' + data.listings.map(listingCardHTML).join('') + '</div>'
              : '<div class="empty-state"><div class="empty-state-title">İlan bulunamadı</div><div class="empty-state-sub">Filtreleri değiştirerek tekrar deneyin.</div></div>') +
            paginationHTML(data.pagination, aLink({})) +
          '</div>' +
        '</div>' +
      '</div>';
  
    var pf = document.getElementById(priceFormId);
    if (pf) pf.addEventListener('submit', function(e) {
      e.preventDefault();
      var mn = document.getElementById('pMin').value.trim();
      var mx = document.getElementById('pMax').value.trim();
      window.location.hash = aLink({price_min: mn, price_max: mx, page: 1});
    });
    // Lot range form submit
    var lf = document.getElementById('lotRangeForm');
    if (lf) lf.addEventListener('submit', function(e) {
      e.preventDefault();
      var lmn = document.getElementById('lMin').value.trim();
      var lmx = document.getElementById('lMax').value.trim();
      window.location.hash = aLink({lot_min: lmn, lot_max: lmx, page: 1});
    });
  
    updateFxCards(data.listings);
  } catch(err) {
    console.error('[renderSearch]', err);
    var appEl = document.getElementById('app');
    if (appEl) appEl.innerHTML = '<div class="container" style="padding:40px 16px;text-align:center;"><div class="alert alert-error">Arama yüklenemedi: ' + esc(err.message||'Bilinmeyen hata') + '</div><a href="#/" class="btn btn-primary" style="margin-top:16px;">Ana Sayfaya Dön</a></div>';
  }
}
async function renderCategory(params) {
  try {
    var slug = params.slug;
    var qs   = new URLSearchParams((getHash().split('?')[1]) || '');
    var page = parseInt(qs.get('page') || '1') || 1;
    var type = qs.get('listing_type') || '';
    var city = qs.get('city')         || '';
    var sub  = qs.get('subcategory')  || '';
    var sort = qs.get('sort')         || 'newest';

    var cur  = qs.get('currency') || '';
    var q = new URLSearchParams({ category: slug, page: page, sort: sort });
    if (type) q.set('listing_type', type);
    if (city) q.set('city', city);
    if (sub)  q.set('subcategory', sub);
    if (cur)  q.set('currency', cur);

    var results = await Promise.all([
      api('GET', '/categories/' + slug),
      api('GET', '/listings?' + q.toString()),
    ]);
    var cat  = results[0] || {};
    var data = results[1] || {};
    var listings = data.listings || [];
    var pagination = data.pagination || { total: 0, page: 1, pages: 1, limit: 24 };

    var idx  = State.categories.findIndex(function(c) { return c.slug === slug; });
    var icon = SECTOR_ICONS[idx >= 0 ? idx % SECTOR_ICONS.length : 0];
    var icCls = 'ic-' + (idx >= 0 ? idx % 18 : 0);

    function catLink(overrides) {
      var p = { sort: sort };
      if (type) p.listing_type = type;
      if (city) p.city         = city;
      if (sub)  p.subcategory  = sub;
      if (cur)  p.currency     = cur;
      Object.assign(p, overrides);
      Object.keys(p).forEach(function(k) { if (!p[k]) delete p[k]; });
      return '#/kategori/' + slug + '?' + new URLSearchParams(p).toString();
    }

    var activeFilters = [type, city, sub, cur].filter(Boolean).length;

    var subSidebar = '<div class="filter-block"><div class="filter-block-title">Alt Kategori</div><div class="filter-block-body">' +
      '<a class="filter-radio' + (!sub?' active':'') + '" href="' + catLink({subcategory:''}) + '"><span class="radio-dot' + (!sub?' checked':'') + '"></span> Tümü</a>' +
      (cat.subcategories || []).map(function(s) {
        return '<a class="filter-radio' + (sub==s.id?' active':'') + '" href="' + catLink({subcategory:s.id}) + '"><span class="radio-dot' + (sub==s.id?' checked':'') + '"></span> ' + esc(s.name) + '</a>';
      }).join('') +
      '</div></div>';

    var sidebar =
      (activeFilters > 0 ? '<a href="#/kategori/' + slug + '" class="btn btn-ghost btn-sm w-100" style="margin-bottom:10px;">Filtreleri Temizle (' + activeFilters + ')</a>' : '') +
      subSidebar +
      filterSidebar([
        { title:'İlan Türü',   name:'f_type', current:type, options:[['','Tümü'],['sell','Satılır'],['buy','Alınır']], linkFn: function(v){ return catLink({listing_type:v}); } },
        { title:'Sıralama',    name:'f_sort', current:sort, options:[['newest','En Yeni'],['oldest','En Eski'],['price_asc','Ucuzdan Pahalıya'],['price_desc','Pahalıdan Ucuza'],['views','En Çok Görüntülenen']], linkFn: function(v){ return catLink({sort:v}); } },
        { title:'Şehir',       name:'f_city', current:city, options:[['','Tümü']].concat(CITIES.map(function(c){return[c,c];})), linkFn: function(v){ return catLink({city:v}); } },
        { title:'Fiyat Türü',  name:'f_ptype', current:'',  options:[['','Tümü'],['fixed','Sabit Fiyat'],['negotiable','Pazarlık Usulü'],['on_request','Fiyat Sorunuz']], linkFn: function(v){ return catLink({price_type:v}); } },
        { title:'Para Birimi', name:'f_cur',  current:cur,  options:[['','Tümü'],['TRY','₺ TRY'],['USD','$ USD'],['EUR','€ EUR']], linkFn: function(v){ return catLink({currency:v}); } },
      ]);

    var emptyState = '<div class="empty-state">' +
      '<div class="empty-state-icon"><span class="cat-icon-wrap ' + icCls + '" style="width:64px;height:64px;border-radius:20px;display:inline-flex;">' + icon + '</span></div>' +
      '<div class="empty-state-title">' + (activeFilters > 0 ? 'Bu filtreye uygun ilan yok.' : 'Bu sektörde henüz ilan yok.') + '</div>' +
      '<div class="empty-state-sub">' + (activeFilters > 0 ? '<a href="#/kategori/'+slug+'" style="color:var(--blue);">Filtreleri temizleyin</a> veya başka bir arama deneyin.' : (isLoggedIn() ? 'Bu sektörde ilk ilanı siz verin.' : 'İlan vermek için üye olun.')) + '</div>' +
      (isLoggedIn() ? '<a href="#/ilan-ver" class="btn btn-accent" style="margin-top:16px;">İlan Ver</a>' : '<a href="#/kayit" class="btn btn-accent" style="margin-top:16px;">Üye Ol</a>') +
      '</div>';

    document.getElementById('app').innerHTML =
      '<div class="cat-hero"><div class="container"><div class="cat-hero-inner">' +
        '<span class="cat-icon-wrap ' + icCls + ' cat-hero-icon">' + icon + '</span>' +
        '<div><div class="cat-hero-label"><a href="#/" style="color:inherit;opacity:.7;">Ana Sayfa</a> / İlanlar</div>' +
        '<h1 class="cat-hero-title">' + esc(cat.name || slug) + '</h1>' +
        '<p class="cat-hero-desc">' + esc(cat.description || '') + '</p></div>' +
      '</div></div></div>' +
      '<div class="container" style="padding-top:0;">' +
        '<div class="page-layout">' +
          '<aside class="filter-sidebar">' + sidebar + '</aside>' +
          '<div>' +
            '<div class="section-header" style="margin-bottom:20px;">' +
              '<div style="font-size:.85rem;color:var(--text-muted);">' +
                (pagination.total > 0 ? '<strong style="color:var(--navy);">' + pagination.total + '</strong> ilan bulundu' : 'Sonuç bulunamadı') +
              '</div>' +
              (isLoggedIn() ? '<a href="#/ilan-ver" class="btn btn-accent btn-sm">+ İlan Ver</a>' : '<a href="#/giris" class="btn btn-ghost btn-sm">Giriş Yap</a>') +
            '</div>' +
            (listings.length ? '<div class="listing-grid">' + listings.map(listingCardHTML).join('') + '</div>' : emptyState) +
            paginationHTML(pagination, catLink({})) +
          '</div>' +
        '</div>' +
      '</div>';
  } catch(err) {
    console.error('[renderCategory]', err);
    document.getElementById('app').innerHTML =
      '<div class="container" style="padding:60px 0;text-align:center;">' +
        '<p class="text-muted">Kategori yüklenemedi.</p>' +
        '<p style="font-size:.8rem;color:var(--text-muted);margin-top:8px;">' + esc(err.message || '') + '</p>' +
        '<a href="#/" class="btn btn-primary" style="margin-top:16px;">Ana Sayfaya Dön</a>' +
      '</div>';
  }
}
// Filtre bloğu — radio yerine <a href> kullanır
function filterSidebar(blocks) {
  return blocks.map(function(b) {
    var opts = b.options;
    var scrollable = opts.length > 8;
    var bodyStyle = scrollable ? ' style="max-height:200px;overflow-y:auto;padding-right:4px;"' : '';
    return '<div class="filter-block"><div class="filter-block-title">' + b.title + '</div><div class="filter-block-body"' + bodyStyle + '>' +
      opts.map(function(opt) {
        var v = opt[0]; var l = opt[1];
        var active = b.current === v;
        return '<a class="filter-radio' + (active?' active':'') + '" href="' + b.linkFn(v) + '">' +
          '<span class="radio-dot' + (active?' checked':'') + '"></span> ' + esc(l) +
          '</a>';
      }).join('') +
      '</div></div>';
  }).join('');
}

// ================================================================
// İLAN DETAY
// ================================================================
async function renderListingDetail(params) {
  var l;
  try {
    l = await api('GET', '/listings/' + params.id);
  } catch(err) {
    var appEl = document.getElementById('app');
    if (appEl) appEl.innerHTML = '<div class="container" style="padding:40px 16px;text-align:center;"><div class="alert alert-error">' + (err.message && err.message.includes('404') ? 'İlan bulunamadı.' : 'Bir hata oluştu, lütfen tekrar deneyin.') + '</div><a href="#/" class="btn btn-primary" style="margin-top:16px;">Ana Sayfaya Dön</a></div>';
    return;
  }
  var app = document.getElementById('app');
  var imgs = l.images || [];

  var statusTR = { active:'Aktif', pending:'Onay Bekliyor', rejected:'Reddedildi', sold:'Satıldı', expired:'Süresi Doldu' };

  var gallery = imgs.length
    ? '<img class="listing-main-img" id="mainImg" src="/uploads/' + imgs[0].filename + '" alt="' + esc(l.title) + '" />' +
      (imgs.length > 1 ? '<div class="listing-thumbnails">' + imgs.map(function(img, i) {
        return '<img class="listing-thumb' + (i===0?' active':'') + '" src="/uploads/' + img.filename + '" data-src="/uploads/' + img.filename + '" />';
      }).join('') + '</div>' : '')
    : '<div style="height:280px;background:var(--bg);border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;color:var(--text-muted);border:1px solid var(--border);">Görsel Eklenmemiş</div>';

  var myControls = '';
  if (State.user && State.user.id === l.user_id) {
    var canSell   = (l.status === 'active' || l.status === 'pending');
    var canRenew  = (l.status === 'active' || l.status === 'expired');
    myControls = '<div class="card"><div class="card-header">İlan İşlemleri</div><div class="card-body" style="display:flex;flex-direction:column;gap:8px;">' +
      '<a href="#/ilan-duzenle/' + l.id + '" class="btn btn-outline w-100">Düzenle</a>' +
      (canRenew ? '<button class="btn btn-outline w-100" id="renewBtn">30 Gün Uzat</button>' : '') +
      (canSell  ? '<button class="btn btn-success w-100" id="soldBtn">Satıldı Olarak İşaretle</button>' : '') +
      '<button class="btn btn-danger w-100" id="delBtn">İlanı Sil</button>' +
      '</div></div>';
  }

  // Favori + Paylaş + Rapor (giriş yapılmışsa)
  var favBtn = '';
  var shareBtn = '<button type="button" class="btn btn-outline btn-sm" id="shareBtn" style="gap:6px;">Paylaş</button>';
  var reportBtn = '';
  if (isLoggedIn() && State.user && State.user.id !== l.user_id) {
    favBtn = '<button type="button" class="btn btn-outline btn-sm" id="favBtn" style="gap:6px;display:inline-flex;align-items:center;"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><circle cx="12" cy="12" r="8"/></svg> Favoriye Ekle</button>';
    reportBtn = '<button type="button" class="btn btn-ghost btn-sm" id="reportBtn" style="color:var(--text-muted);font-size:.78rem;">Şikayet Et</button>';
  }

  // Başkasının ilanıysa Mesaj Gönder kartı
  var msgCard = '';
  if (isLoggedIn() && State.user && State.user.id !== l.user_id) {
    msgCard = '<div class="card mb-4"><div class="card-header">Satıcıyla İletişim</div><div class="card-body">' +
      '<p style="font-size:.85rem;color:var(--text-muted);margin-bottom:12px;">Platform içinden güvenli mesaj gönderin.</p>' +
      '<textarea id="quickMsgInput" class="form-control" rows="3" placeholder="Merhaba, ürününüz hakkında bilgi almak istiyorum..."></textarea>' +
      '<button class="btn btn-primary w-100" id="sendMsgBtn" style="margin-top:10px;">Mesaj Gönder</button>' +
      '</div></div>';
  } else if (!isLoggedIn()) {
    msgCard = '<div class="card mb-4"><div class="card-body" style="text-align:center;">' +
      '<p style="font-size:.87rem;color:var(--text-muted);margin-bottom:10px;">Satıcıya mesaj göndermek için giriş yapın.</p>' +
      '<a href="#/giris" class="btn btn-primary w-100">Giriş Yap</a>' +
      '</div></div>';
  }

  app.innerHTML =
    '<div class="container">' +
      (l.status !== 'active' && isAdmin() ? '<div class="alert alert-warning" style="margin:16px 0 0;">⚠️ Bu ilan <strong>' + (l.status==='pending'?'onay bekliyor':l.status) + '</strong> durumunda. <button type="button" class="btn btn-success btn-sm" id="quickApproveBtn" style="margin-left:8px;">Onayla</button> <button type="button" class="btn btn-danger btn-sm" id="quickRejectBtn" style="margin-left:4px;">Reddet</button></div>' : '') +
      '<div class="breadcrumb"><a href="#/">Anasayfa</a><span class="breadcrumb-sep">/</span>' +
      '<a href="#/kategori/' + (l.category_slug||'') + '">' + esc(l.category_name||'') + '</a>' +
      '<span class="breadcrumb-sep">/</span><span>' + esc(l.title) + '</span></div>' +
      '<div class="listing-detail"><div class="listing-detail-grid">' +
        '<div>' +
          gallery +
          '<div class="card mt-6"><div class="card-header">Açıklama</div><div class="card-body"><div class="listing-desc">' + esc(l.description) + '</div></div></div>' +
          '<div class="card mt-4"><div class="card-header">İlan Bilgileri</div><div class="card-body" style="display:flex;flex-direction:column;gap:10px;">' +
            infoRow('Sektör', l.category_name) + infoRow('Alt Kategori', l.subcategory_name) +
            (l.quantity ? infoRow('Miktar', l.quantity + ' ' + (l.quantity_unit||'')) : '') +
            (l.lot_quantity && l.lot_quantity > 0 ? infoRow('Lot Adedi', l.lot_quantity + ' lot/adet') : '') +
            (l.price && l.price_basis === 'per_unit' && l.lot_quantity && l.lot_quantity > 0
              ? infoRow('Toplam Fiyat', (function(){ var sym=l.currency==='USD'?'$':l.currency==='EUR'?'€':'₺'; return sym+(parseFloat(l.price)*parseInt(l.lot_quantity)).toLocaleString('tr-TR')+' ('+l.lot_quantity+' lot × '+formatPrice(l)+')'; })())
              : '') +
            infoRow('İlan Türü', l.listing_type==='sell'?'Satılır':'Alınır') +
            infoRow('Konum', l.city + (l.district?' / '+l.district:'')) +
            infoRow('Görüntülenme', l.views) +
            infoRow('İlan Tarihi', new Date(l.created_at).toLocaleDateString('tr-TR')) +
          '</div></div>' +
          (l.tags && l.tags.length ? '<div class="card mt-4"><div class="card-header">Etiketler</div><div class="card-body" style="display:flex;flex-wrap:wrap;gap:6px;">' +
            l.tags.map(function(t){ return '<span style="background:var(--bg-soft);border:1px solid var(--border);border-radius:20px;padding:3px 12px;font-size:.78rem;color:var(--text-mid);">' + esc(t) + '</span>'; }).join('') +
          '</div></div>' : '') +
        '</div>' +
        '<div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">' +
            '<span class="badge badge-' + l.listing_type + '">' + (l.listing_type==='sell'?'Satılır':'Alınır') + '</span>' +
            '<span class="badge badge-' + l.status + '">' + (statusTR[l.status]||l.status) + '</span>' +
          '</div>' +
          '<h1 style="font-size:1.35rem;font-weight:800;color:var(--navy);line-height:1.3;margin-bottom:16px;">' + esc(l.title) + '</h1>' +
          (function(){
            var sym = (l.currency==='USD'?'$':l.currency==='EUR'?'€':'₺');
            var lotQty = l.lot_quantity ? parseInt(l.lot_quantity) : 0;
            var priceVal = l.price ? parseFloat(l.price) : 0;
            var basisLabel = l.price && l.price_basis ? (l.price_basis==='total'?'Toplam fiyat':'Birim/Lot başı fiyat') : '';
            var calcLine = '';
            var lotLine  = lotQty > 0 ? '<div class="text-muted fs-sm">Toplam lot: <strong>' + lotQty.toLocaleString('tr-TR') + ' lot</strong></div>' : '';
            if (priceVal > 0 && lotQty > 0) {
              if (l.price_basis === 'total') {
                var perLot = (priceVal/lotQty).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
                calcLine = '<div class="text-muted fs-sm" style="color:var(--blue);font-weight:600;">≈ Lot başına: ' + sym + perLot + '</div>';
              } else if (l.price_basis === 'per_unit') {
                var tot = (priceVal*lotQty).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
                calcLine = '<div class="text-muted fs-sm" style="color:var(--blue);font-weight:600;">Toplam: ' + sym + tot + '</div>';
              }
            }
            return '<div class="listing-price-box mb-4">' +
              '<div class="listing-price-main">' + formatPrice(l) + '</div>' +
              (l.price_type==='negotiable' ? '<div class="text-muted fs-sm">Fiyat pazarlıklıdır.</div>' : '') +
              (basisLabel ? '<div class="text-muted fs-sm">' + basisLabel + '</div>' : '') +
              calcLine +
              lotLine +
            '</div>';
          })() +
          '<div class="listing-contact-card mb-4">' +
            '<div style="font-size:.95rem;font-weight:700;color:var(--navy);margin-bottom:4px;">Satıcı Bilgileri</div>' +
            '<a href="#/satici/' + l.user_id + '" class="btn btn-ghost btn-sm w-100" style="margin-bottom:8px;">🏢 Firmanın Tüm İlanları</a>' +
            infoRow('Firma / Kişi', l.company_name||l.seller_name) + infoRow('Konum', l.seller_city) +
            (l.contact_phone ? '<a href="tel:' + l.contact_phone + '" class="btn btn-primary w-100">' + esc(l.contact_phone) + '</a>' : '') +
            (l.contact_email ? '<a href="mailto:' + l.contact_email + '" class="btn btn-outline w-100">E-posta Gönder</a>' : '') +
            (l.website && /^https?:\/\//i.test(l.website) ? '<a href="' + esc(l.website) + '" target="_blank" rel="noopener noreferrer" class="btn btn-ghost w-100">Web Sitesi</a>' : '') +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">' + favBtn + shareBtn + reportBtn + '</div>' +
          msgCard +
          myControls +
        '</div>' +
      '</div></div>' +
    '</div>';

  // Admin hızlı onayla/reddet
  var qaBtn = document.getElementById('quickApproveBtn');
  var qrBtn = document.getElementById('quickRejectBtn');
  if (qaBtn) qaBtn.addEventListener('click', async function() {
    try { await api('PATCH', '/admin/listings/' + l.id + '/approve'); toast('Onaylandı.', 'success'); goTo('/admin'); }
    catch(e) { toast(e.message, 'error'); }
  });
  if (qrBtn) qrBtn.addEventListener('click', async function() {
    var reason = prompt('Reddetme nedeni (isteğe bağlı):') || '';
    try { await api('PATCH', '/admin/listings/' + l.id + '/reject', { reason }); toast('Reddedildi.', 'success'); goTo('/admin'); }
    catch(e) { toast(e.message, 'error'); }
  });

  // Thumbnail tıklama
  document.querySelectorAll('.listing-thumb').forEach(function(thumb) {
    thumb.addEventListener('click', function() {
      var mainImg = document.getElementById('mainImg');
      if (mainImg) mainImg.src = thumb.dataset.src;
      document.querySelectorAll('.listing-thumb').forEach(function(t) { t.classList.remove('active'); });
      thumb.classList.add('active');
    });
  });

  // İlan sahibi butonları
  var soldBtn = document.getElementById('soldBtn');
  var delBtn  = document.getElementById('delBtn');
  if (soldBtn) soldBtn.addEventListener('click', async function() {
    if (!confirm('Satıldı olarak işaretlensin mi?')) return;
    try { await api('PATCH', '/listings/' + l.id + '/sold'); toast('İşaretlendi.','success'); goTo('/hesabim'); }
    catch(e) { toast(e.message,'error'); }
  });
  if (delBtn) delBtn.addEventListener('click', async function() {
    if (!confirm('Bu ilan kalıcı olarak silinecek. Emin misiniz?')) return;
    try { await api('DELETE', '/listings/' + l.id); toast('Silindi.','success'); goTo('/hesabim'); }
    catch(e) { toast(e.message,'error'); }
  });

  var sendMsgBtn = document.getElementById('sendMsgBtn');
  if (sendMsgBtn) sendMsgBtn.addEventListener('click', async function() {
    var content = document.getElementById('quickMsgInput').value.trim();
    if (!content) { toast('Mesaj boş olamaz.', 'warning'); return; }
    sendMsgBtn.disabled = true; sendMsgBtn.textContent = 'Gönderiliyor...';
    try {
      var r = await api('POST', '/messages', { to_user_id: l.user_id, listing_id: l.id, content: content });
      toast('Mesajınız iletildi!', 'success');
      goTo('/mesajlar/' + r.conversation_id);
    } catch(e) {
      toast(e.message, 'error');
      sendMsgBtn.disabled = false; sendMsgBtn.textContent = 'Mesaj Gönder';
    }
  });

  // ---- Favori butonu ----
  var favBtn = document.getElementById('favBtn');
  if (favBtn) {
    // Check current fav state
    api('GET', '/favorites/check/' + l.id).then(function(d) {
      if (d.isFavorite) { favBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><circle cx="12" cy="12" r="8"/></svg> Favoriden Çıkar'; favBtn.dataset.fav = '1'; }
    }).catch(function(){});
    favBtn.addEventListener('click', async function() {
      var isFav = favBtn.dataset.fav === '1';
      try {
        if (isFav) {
          await api('DELETE', '/favorites/' + l.id);
          favBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><circle cx="12" cy="12" r="8"/></svg> Favoriye Ekle'; favBtn.dataset.fav = '0';
          toast('Favorilerden çıkarıldı.', 'success');
        } else {
          await api('POST', '/favorites/' + l.id);
          favBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><circle cx="12" cy="12" r="8"/></svg> Favoriden Çıkar'; favBtn.dataset.fav = '1';
          toast('Favorilere eklendi!', 'success');
        }
      } catch(e) { toast(e.message, 'error'); }
    });
  }

  // ---- Paylaş butonu ----
  var shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function() {
      var url = window.location.origin + window.location.pathname + '#/ilan/' + l.id;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function() { toast('Bağlantı kopyalandı!', 'success'); });
      } else {
        prompt('Bu bağlantıyı kopyalayın:', url);
      }
    });
  }

  // ---- Şikayet et ----
  var reportBtn = document.getElementById('reportBtn');
  if (reportBtn) {
    reportBtn.addEventListener('click', function() {
      var reason = prompt('Şikayet sebebini seçin:\n1. Spam / Yanıltıcı\n2. Yasadışı içerik\n3. Yanlış kategori\n4. Kopya ilan\n5. Diğer\n\nNumara veya metin girin:');
      if (!reason) return;
      var reasons = { '1':'Spam / Yanıltıcı', '2':'Yasadışı içerik', '3':'Yanlış kategori', '4':'Kopya ilan', '5':'Diğer' };
      var text = reasons[reason.trim()] || reason;
      api('POST', '/reports/' + l.id, { reason: text }).then(function() {
        toast('Şikayetiniz alındı, incelenecektir.', 'success');
      }).catch(function(e) { toast(e.message, 'error'); });
    });
  }

  // ---- Yenile butonu ----
  var renewBtn = document.getElementById('renewBtn');
  if (renewBtn) {
    renewBtn.addEventListener('click', async function() {
      if (!confirm('İlan 30 gün uzatılsın mı?')) return;
      try {
        await api('PATCH', '/listings/' + l.id + '/renew');
        toast('İlan 30 gün uzatıldı!', 'success');
      } catch(e) { toast(e.message, 'error'); }
    });
  }


}


// Form alanı event listener'larını kur (onchange attribute kullanmadan)
function setupFormListeners() {
  var catSel = document.getElementById('category_id');
  if (catSel) {
    catSel.addEventListener('change', function() {
      loadSubcats(this.value);
    });
  }
  var priceTypeSel = document.getElementById('priceTypeSelect');
  if (priceTypeSel) {
    priceTypeSel.addEventListener('change', togglePriceInput);
  }

}

// ================================================================
// İLAN FORMU (ortak)
// ================================================================
var _pendingFiles  = [];
var _toDeleteImgs  = new Set();

function listingFormHTML(l) {
  l = l || {};
  return '<div class="grid-2">' +
    '<div class="form-group" style="grid-column:1/-1;"><label class="form-label">Başlık <span class="req">*</span></label><input type="text" name="title" class="form-control" value="' + esc(l.title||'') + '" placeholder="Örn: Soda Külü, 50 Ton, Sertifikalı" maxlength="150" required /></div>' +
    '<div class="form-group"><label class="form-label">Sektör <span class="req">*</span></label>' + catSelectHTML(l.category_id) + '</div>' +
    '<div class="form-group"><label class="form-label">Alt Kategori</label><select name="subcategory_id" class="form-control" id="subcategory_id"><option value="">— Önce Sektör Seçin —</option></select></div>' +
    '<div class="form-group"><label class="form-label">İlan Türü <span class="req">*</span></label><select name="listing_type" class="form-control"><option value="sell"' + (l.listing_type==='sell'||!l.listing_type?' selected':'') + '>Satılır</option><option value="buy"' + (l.listing_type==='buy'?' selected':'') + '>Alınır (Satın Almak İstiyorum)</option></select></div>' +
    '<div class="form-group"><label class="form-label">Fiyat Türü</label><select name="price_type" class="form-control" id="priceTypeSelect"><option value="fixed"' + (l.price_type==='fixed'||!l.price_type?' selected':'') + '>Sabit Fiyat</option><option value="negotiable"' + (l.price_type==='negotiable'?' selected':'') + '>Pazarlık Usulü</option><option value="on_request"' + (l.price_type==='on_request'?' selected':'') + '>Fiyat Sorunuz</option></select></div>' +
    '<div class="form-group" id="priceInputGroup"' + (l.price_type==='on_request'?' style="display:none"':'') + '>' +
      '<label class="form-label">Fiyat (₺)</label>' +
      '<div style="display:flex;gap:8px;">' +
        '<select name="currency" class="form-control" style="width:100px;flex-shrink:0;">' +
          '<option value="TRY"' + ((!l.currency||l.currency==='TRY')?' selected':'') + '>₺ TRY</option>' +
          '<option value="USD"' + (l.currency==='USD'?' selected':'') + '>$ USD</option>' +
          '<option value="EUR"' + (l.currency==='EUR'?' selected':'') + '>€ EUR</option>' +
        '</select>' +
        '<input type="number" name="price" id="priceInput" class="form-control" value="' + (l.price||'') + '" placeholder="0.00" min="0" step="0.01" />' +
      '</div>' +
      '<div style="display:flex;gap:12px;margin-top:8px;">' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:.85rem;cursor:pointer;">' +
          '<input type="radio" name="price_basis" value="per_unit"' + (l.price_basis==='total'?'':' checked') + '> Birim / Lot Başı Fiyat' +
        '</label>' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:.85rem;cursor:pointer;">' +
          '<input type="radio" name="price_basis" value="total"' + (l.price_basis==='total'?' checked':'') + '> Toplam Fiyat' +
        '</label>' +
      '</div>' +
    '</div>' +
    '<div class="form-group"><label class="form-label">Miktar</label><input type="number" name="quantity" class="form-control" value="' + (l.quantity||'') + '" placeholder="Örn: 1000" min="0" /></div>' +

    '<div class="form-group"><label class="form-label">Birim</label><select name="quantity_unit" class="form-control">' + ['','Ton','Kg','Litre','m³','Adet','Palet','Lot','Konteyner','Fıçı','m²','m'].map(function(u){ return '<option value="'+u+'"'+(l.quantity_unit===u?' selected':'')+'>'+(u||'— Birim Seçin —')+'</option>'; }).join('') + '</select></div>' +
    '<div class="form-group"><label class="form-label">Şehir <span class="req">*</span></label>' + citySelectHTML('city', l.city) + '</div>' +
    '<div class="form-group"><label class="form-label">İlçe</label><input type="text" name="district" class="form-control" value="' + esc(l.district||'') + '" placeholder="Örn: Pendik" /></div>' +
    '<div class="form-group"><label class="form-label">İletişim Telefonu <span class="req">*</span></label><input type="tel" name="contact_phone" class="form-control" value="' + esc(l.contact_phone||'+90 ') + '" placeholder="+90 5XX XXX XX XX" required /></div>' +
    '<div class="form-group"><label class="form-label">İletişim E-postası</label><input type="email" name="contact_email" class="form-control" value="' + esc(l.contact_email||'') + '" placeholder="firma@ornek.com" /></div>' +
    '<div class="form-group" style="grid-column:1/-1;"><label class="form-label">Web Sitesi</label><input type="url" name="website" class="form-control" value="' + esc(l.website||'') + '" placeholder="https://www.firma.com" /></div>' +
    '<div class="form-group" style="grid-column:1/-1;"><label class="form-label">Açıklama <span class="req">*</span></label><textarea name="description" class="form-control" rows="7" placeholder="Ürün özellikleri, kalite standardı, ambalaj türü, teslimat koşulları..." required>' + esc(l.description||'') + '</textarea></div>' +
    '<div class="form-group" style="grid-column:1/-1;">' +
      '<label class="form-label">Görseller (en fazla 8, her biri 5 MB)</label>' +
      '<div class="upload-area" id="uploadArea"><p><strong>Tıklayın veya sürükleyin</strong><br/>JPG, PNG veya WebP</p></div>' +
      '<div class="upload-previews" id="uploadPreviews"></div>' +
      '<input type="file" id="imgInput" accept=".jpg,.jpeg,.png,.webp" multiple style="display:none" />' +
    '</div>' +
  '</div>';
}

function setupUpload() {
  _pendingFiles = [];
  var area  = document.getElementById('uploadArea');
  var input = document.getElementById('imgInput');
  if (!area || !input) return;
  area.addEventListener('click', function() { input.click(); });
  area.addEventListener('dragover', function(e) { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', function() { area.classList.remove('drag-over'); });
  area.addEventListener('drop', function(e) { e.preventDefault(); area.classList.remove('drag-over'); addFiles(e.dataTransfer.files); });
  input.addEventListener('change', function() { addFiles(input.files); });
}

function addFiles(files) {
  var preview = document.getElementById('uploadPreviews');
  Array.from(files).forEach(function(file) {
    if (_pendingFiles.length >= 8) { toast('En fazla 8 görsel yükleyebilirsiniz.','warning'); return; }
    _pendingFiles.push(file);
    var reader = new FileReader();
    var idx = _pendingFiles.length - 1;
    reader.onload = function(e) {
      var div = document.createElement('div');
      div.className = 'upload-preview-item';
      div.dataset.idx = idx;
      div.innerHTML = '<img src="' + e.target.result + '" /><button type="button" class="upload-preview-remove">✕</button>';
      div.querySelector('.upload-preview-remove').addEventListener('click', function() {
        _pendingFiles.splice(parseInt(div.dataset.idx), 1);
        div.remove();
        document.querySelectorAll('.upload-preview-item').forEach(function(d, i) { d.dataset.idx = i; });
      });
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}
async function renderCreateListing() {
  _pendingFiles = [];
  document.getElementById('app').innerHTML =
    '<div class="container" style="max-width:820px;padding:32px 24px;">' +
      '<div class="breadcrumb"><a href="#/">Anasayfa</a><span class="breadcrumb-sep">/</span><span>İlan Ver</span></div>' +
      '<div class="card"><div class="card-header">Yeni İlan Oluştur</div><div class="card-body">' +
        '<div class="alert alert-info">İlanınız moderasyon onayından sonra yayına alınır.</div>' +
        '<form id="createForm">' + listingFormHTML(null) +
          '<hr style="border:none;border-top:1px solid var(--border);margin:22px 0;" />' +
          '<div class="d-flex gap-3 align-center"><button type="submit" class="btn btn-accent btn-lg" id="createBtn">İlanı Gönder</button><a href="#/hesabim" class="btn btn-ghost">İptal</a></div>' +
        '</form>' +
      '</div></div>' +
    '</div>';

  setupUpload();
  setupFormListeners();
  togglePriceInput();

  document.getElementById('createForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = document.getElementById('createBtn');
    btn.disabled = true; btn.textContent = 'Gönderiliyor...';
    try {
      var fd = new FormData(e.target);
      var phoneErr = validateTurkishPhone(fd.get('contact_phone'));
      if (phoneErr) { toast(phoneErr, 'error'); btn.disabled = false; btn.textContent = 'İlanı Gönder'; return; }
      _pendingFiles.forEach(function(f) { fd.append('images', f); });
      var res = await api('POST', '/listings', fd, true);
      toast(res.message, 'success');
      goTo('/ilan/' + res.listing_id);
    } catch(err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'İlanı Gönder';
    }
  });
}

// ================================================================
// İLAN DÜZENLE
// ================================================================
async function renderEditListing(params) {
  var id = params.id;
  _pendingFiles = []; _toDeleteImgs = new Set();
  var l;
  try {
    l = await api('GET', '/listings/' + id);
  } catch(err) {
    document.getElementById('app').innerHTML =
      '<div class="container" style="padding:60px 24px;text-align:center;">' +
      '<div class="alert alert-error">' + (err.message && err.message.includes('404') ? 'İlan bulunamadı.' : 'Yüklenirken hata oluştu.') + '</div>' +
      '<a href="#/hesabim" class="btn btn-primary" style="margin-top:16px;">Hesabıma Dön</a></div>';
    return;
  }
  if (!State.user || State.user.id !== l.user_id) { goTo('/hesabim'); return; }

  document.getElementById('app').innerHTML =
    '<div class="container" style="max-width:820px;padding:32px 24px;">' +
      '<div class="card"><div class="card-header">İlanı Düzenle</div><div class="card-body">' +
        '<div class="alert alert-warning">Güncelleme sonrası ilan tekrar moderasyona gönderilir.</div>' +
        '<form id="editForm">' + listingFormHTML(l) +
          (l.images && l.images.length ? '<div class="form-group mt-4"><label class="form-label">Mevcut Görseller</label><div class="d-flex flex-wrap gap-2" id="existingImgs">' +
            l.images.map(function(img) { return '<div class="upload-preview-item" id="eimg_' + img.id + '"><img src="/uploads/'+img.filename+'" /><button type="button" class="upload-preview-remove" data-imgid="' + img.id + '">✕</button></div>'; }).join('') +
          '</div></div>' : '') +
          '<hr style="border:none;border-top:1px solid var(--border);margin:22px 0;" />' +
          '<div class="d-flex gap-3 align-center"><button type="submit" class="btn btn-accent btn-lg" id="editBtn">Güncelle</button><a href="#/ilan/' + id + '" class="btn btn-ghost">İptal</a></div>' +
        '</form>' +
      '</div></div>' +
    '</div>';

  setupUpload();
  setupFormListeners();
  togglePriceInput();

  document.querySelectorAll('.upload-preview-remove[data-imgid]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var imgId = parseInt(btn.dataset.imgid);
      _toDeleteImgs.add(imgId);
      var el = document.getElementById('eimg_' + imgId);
      if (el) el.remove();
    });
  });

  if (l.category_id) {
    await loadSubcats(l.category_id);
    var sub = document.getElementById('subcategory_id');
    if (sub && l.subcategory_id) sub.value = l.subcategory_id;
  }

  document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = document.getElementById('editBtn');
    btn.disabled = true; btn.textContent = 'Güncelleniyor...';
    try {
      var fd = new FormData(e.target);
      var phoneErr = validateTurkishPhone(fd.get('contact_phone'));
      if (phoneErr) { toast(phoneErr, 'error'); btn.disabled = false; btn.textContent = 'Güncelle'; return; }
      _toDeleteImgs.forEach(function(imgId) { fd.append('delete_images', imgId); });
      _pendingFiles.forEach(function(f) { fd.append('images', f); });
      var res = await api('PUT', '/listings/' + id, fd, true);
      toast(res.message, 'success');
      goTo('/ilan/' + id);
    } catch(err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Güncelle';
    }
  });
}

// ================================================================
// HESABIM
// ================================================================
async function renderDashboard() {
  if (!isLoggedIn()) { goTo('/giris'); return; }
  var results, me, listings;
  try {
    results = await Promise.all([api('GET','/auth/me'), api('GET','/listings/my/listings')]);
    me = results[0]; listings = results[1];
  } catch(err) {
    document.getElementById('app').innerHTML = '<div class="container" style="padding:40px 16px;text-align:center;"><div class="alert alert-error">Sayfa yüklenemedi: ' + esc(err.message||'Bilinmeyen hata') + '</div></div>';
    return;
  }
  var statusTR = { pending:'Onay Bekliyor', active:'Aktif', rejected:'Reddedildi', sold:'Satıldı', expired:'Süresi Doldu' };
  var app = document.getElementById('app');

  var listingRows = listings.map(function(l) {
    return '<tr>' +
      '<td><a href="#/ilan/' + l.id + '" style="color:var(--blue);font-weight:600;">' + esc(l.title) + '</a></td>' +
      '<td>' + esc(l.category_name||'') + '</td>' +
      '<td><span class="badge badge-' + l.status + '">' + (statusTR[l.status]||l.status) + '</span></td>' +
      '<td>' + l.views + '</td>' +
      '<td>' + new Date(l.created_at).toLocaleDateString('tr-TR') + '</td>' +
      '<td><div class="d-flex gap-2">' +
        '<a href="#/ilan-duzenle/' + l.id + '" class="btn btn-ghost btn-sm">Düzenle</a>' +
        (l.status!=='sold' ? '<button class="btn btn-ghost btn-sm" data-sold="'+l.id+'">Satıldı</button>' : '') +
        '<button class="btn btn-danger btn-sm" data-del="'+l.id+'">Sil</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  app.innerHTML =
    '<div class="dash-header"><div class="container"><h1>Hesabım</h1><p>Hoş geldiniz, ' + esc(me.name) + (me.company_name ? ' · ' + esc(me.company_name) : '') + '</p></div></div>' +
    '<div class="container" style="padding:28px 24px;">' +
      '<div class="dash-tabs"><button class="dash-tab active" data-tab="ilanlar">İlanlarım</button><button class="dash-tab" data-tab="profil">Profilim</button></div>' +
      '<div id="tab_ilanlar" class="tab-content active">' +
        '<div class="section-header"><div class="section-title">İlanlarım <span class="text-muted fs-sm">(' + listings.length + ')</span></div><a href="#/ilan-ver" class="btn btn-accent">+ Yeni İlan</a></div>' +
        (listings.length
          ? '<div class="table-wrapper"><table><thead><tr><th>Başlık</th><th>Sektör</th><th>Durum</th><th>Görüntülenme</th><th>Tarih</th><th>İşlemler</th></tr></thead><tbody>' + listingRows + '</tbody></table></div>'
          : '<div class="empty-state"><div class="empty-state-title">Henüz ilanınız yok.</div><a href="#/ilan-ver" class="btn btn-accent">İlan Ver</a></div>') +
      '</div>' +
      '<div id="tab_profil" class="tab-content">' +
        '<div class="card" style="max-width:540px;">' +
          '<div class="card-header">Profil Bilgileri</div>' +
          '<div class="card-body">' +
            '<form id="profileForm">' +
              '<div class="form-group mb-4"><label class="form-label">Ad Soyad <span class="req">*</span></label><input type="text" name="name" class="form-control" value="' + esc(me.name) + '" required /></div>' +
              '<div class="form-group mb-4"><label class="form-label">Firma Adı</label><input type="text" name="company_name" class="form-control" value="' + esc(me.company_name||'') + '" /></div>' +
              '<div class="form-group mb-4"><label class="form-label">Telefon</label><input type="tel" name="phone" class="form-control" value="' + esc(me.phone||'+90 ') + '" /></div>' +
              '<div class="form-group mb-4"><label class="form-label">Şehir</label>' + citySelectHTML('city', me.city) + '</div>' +
              '<hr style="border:none;border-top:1px solid var(--border);margin:20px 0;" />' +
              '<div class="fw-semibold mb-4" style="color:var(--navy);">Şifre Değiştir (isteğe bağlı)</div>' +
              '<div class="form-group mb-4"><label class="form-label">Mevcut Şifre</label><input type="password" name="current_password" class="form-control" /></div>' +
              '<div class="form-group mb-4"><label class="form-label">Yeni Şifre</label><input type="password" name="new_password" class="form-control" /></div>' +
              '<button type="submit" class="btn btn-primary" id="profileBtn">Kaydet</button>' +
              '<hr style="border:none;border-top:1px solid var(--border);margin:28px 0;" />' +
              '<div style="background:#fff5f5;border:1px solid #fecaca;border-radius:var(--r);padding:16px 18px;">' +
                '<div style="font-weight:700;color:#b91c1c;margin-bottom:6px;">Tehlikeli Bölge</div>' +
                '<div style="font-size:.84rem;color:var(--text-mid);margin-bottom:12px;">Hesabınızı sildiğinizde tüm ilanlarınız ve verileriniz kalıcı olarak silinir.</div>' +
                '<button type="button" class="btn btn-danger btn-sm" id="deleteAccountBtn">Hesabımı Sil</button>' +
              '</div>' +
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  // Tab geçişi
  document.querySelectorAll('.dash-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.dash-tab').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
      btn.classList.add('active');
      var t = document.getElementById('tab_' + btn.dataset.tab);
      if (t) t.classList.add('active');
    });
  });

  // Satıldı / Sil butonları
  document.querySelectorAll('[data-sold]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var id = btn.dataset.sold;
      if (!confirm('Satıldı olarak işaretlensin mi?')) return;
      try { await api('PATCH', '/listings/' + id + '/sold'); toast('İşaretlendi.','success'); renderDashboard(); }
      catch(e) { toast(e.message,'error'); }
    });
  });
  document.querySelectorAll('[data-del]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var id = btn.dataset.del;
      if (!confirm('Bu ilan kalıcı olarak silinecek. Emin misiniz?')) return;
      try { await api('DELETE', '/listings/' + id); toast('Silindi.','success'); renderDashboard(); }
      catch(e) { toast(e.message,'error'); }
    });
  });

  // Hesap silme
  document.getElementById('deleteAccountBtn').addEventListener('click', async function() {
    if (!confirm('Hesabınız ve tüm ilanlarınız kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?')) return;
    var confirmed = prompt('Silmek için şifrenizi girin:');
    if (!confirmed) return;
    try {
      await api('DELETE', '/auth/account', { password: confirmed });
      clearAuth();
      toast('Hesabınız silindi.', 'success');
      goTo('/');
    } catch(e) { toast(e.message, 'error'); }
  });

  // Profil formu
  document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = document.getElementById('profileBtn');
    btn.disabled = true; btn.textContent = 'Kaydediliyor...';
    try {
      await api('PUT', '/auth/profile', Object.fromEntries(new FormData(e.target)));
      toast('Profil güncellendi.','success');
    } catch(err) { toast(err.message,'error'); }
    finally { btn.disabled = false; btn.textContent = 'Kaydet'; }
  });
}

// ================================================================
// GİRİŞ
// ================================================================
async function renderLogin() {
  if (isLoggedIn()) { goTo('/'); return; }
  document.getElementById('app').innerHTML =
    '<div class="auth-page">' +
      '<div class="auth-card">' +
        '<h2>Giriş Yap</h2>' +
        '<p>Ticarethane hesabınıza giriş yapın.</p>' +
        '<form id="loginForm">' +
          '<div class="form-group mb-4"><label class="form-label">E-posta <span class="req">*</span></label><input type="email" name="email" class="form-control" placeholder="ornek@firma.com" required autofocus /></div>' +
          '<div class="form-group mb-4"><label class="form-label">Şifre <span class="req">*</span></label><input type="password" name="password" class="form-control" placeholder="Şifreniz" required /></div>' +
          '<div class="form-check mb-3">' +
            '<input type="checkbox" class="form-check-input" id="rememberMe" name="remember" value="1" checked />' +
            '<label class="form-check-label" for="rememberMe" style="cursor:pointer;"> Beni hatırla</label>' +
          '</div>' +
          '<div id="loginError" class="alert alert-error" style="display:none;"></div>' +
          '<div style="text-align:right;margin-bottom:8px;"><a href="#/sifremi-unuttum" style="font-size:.82rem;color:var(--blue);">Şifremi unuttum</a></div>' +
          '<button type="submit" class="btn btn-primary w-100 btn-lg" id="loginBtn">Giriş Yap</button>' +
          '<div class="auth-divider">veya</div>' +
          '<a href="#/kayit" class="btn btn-outline w-100">Üye Ol</a>' +
        '</form>' +
      '</div>' +
    '</div>';

  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn   = document.getElementById('loginBtn');
    var errEl = document.getElementById('loginError');
    btn.disabled = true; btn.textContent = 'Giriş yapılıyor...';
    errEl.style.display = 'none';
    try {
      var fd = new FormData(e.target);
      var remember = fd.has('remember');
      fd.delete('remember');
      var res = await api('POST', '/auth/login', Object.fromEntries(fd));
      setAuth(res.token, res.user, remember);
      updateNavbar();
      toast('Hoş geldiniz, ' + res.user.name + '!', 'success');
      goTo(res.user.role === 'admin' ? '/admin' : '/hesabim');
    } catch(err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Giriş Yap';
    }
  });
}

// ================================================================
// KAYIT
// ================================================================
async function renderRegister() {
  if (isLoggedIn()) { goTo('/'); return; }
  document.getElementById('app').innerHTML =
    '<div class="auth-page">' +
      '<div class="auth-card auth-card-wide">' +
        '<h2>Üye Ol</h2>' +
        '<p>Ücretsiz hesap oluşturun, ilan verin.</p>' +
        '<form id="regForm">' +
          '<div class="grid-2">' +
            '<div class="form-group mb-4"><label class="form-label">Ad Soyad <span class="req">*</span></label><input type="text" name="name" class="form-control" placeholder="Ad Soyad" required /></div>' +
            '<div class="form-group mb-4"><label class="form-label">Firma Adı</label><input type="text" name="company_name" class="form-control" placeholder="Firma Adı A.Ş." /></div>' +
          '</div>' +
          '<div class="form-group mb-4"><label class="form-label">E-posta <span class="req">*</span></label><input type="email" name="email" class="form-control" placeholder="ornek@firma.com" required /></div>' +
          '<div class="grid-2">' +
            '<div class="form-group mb-4"><label class="form-label">Telefon <span class="req">*</span></label><input type="tel" name="phone" class="form-control" value="+90 " placeholder="+90 5XX XXX XX XX" required /></div>' +
            '<div class="form-group mb-4"><label class="form-label">Şehir</label>' + citySelectHTML('city','') + '</div>' +
          '</div>' +
          '<div class="form-group mb-4"><label class="form-label">Şifre <span class="req">*</span></label><input type="password" name="password" class="form-control" placeholder="En az 8 karakter" required minlength="8" /></div>' +
          '<div class="form-check mb-3">' +
            '<input type="checkbox" class="form-check-input" id="rememberReg" name="remember" value="1" checked />' +
            '<label class="form-check-label" for="rememberReg" style="cursor:pointer;"> Beni hatırla</label>' +
          '</div>' +
          '<div id="regError" class="alert alert-error" style="display:none;"></div>' +
          '<button type="submit" class="btn btn-accent w-100 btn-lg" id="regBtn">Üye Ol</button>' +
          '<div class="auth-divider">Zaten hesabınız var mı?</div>' +
          '<a href="#/giris" class="btn btn-outline w-100">Giriş Yap</a>' +
        '</form>' +
      '</div>' +
    '</div>';

  document.getElementById('regForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn   = document.getElementById('regBtn');
    var errEl = document.getElementById('regError');
    btn.disabled = true; btn.textContent = 'Kaydediliyor...';
    errEl.style.display = 'none';
    try {
      var fd = new FormData(e.target);
      var phoneErr = validateTurkishPhone(fd.get('phone'));
      if (phoneErr) { errEl.textContent = phoneErr; errEl.style.display = 'block'; btn.disabled = false; btn.textContent = 'Üye Ol'; return; }
      var remember = fd.has('remember');
      fd.delete('remember');
      var res = await api('POST', '/auth/register', Object.fromEntries(fd));
      setAuth(res.token, res.user, remember);
      updateNavbar();
      toast('Hoş geldiniz! İlk ilanınızı oluşturun.', 'success');
      goTo('/hesabim');
    } catch(err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Üye Ol';
    }
  });
}

// ================================================================
// ADMİN
// ================================================================
// ================================================================
// ADMİN — PANEL
// ================================================================
async function renderAdmin() {
  document.getElementById('app').innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  if (!isAdmin()) {
    if (isLoggedIn()) {
      document.getElementById('app').innerHTML = '<div class="container" style="text-align:center;padding:80px 24px;"><div style="font-size:3rem;">🔒</div><div class="empty-state-title" style="margin-top:12px;">Yetkisiz Erişim</div><a href="#/" class="btn btn-primary" style="margin-top:16px;">Ana Sayfaya Dön</a></div>';
    } else { goTo('/giris'); }
    return;
  }
  var stats;
  try {
    stats = await api('GET', '/admin/stats');
  } catch(err) {
    document.getElementById('app').innerHTML = '<div class="container" style="padding:60px 24px;text-align:center;"><div class="alert alert-error">Admin paneli yüklenemedi: ' + esc(err.message) + '</div><a href="#/" class="btn btn-primary" style="margin-top:16px;">Ana Sayfaya Dön</a></div>';
    return;
  }
  var ch = stats; // change helpers inline

  function pct(a, b) {
    if (!b) return a > 0 ? '+100%' : '—';
    var d = Math.round(((a - b) / b) * 100);
    return (d >= 0 ? '+' : '') + d + '%';
  }
  function chip(a, b, reverse) {
    if (!b) return '';
    var d = a - b;
    var positive = reverse ? d < 0 : d > 0;
    var color = positive ? 'var(--teal)' : d < 0 ? 'var(--red)' : 'var(--text-mid)';
    return '<span style="font-size:.72rem;font-weight:700;color:' + color + ';background:' + color + '1a;border-radius:99px;padding:2px 7px;margin-left:6px;">' + pct(a,b) + '</span>';
  }

  document.getElementById('app').innerHTML =
    '<div class="dash-header"><div class="container" style="display:flex;align-items:center;justify-content:space-between;"><div><h1>Yönetim Paneli</h1><p>Ticarethane Moderatör Ekranı</p></div></div></div>' +
    '<div class="admin-layout">' +
      '<nav class="admin-sidebar">' +
        '<div class="admin-sidebar-item active" data-tab="dashboard">Genel Bakış</div>' +
        '<div class="admin-sidebar-item" data-tab="pending">Bekleyen' + (stats.pending_listings > 0 ? ' <span style="background:var(--red);color:#fff;border-radius:99px;padding:1px 7px;font-size:.7rem;font-weight:700;margin-left:4px;">' + stats.pending_listings + '</span>' : '') + '</div>' +
        '<div class="admin-sidebar-item" data-tab="listings">Tüm İlanlar</div>' +
        '<div class="admin-sidebar-item" data-tab="users">Kullanıcılar</div>' +

        '<div class="admin-sidebar-item" data-tab="companies">Firmalar</div>' +
        '<div class="admin-sidebar-item" data-tab="prices">Fiyat & Piyasa</div>' +
        '<div class="admin-sidebar-item" data-tab="trends">Trend & Değişim</div>' +
        '<div class="admin-sidebar-item" data-tab="stats">İstatistikler</div>' +
        '<div class="admin-sidebar-item" data-tab="reports" id="reportsTab">Raporlar</div>' +
      '</nav>' +
      '<div class="admin-content">' +

        // TAB: DASHBOARD
        '<div id="atab_dashboard" class="tab-content active">' +
          '<h2 style="margin-bottom:20px;">Genel Bakış</h2>' +
          '<div class="stat-grid" style="grid-template-columns:repeat(4,1fr);">' +
            sc(stats.total_listings,     'Toplam İlan',     'listings',  '') +
            sc(stats.pending_listings,   'Onay Bekleyen',   'pending',   '', 'red-card') +
            sc(stats.active_listings,    'Aktif İlan',      'listings',  'active', 'green-card') +
            sc(stats.sold_listings,      'Satılan',         'listings',  'sold') +
            sc(stats.total_users,        'Toplam Üye',      'users',     '', 'accent-card') +
            sc(stats.active_users,       'Aktif Üye',       'users',     'active') +
            sc(stats.new_listings_today, 'Bugün İlan',      'listings',  '') +
            sc(stats.new_users_today,    'Bugün Üye',       'users',     '') +
            sc(stats.listings_this_week, 'Bu Hafta İlan',   'listings',  '') +
            sc(stats.users_this_week,    'Bu Hafta Üye',    'users',     '') +
            sc(stats.total_messages,     'Toplam Mesaj',    'trends',    '') +
            sc(stats.banned_users||0,    'Askıdaki Üye',    'users',     'banned') +
          '</div>' +
          (stats.pending_listings > 0
            ? '<div class="alert alert-warning" style="margin-top:20px;"><strong>' + stats.pending_listings + ' ilan</strong> onayınızı bekliyor. <a href="javascript:void(0)" onclick="document.querySelector(\'[data-tab=pending]\').click()" style="color:var(--navy);font-weight:700;">Görüntüle →</a></div>'
            : '<div class="alert alert-success" style="margin-top:20px;">Bekleyen ilan yok, her şey yolunda.</div>') +
          '<div id="dashRecentWrap"><div class="page-loading"><div class="spinner"></div></div></div>' +
        '</div>' +

        '<div id="atab_pending"  class="tab-content"><div id="pendingContent"><div class="page-loading"><div class="spinner"></div></div></div></div>' +
        '<div id="atab_listings" class="tab-content"><div id="allListingsContent"><div class="page-loading"><div class="spinner"></div></div></div></div>' +
        '<div id="atab_users"    class="tab-content"><div id="usersContent"><div class="page-loading"><div class="spinner"></div></div></div></div>' +

        '<div id="atab_companies" class="tab-content"><div id="companiesContent"><div class="page-loading"><div class="spinner"></div></div></div></div>' +
        '<div id="atab_prices"   class="tab-content"><div id="pricesContent"><div class="page-loading"><div class="spinner"></div></div></div></div>' +
        '<div id="atab_trends"   class="tab-content"><div id="trendsContent"><div class="page-loading"><div class="spinner"></div></div></div></div>' +
        '<div id="atab_stats"    class="tab-content"><div id="statsContent"><div class="page-loading"><div class="spinner"></div></div></div></div>' +
        '<div id="atab_reports"  class="tab-content"><div id="reportsContent"><div class="page-loading"><div class="spinner"></div></div></div></div>' +
      '</div>' +
    '</div>';

  // Helper: stat card HTML
  function sc(val, label, tab, filter, extra) {
    var cls = 'stat-card' + (extra ? ' ' + extra : '');
    return '<div class="' + cls + ' stat-card-link" data-goto="' + tab + '" data-filter="' + (filter||'') + '" title="' + label + ' — tıkla">' +
      '<div class="stat-val">' + val + '</div><div class="stat-label">' + label + '</div>' +
      '<div class="stat-card-hint">↗</div>' +
    '</div>';
  }

  // Load recent activity for dashboard
  loadDashRecent();

  // Stat card click → switch tab + filter
  document.getElementById('atab_dashboard').addEventListener('click', function(e) {
    var card = e.target.closest('.stat-card-link');
    if (!card) return;
    var tab    = card.dataset.goto;
    var filter = card.dataset.filter;
    var sideItem = document.querySelector('[data-tab="' + tab + '"]');
    if (sideItem) sideItem.click();
    if (filter === 'active')  setTimeout(function() { loadAdminListings({ status: 'active' }); }, 50);
    if (filter === 'sold')    setTimeout(function() { loadAdminListings({ status: 'sold' }); }, 50);
    if (filter === 'pending') setTimeout(function() { loadAdminPending(); }, 50);
    if (filter === 'banned')  setTimeout(function() { loadAdminUsers(); }, 50);
  });

  document.querySelectorAll('.admin-sidebar-item').forEach(function(item) {
    item.addEventListener('click', function() {
      document.querySelectorAll('.admin-sidebar-item').forEach(function(i) { i.classList.remove('active'); });
      document.querySelectorAll('[id^="atab_"]').forEach(function(t) { t.classList.remove('active'); });
      item.classList.add('active');
      var tab = item.dataset.tab;
      var el = document.getElementById('atab_' + tab);
      if (el) el.classList.add('active');
      if (tab === 'pending')  loadAdminPending();
      if (tab === 'listings') loadAdminListings();
      if (tab === 'users')    loadAdminUsers();

      if (tab === 'companies') loadAdminCompanies();
      if (tab === 'prices')   loadAdminPrices();
      if (tab === 'trends')   loadAdminTrends();
      if (tab === 'stats')    loadAdminStats();
      if (tab === 'reports')  loadAdminReports();
    });
  });
}

async function loadDashRecent() {
  var w = document.getElementById('dashRecentWrap');
  if (!w) return;
  try {
    var d = await api('GET', '/admin/stats/detailed');
    var ch = d.changeStats || {};
    function pct(a,b){ if(!b) return a>0?'+100%':'—'; var x=Math.round(((a-b)/b)*100); return (x>=0?'+':'')+x+'%'; }
    function chip(a,b,rev){ if(!b&&a===0) return ''; var d2=a-b; var pos=rev?d2<0:d2>0; var col=pos?'#16a34a':d2<0?'#dc2626':'#64748b'; return '<span style="font-size:.7rem;font-weight:700;color:'+col+';background:'+col+'1a;border-radius:99px;padding:2px 7px;margin-left:4px;">'+(d2>=0?'+':'')+d2+' ('+pct(a,b)+')</span>'; }

    w.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;">' +

        '<div class="card"><div class="card-header">Bu Hafta Değişim</div>' +
        '<div style="padding:16px 20px;display:flex;flex-direction:column;gap:10px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.88rem;">' +
            '<span>Yeni İlan</span><strong>' + ch.listings_this_week + chip(ch.listings_this_week, ch.listings_last_week, false) + '</strong>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.88rem;">' +
            '<span>Yeni Üye</span><strong>' + ch.users_this_week + chip(ch.users_this_week, ch.users_last_week, false) + '</strong>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.88rem;">' +
            '<span>Gönderilen Mesaj</span><strong>' + ch.msgs_this_week + '</strong>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.88rem;">' +
            '<span>Satılan İlan</span><strong>' + ch.sold_this_week + '</strong>' +
          '</div>' +
        '</div></div>' +

        '<div class="card"><div class="card-header">Bu Ay Değişim</div>' +
        '<div style="padding:16px 20px;display:flex;flex-direction:column;gap:10px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.88rem;">' +
            '<span>Yeni İlan</span><strong>' + ch.listings_this_month + chip(ch.listings_this_month, ch.listings_last_month, false) + '</strong>' +
          '</div>' +
        '</div></div>' +

      '</div>' +
      '<div class="card" style="margin-top:20px;"><div class="card-header">Son Aktiviteler</div>' +
      '<div class="table-wrapper"><table><thead><tr><th>Tür</th><th>İçerik</th><th>Durum</th><th>Kullanıcı</th><th>Tarih</th></tr></thead><tbody>' +
      (d.recentActivity||[]).slice(0,15).map(function(a){
        return '<tr><td><span class="badge ' + (a.type==='listing'?'badge-sell':'badge-active') + '">' + (a.type==='listing'?'İlan':'Üye') + '</span></td>' +
          '<td>' + esc(a.text) + '</td>' +
          '<td>' + (a.status?'<span class="badge badge-'+a.status+'">'+a.status+'</span>':'—') + '</td>' +
          '<td>' + esc(a.user_name) + '</td>' +
          '<td style="white-space:nowrap;">' + timeAgo(a.created_at) + '</td></tr>';
      }).join('') +
      '</tbody></table></div></div>';
  } catch(e) { w.innerHTML = '<div class="alert alert-error">' + esc(e.message) + '</div>'; }
}

async function loadAdminPending() {
  var c = document.getElementById('pendingContent');
  c.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    var rows = await api('GET', '/admin/listings/pending');
    if (!rows.length) { c.innerHTML = '<div class="empty-state"><div class="empty-state-title">Bekleyen ilan yok.</div></div>'; return; }
    c.innerHTML =
      '<h2 style="margin-bottom:16px;">Bekleyen İlanlar <span class="badge badge-pending">' + rows.length + '</span></h2>' +
      '<div class="table-wrapper"><table><thead><tr><th>#</th><th>Başlık</th><th>Sektör</th><th>Üye</th><th>Tarih</th><th>İşlemler</th></tr></thead><tbody>' +
      rows.map(function(l) {
        return '<tr id="prow_' + l.id + '">' +
          '<td>#' + l.id + '</td>' +
          '<td><a href="#/ilan/' + l.id + '" style="color:var(--blue);font-weight:600;">' + esc(l.title) + '</a><div style="font-size:.75rem;color:var(--text-mid);">' + esc(l.city||'') + ' · ' + (l.image_count||0) + ' görsel</div></td>' +
          '<td>' + esc(l.category_name||'—') + '</td>' +
          '<td><div style="font-weight:600;">' + esc(l.user_name||'') + '</div><div style="font-size:.75rem;color:var(--text-mid);">' + esc(l.user_email||'') + '</div></td>' +
          '<td style="white-space:nowrap;">' + timeAgo(l.created_at) + '</td>' +
          '<td><div class="d-flex gap-2">' +
            '<button type="button" class="btn btn-success btn-sm" data-approve="' + l.id + '">Onayla</button>' +
            '<button type="button" class="btn btn-danger btn-sm" data-reject="' + l.id + '">Reddet</button>' +
          '</div></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>';

    c.querySelectorAll('[data-approve]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var id = btn.dataset.approve;
        try { await api('PATCH', '/admin/listings/' + id + '/approve'); document.getElementById('prow_'+id)?.remove(); toast('Onaylandı.','success'); }
        catch(e) { toast(e.message,'error'); }
      });
    });
    c.querySelectorAll('[data-reject]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var id = btn.dataset.reject;
        var reason = prompt('Reddetme nedeni (isteğe bağlı):') || '';
        try { await api('PATCH', '/admin/listings/' + id + '/reject', { reason: reason }); document.getElementById('prow_'+id)?.remove(); toast('Reddedildi.','success'); }
        catch(e) { toast(e.message,'error'); }
      });
    });
  } catch(err) { c.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>'; }
}

async function loadAdminListings(filters) {
  var c = document.getElementById('allListingsContent');
  c.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  filters = filters || {};
  var q = new URLSearchParams({ limit: 50 });
  if (filters.status)   q.set('status', filters.status);
  if (filters.search)   q.set('search', filters.search);
  if (filters.category) q.set('category', filters.category);
  try {
    var data = await api('GET', '/admin/listings?' + q.toString());
    var sl   = { pending:'Bekliyor', active:'Aktif', rejected:'Reddedildi', sold:'Satıldı', expired:'Süresi Doldu' };
    c.innerHTML =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px;">' +
        '<h2 style="margin:0;">Tüm İlanlar</h2>' +
        '<span style="font-size:.82rem;color:var(--text-mid);">' + (data.total||0) + ' sonuç</span>' +
        '<div style="margin-left:auto;display:flex;gap:6px;">' +
          ['', 'active', 'pending', 'rejected', 'sold'].map(function(s) {
            return '<button type="button" class="btn btn-ghost btn-sm' + ((!filters.status&&!s)||(filters.status===s)?' btn-active':'') + '" data-filter-status="' + s + '">' + (s?(sl[s]||s):'Tümü') + '</button>';
          }).join('') +
        '</div>' +
        '<input type="text" id="listingSearchInput" placeholder="Ara..." class="form-control" style="width:180px;font-size:.82rem;padding:5px 10px;" value="' + esc(filters.search||'') + '" />' +
      '</div>' +
      '<div class="table-wrapper"><table><thead><tr><th>#</th><th>Başlık</th><th>Durum</th><th>Sektör</th><th>Üye</th><th>Görüntülenme</th><th>Tarih</th><th>İşlemler</th></tr></thead><tbody>' +
      data.listings.map(function(l) {
        return '<tr id="arow_' + l.id + '">' +
          '<td>#' + l.id + '</td>' +
          '<td><a href="#/ilan/' + l.id + '" target="_blank" style="color:var(--blue);">' + esc(l.title) + '</a></td>' +
          '<td><span class="badge badge-' + l.status + '">' + (sl[l.status]||l.status) + '</span></td>' +
          '<td style="font-size:.82rem;">' + esc(l.category_name||'') + '</td>' +
          '<td style="font-size:.82rem;">' + esc(l.user_name||'') + '</td>' +
          '<td>' + (l.views||0) + '</td>' +
          '<td style="white-space:nowrap;font-size:.78rem;">' + new Date(l.created_at).toLocaleDateString('tr-TR') + '</td>' +
          '<td><div class="d-flex gap-2">' +
            (l.status==='pending'||l.status==='rejected' ? '<button type="button" class="btn btn-success btn-sm" data-approve="' + l.id + '">Onayla</button>' : '') +
            (l.status==='active'  ? '<button type="button" class="btn btn-ghost btn-sm" data-reject="' + l.id + '">Pasifleştir</button>' : '') +
            '<button type="button" class="btn btn-sm ' + (l.is_featured ? 'btn-accent' : 'btn-ghost') + '" data-feature="' + l.id + '" title="Öne Çıkar">' + (l.is_featured ? '⭐' : '☆') + '</button>' +
            '<button type="button" class="btn btn-danger btn-sm" data-admindel="' + l.id + '">Sil</button>' +
          '</div></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>';

    // Search
    var si = document.getElementById('listingSearchInput');
    if (si) {
      var timer;
      si.addEventListener('input', function() {
        clearTimeout(timer);
        timer = setTimeout(function() { loadAdminListings(Object.assign({}, filters, { search: si.value.trim() })); }, 500);
      });
    }
    c.querySelectorAll('[data-filter-status]').forEach(function(btn) {
      btn.addEventListener('click', function() { loadAdminListings(Object.assign({}, filters, { status: btn.dataset.filterStatus })); });
    });
    c.querySelectorAll('[data-approve]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        try { await api('PATCH', '/admin/listings/' + btn.dataset.approve + '/approve'); toast('Onaylandı.','success'); loadAdminListings(filters); }
        catch(e) { toast(e.message,'error'); }
      });
    });
    c.querySelectorAll('[data-reject]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        try { await api('PATCH', '/admin/listings/' + btn.dataset.reject + '/reject', {}); toast('Pasifleştirildi.','success'); loadAdminListings(filters); }
        catch(e) { toast(e.message,'error'); }
      });
    });
    c.querySelectorAll('[data-admindel]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var id = btn.dataset.admindel;
        if (!confirm('Kalıcı olarak silinecek. Emin misiniz?')) return;
        try { await api('DELETE', '/admin/listings/' + id); document.getElementById('arow_'+id)?.remove(); toast('Silindi.','success'); }
        catch(e) { toast(e.message,'error'); }
      });
    });
    c.querySelectorAll('[data-feature]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        try {
          var res = await api('PATCH', '/admin/listings/' + btn.dataset.feature + '/feature');
          toast(res.message, 'success');
          loadAdminListings(filters);
        } catch(e) { toast(e.message,'error'); }
      });
    });
  } catch(err) { c.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>'; }
}

async function loadAdminUsers() {
  var c = document.getElementById('usersContent');
  c.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    var data = await api('GET', '/admin/users?limit=100');
    c.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">' +
        '<h2 style="margin:0;">Kullanıcılar</h2>' +
        '<span style="font-size:.82rem;color:var(--text-mid);">' + (data.total||0) + ' kayıtlı üye</span>' +
        '<input type="text" id="userSearchInput" placeholder="Ad, e-posta ara..." class="form-control" style="width:220px;font-size:.82rem;padding:5px 10px;margin-left:auto;" />' +
      '</div>' +
      '<div class="table-wrapper"><table><thead><tr><th>#</th><th>Ad / Firma</th><th>E-posta</th><th>Şehir</th><th>İlan</th><th>Kayıt</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>' +
      data.users.map(function(u) {
        return '<tr id="urow_' + u.id + '">' +
          '<td>#' + u.id + '</td>' +
          '<td><div style="font-weight:600;">' + esc(u.name) + '</div>' + (u.company_name?'<div style="font-size:.75rem;color:var(--text-mid);">' + esc(u.company_name) + '</div>':'') + '</td>' +
          '<td style="font-size:.82rem;">' + esc(u.email) + '</td>' +
          '<td style="font-size:.82rem;">' + esc(u.city||'—') + '</td>' +
          '<td style="text-align:center;">' + (u.listing_count||0) + '</td>' +
          '<td style="white-space:nowrap;font-size:.78rem;">' + new Date(u.created_at).toLocaleDateString('tr-TR') + '</td>' +
          '<td><span class="badge ' + (u.is_active?'badge-active':'badge-rejected') + '">' + (u.is_active?'Aktif':'Askıda') + '</span></td>' +
          '<td style="display:flex;gap:4px;flex-wrap:wrap;">' +
            '<button type="button" class="btn btn-ghost btn-sm" data-ban="' + u.id + '">' + (u.is_active?'Askıya Al':'Aktifleştir') + '</button>' +
            '<button type="button" class="btn btn-sm ' + (u.is_verified?'btn-accent':'btn-ghost') + '" data-verify="' + u.id + '" title="Doğrula">' + (u.is_verified?'✓ Onaylı':'Onayla') + '</button>' +
            '<button type="button" class="btn btn-sm" style="background:#fee2e2;color:#dc2626;border:none;" data-del-user="' + u.id + '" title="Sil">🗑</button>' +
          '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>';

    // Client-side search filter
    var si = document.getElementById('userSearchInput');
    if (si) {
      si.addEventListener('input', function() {
        var q = si.value.toLowerCase();
        c.querySelectorAll('tbody tr').forEach(function(tr) {
          tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }

    c.querySelectorAll('[data-ban]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var id = btn.dataset.ban;
        var action = btn.textContent.trim();
        if (!confirm(action + ' #' + id + ' — Emin misiniz?')) return;
        try { var res = await api('PATCH', '/admin/users/' + id + '/toggle'); toast(res.message,'success'); loadAdminUsers(); }
        catch(e) { toast(e.message,'error'); }
      });
    });

    c.querySelectorAll('[data-del-user]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var id = btn.dataset.delUser;
        if (!confirm('Kullanıcı #' + id + ' ve tüm ilanları/mesajları kalıcı olarak silinecek.\nBu işlem geri alınamaz! Emin misiniz?')) return;
        try { var res = await api('DELETE', '/admin/users/' + id); toast(res.message,'success'); loadAdminUsers(); }
        catch(e) { toast(e.message,'error'); }
      });
    });
    c.querySelectorAll('[data-verify]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        try {
          var res = await api('PATCH', '/admin/users/' + btn.dataset.verify + '/verify');
          toast(res.message, 'success');
          loadAdminUsers();
        } catch(e) { toast(e.message,'error'); }
      });
    });
  } catch(err) { c.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>'; }
}

async function loadAdminPrices() {
  var c = document.getElementById('pricesContent');
  c.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    var d = await api('GET', '/admin/stats/detailed');
    var p = d.priceStats || {};
    function curSym(c) { return c === 'USD' ? '$' : c === 'EUR' ? '€' : '₺'; }
    function fmtCur(n, c) { return n ? curSym(c) + Number(n).toLocaleString('tr-TR') : '—'; }
    var fmt = function(n) { return n ? Number(n).toLocaleString('tr-TR') : '—'; };

    // Para birimine göre özet kartlar
    var curCards = (d.priceStatsByCur || []).map(function(r) {
      var sym = curSym(r.currency);
      return '<div class="card" style="margin-bottom:20px;"><div class="card-header">' + r.currency + ' İlanları (' + (r.count_with_price||0) + ' ilan)</div>' +
        '<div class="stat-grid" style="grid-template-columns:repeat(3,1fr);padding:16px;">' +
          '<div class="stat-card"><div class="stat-val" style="font-size:1rem;">' + sym + Number(r.avg_price||0).toLocaleString('tr-TR') + '</div><div class="stat-label">Ort. Fiyat</div></div>' +
          '<div class="stat-card"><div class="stat-val" style="font-size:1rem;">' + sym + Number(r.min_price||0).toLocaleString('tr-TR') + '</div><div class="stat-label">En Düşük</div></div>' +
          '<div class="stat-card"><div class="stat-val" style="font-size:1rem;">' + sym + Number(r.max_price||0).toLocaleString('tr-TR') + '</div><div class="stat-label">En Yüksek</div></div>' +
        '</div></div>';
    }).join('');

    function barRow(label, val, max, color, extra) {
      var pct = max ? Math.round((val / max) * 100) : 0;
      return '<div style="margin-bottom:12px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:3px;"><span>' + esc(label) + (extra?'<span style="color:var(--text-mid);margin-left:6px;font-size:.75rem;">'+extra+'</span>':'') + '</span><span style="font-weight:700;">' + fmt(val) + '</span></div>' +
        '<div style="background:var(--bg-alt);border-radius:4px;height:9px;overflow:hidden;"><div style="background:' + color + ';width:' + pct + '%;height:100%;border-radius:4px;"></div></div>' +
      '</div>';
    }

    // Genel fiyat metrikleri
    var metricHTML =
      '<div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px;">' +
        '<div class="stat-card"><div class="stat-val" style="font-size:1.1rem;">' + fmt(p.avg_price) + '</div><div class="stat-label">Genel Ort. Fiyat</div></div>' +
        '<div class="stat-card"><div class="stat-val" style="font-size:1.1rem;">' + fmt(p.min_price) + '</div><div class="stat-label">En Düşük</div></div>' +
        '<div class="stat-card"><div class="stat-val" style="font-size:1.1rem;">' + fmt(p.max_price) + '</div><div class="stat-label">En Yüksek</div></div>' +
        '<div class="stat-card accent-card"><div class="stat-val">' + (p.count_with_price||0) + '</div><div class="stat-label">Fiyatlı İlan</div></div>' +
      '</div>';

    // Birim başına ort. fiyat kartları
    var unitCards =
      '<div class="stat-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:24px;">' +
        ['avg_per_ton','avg_per_kg','avg_per_lot','avg_per_adet','avg_per_palet'].map(function(k, i) {
          var labels = ['Ton Başı Ort.','Kg Başı Ort.','Lot Başı Ort.','Adet Başı Ort.','Palet Başı Ort.'];
          return '<div class="stat-card"><div class="stat-val" style="font-size:1rem;">' + fmt(p[k]) + '</div><div class="stat-label">' + labels[i] + '</div></div>';
        }).join('') +
      '</div>';

    // Sektöre göre fiyat tablosu
    var catPriceMax = Math.max.apply(null, (d.byCategory||[]).map(function(r){ return r.avg_price||0; }).concat([1]));
    var catPriceHTML =
      '<div class="card" style="margin-bottom:20px;"><div class="card-header">Sektöre Göre Ortalama Fiyat</div>' +
      '<div class="table-wrapper"><table><thead><tr><th>Sektör</th><th>İlan</th><th>Ort. Fiyat</th><th>Min</th><th>Max</th></tr></thead><tbody>' +
      (d.byCategory||[]).filter(function(r){ return r.avg_price; }).map(function(r) {
        return '<tr><td style="font-weight:600;">' + esc(r.name) + '</td><td>' + r.active + '</td>' +
          '<td style="font-weight:700;color:var(--navy);">' + fmt(r.avg_price) + '</td>' +
          '<td style="font-size:.82rem;color:var(--teal);">' + fmt(r.min_price) + '</td>' +
          '<td style="font-size:.82rem;color:var(--red);">' + fmt(r.max_price) + '</td></tr>';
      }).join('') +
      '</tbody></table></div></div>';

    // Birim türüne göre detay
    var unitDetailHTML =
      '<div class="card" style="margin-bottom:20px;"><div class="card-header">Birim Türüne Göre Fiyat Analizi</div>' +
      '<div class="table-wrapper"><table><thead><tr><th>Birim</th><th>Para Birimi</th><th>İlan</th><th>Ort. Fiyat</th><th>Min</th><th>Max</th><th>Ort. Birim Fiyat</th></tr></thead><tbody>' +
      (d.pricePerUnit||[]).map(function(r) {
        var sym = curSym(r.currency);
        return '<tr><td style="font-weight:600;">' + esc(r.unit) + '</td>' +
          '<td><span class="badge badge-sell">' + esc(r.currency||'TRY') + '</span></td>' +
          '<td>' + r.listing_count + '</td>' +
          '<td style="font-weight:700;color:var(--navy);">' + fmtCur(r.avg_price, r.currency) + '</td>' +
          '<td style="font-size:.82rem;color:var(--green);">' + fmtCur(r.min_price, r.currency) + '</td>' +
          '<td style="font-size:.82rem;color:var(--red);">' + fmtCur(r.max_price, r.currency) + '</td>' +
          '<td style="font-size:.82rem;">' + (r.avg_unit_price ? sym + Number(r.avg_unit_price).toLocaleString('tr-TR') + '/' + esc(r.unit) : '—') + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div></div>';

    // Sektör + birim kombinasyonu
    var catUnitHTML =
      '<div class="card"><div class="card-header">Sektör × Birim Fiyat Matrisi</div>' +
      '<div class="table-wrapper"><table><thead><tr><th>Sektör</th><th>Birim</th><th>Para Birimi</th><th>İlan</th><th>Ort. Fiyat</th><th>Ort. Birim Fiyat</th></tr></thead><tbody>' +
      (d.pricePerUnitByCat||[]).map(function(r) {
        var sym = curSym(r.currency);
        return '<tr><td>' + esc(r.category) + '</td><td><span class="badge badge-sell">' + esc(r.unit) + '</span></td>' +
          '<td><span class="badge" style="background:var(--bg);color:var(--text-mid);border:1px solid var(--border);">' + esc(r.currency||'TRY') + '</span></td>' +
          '<td>' + r.count + '</td>' +
          '<td style="font-weight:700;">' + fmtCur(r.avg_price, r.currency) + '</td>' +
          '<td style="font-size:.82rem;">' + (r.avg_unit_price ? sym + Number(r.avg_unit_price).toLocaleString('tr-TR') + '/' + esc(r.unit) : '—') + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div></div>';

    c.innerHTML = '<h2 style="margin-bottom:4px;">Fiyat & Piyasa Analizi</h2><p style="font-size:.82rem;color:var(--text-muted);margin-bottom:20px;">Para birimine göre ayrı gösterilmektedir.</p>' + curCards + catPriceHTML + unitDetailHTML + catUnitHTML;
  } catch(err) { c.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>'; }
}

async function loadAdminTrends() {
  var c = document.getElementById('trendsContent');
  c.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    var d = await api('GET', '/admin/stats/detailed');
    var ch = d.changeStats || {};

    function pctChip(a, b, label) {
      var diff = a - b;
      var pct  = b ? Math.round(((a-b)/b)*100) : (a>0?100:0);
      var col  = diff > 0 ? '#16a34a' : diff < 0 ? '#dc2626' : '#64748b';
      return '<div class="stat-card" style="position:relative;">' +
        '<div class="stat-val">' + a + '</div>' +
        '<div class="stat-label">' + label + '</div>' +
        '<div style="margin-top:6px;font-size:.75rem;font-weight:700;color:' + col + ';">' + (diff>=0?'+':'') + diff + ' (' + (pct>=0?'+':'') + pct + '%)</div>' +
        '<div style="font-size:.68rem;color:var(--text-mid);">geçen haftaya göre</div>' +
      '</div>';
    }

    // Haftalık değişim kartları
    var changeGrid =
      '<h3 style="margin-bottom:12px;">Haftalık Değişim (Bu Hafta vs Geçen Hafta)</h3>' +
      '<div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:28px;">' +
        pctChip(ch.listings_this_week||0, ch.listings_last_week||0, 'Yeni İlan') +
        pctChip(ch.users_this_week||0, ch.users_last_week||0, 'Yeni Üye') +
        '<div class="stat-card"><div class="stat-val">' + (ch.sold_this_week||0) + '</div><div class="stat-label">Satılan</div></div>' +
        '<div class="stat-card"><div class="stat-val">' + (ch.msgs_this_week||0) + '</div><div class="stat-label">Mesaj</div></div>' +
      '</div>';

    // Aylık değişim
    var monthGrid =
      '<h3 style="margin-bottom:12px;">Aylık Değişim (Bu Ay vs Geçen Ay)</h3>' +
      '<div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:28px;">' +
        pctChip(ch.listings_this_month||0, ch.listings_last_month||0, 'Yeni İlan') +
        '<div class="stat-card"><div class="stat-val">' + (ch.active_this_week||0) + '</div><div class="stat-label">Bu Hafta Aktifleşen</div></div>' +
        '<div class="stat-card"><div class="stat-val">' + (ch.views_this_week||0) + '</div><div class="stat-label">Bu Hafta Görüntülenme</div></div>' +
      '</div>';

    // Sektöre göre büyüme (bu hafta vs geçen hafta)
    var maxW = Math.max.apply(null, (d.byCategory||[]).map(function(r){ return Math.max(r.this_week||0, r.last_week||0); }).concat([1]));
    var catTrendHTML =
      '<div class="card" style="margin-bottom:20px;"><div class="card-header">Sektöre Göre Haftalık İlan Değişimi</div>' +
      '<div class="table-wrapper"><table><thead><tr><th>Sektör</th><th>Bu Hafta</th><th>Geçen Hafta</th><th>Değişim</th><th>Toplam Aktif</th></tr></thead><tbody>' +
      (d.byCategory||[]).map(function(r) {
        var tw = r.this_week||0, lw = r.last_week||0;
        var diff = tw - lw;
        var col = diff > 0 ? '#16a34a' : diff < 0 ? '#dc2626' : '#64748b';
        return '<tr>' +
          '<td style="font-weight:600;">' + esc(r.name) + '</td>' +
          '<td><strong>' + tw + '</strong></td>' +
          '<td style="color:var(--text-mid);">' + lw + '</td>' +
          '<td><span style="font-weight:700;color:' + col + ';">' + (diff>=0?'+':'') + diff + '</span></td>' +
          '<td>' + (r.active||0) + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div></div>';

    // Son 30 gün günlük trend
    var days = d.last30Days || [];
    var maxD  = Math.max.apply(null, days.map(function(r){ return r.listings; }).concat([1]));
    var dayBars = days.length ?
      '<div class="card" style="margin-bottom:20px;"><div class="card-header">Son 30 Gün — Günlük Yeni İlan</div>' +
      '<div style="padding:16px 20px;display:flex;align-items:flex-end;gap:3px;height:100px;">' +
      days.map(function(r) {
        var h = Math.max(4, Math.round((r.listings / maxD) * 80));
        return '<div title="' + r.gun + ': ' + r.listings + '" style="flex:1;background:var(--blue);border-radius:2px 2px 0 0;height:' + h + 'px;opacity:.8;cursor:default;"></div>';
      }).join('') +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;padding:0 20px 12px;font-size:.72rem;color:var(--text-mid);">' +
        '<span>' + (days[0]?days[0].gun:'') + '</span><span>' + (days[days.length-1]?days[days.length-1].gun:'') + '</span>' +
      '</div></div>' : '';

    // Son 30 gün üye trendi
    var udays = d.last30DaysUsers || [];
    var maxU  = Math.max.apply(null, udays.map(function(r){ return r.users; }).concat([1]));
    var uBars = udays.length ?
      '<div class="card"><div class="card-header">Son 30 Gün — Günlük Yeni Üye</div>' +
      '<div style="padding:16px 20px;display:flex;align-items:flex-end;gap:3px;height:80px;">' +
      udays.map(function(r) {
        var h = Math.max(4, Math.round((r.users / maxU) * 60));
        return '<div title="' + r.gun + ': ' + r.users + '" style="flex:1;background:var(--teal);border-radius:2px 2px 0 0;height:' + h + 'px;opacity:.85;cursor:default;"></div>';
      }).join('') +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;padding:0 20px 12px;font-size:.72rem;color:var(--text-mid);">' +
        '<span>' + (udays[0]?udays[0].gun:'') + '</span><span>' + (udays[udays.length-1]?udays[udays.length-1].gun:'') + '</span>' +
      '</div></div>' : '';

    c.innerHTML = '<h2 style="margin-bottom:20px;">Trend & Değişim Analizi</h2>' + changeGrid + monthGrid + catTrendHTML + dayBars + uBars;
  } catch(err) { c.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>'; }
}

async function loadAdminStats() {
  var c = document.getElementById('statsContent');
  c.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    var d = await api('GET', '/admin/stats/detailed');
    var cats  = d.byCategory    || [];
    var cities = d.byCity       || [];
    var types  = d.byListingType|| [];
    var days   = d.last30Days   || [];
    var maxCat  = Math.max.apply(null, cats.map(function(r) { return r.total; }).concat([1]));
    var maxCity = Math.max.apply(null, cities.map(function(r) { return r.count; }).concat([1]));
    var maxType = Math.max.apply(null, types.map(function(r) { return r.count; }).concat([1]));
    var maxDay  = Math.max.apply(null, days.map(function(r) { return r.listings; }).concat([1]));
    var fmt = function(n) { return n ? Number(n).toLocaleString('tr-TR') : '—'; };

    function barRow(label, val, max, color) {
      var pct = Math.round((val / max) * 100);
      return '<div style="margin-bottom:10px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:3px;"><span>' + esc(label) + '</span><span style="font-weight:600;">' + val + '</span></div>' +
        '<div style="background:var(--bg-alt);border-radius:4px;height:9px;overflow:hidden;"><div style="background:' + color + ';width:' + pct + '%;height:100%;border-radius:4px;"></div></div>' +
      '</div>';
    }

    c.innerHTML =
      '<h2 style="margin-bottom:20px;">Genel İstatistikler</h2>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">' +
        '<div class="card"><div class="card-header">Sektöre Göre Toplam İlan</div><div style="padding:16px 20px;">' +
          (cats.length ? cats.map(function(r){ return barRow(r.name, r.total, maxCat, 'var(--blue)'); }).join('') : '<p class="text-muted">Veri yok.</p>') +
        '</div></div>' +
        '<div class="card"><div class="card-header">Şehre Göre Aktif İlan</div><div style="padding:16px 20px;">' +
          (cities.length ? cities.map(function(r){ return barRow(r.city||'Belirtilmedi', r.count, maxCity, 'var(--teal)'); }).join('') : '<p class="text-muted">Veri yok.</p>') +
        '</div></div>' +
        '<div class="card"><div class="card-header">İlan Türüne Göre</div><div style="padding:16px 20px;">' +
          (types.length ? types.map(function(r){ return barRow(r.listing_type==='sell'?'Satılır':'Alınır', r.count, maxType, 'var(--navy)'); }).join('') : '<p class="text-muted">Veri yok.</p>') +
        '</div></div>' +
        '<div class="card"><div class="card-header">Son 30 Gün (Yeni İlan)</div><div style="padding:16px 20px;">' +
          (days.length ? days.map(function(r){ return barRow(r.gun, r.listings, maxDay, 'var(--accent)'); }).join('') : '<p class="text-muted">Veri yok.</p>') +
        '</div></div>' +
      '</div>' +
      '<div class="card" style="margin-top:20px;"><div class="card-header">En Çok Görüntülenen İlanlar</div>' +
      '<div class="table-wrapper"><table><thead><tr><th>#</th><th>Başlık</th><th>Sektör</th><th>Görüntülenme</th><th>Fiyat</th><th>Durum</th></tr></thead><tbody>' +
      (d.topListings||[]).map(function(l, i) {
        return '<tr><td>' + (i+1) + '</td><td><a href="#/ilan/' + l.id + '" target="_blank" style="color:var(--blue);">' + esc(l.title) + '</a></td>' +
          '<td style="font-size:.82rem;">' + esc(l.category_name||'') + '</td><td>' + (l.views||0) + '</td>' +
          '<td style="font-size:.82rem;">' + (l.price ? formatPrice(l) : '—') + '</td>' +
          '<td><span class="badge badge-' + l.status + '">' + l.status + '</span></td></tr>';
      }).join('') +
      '</tbody></table></div></div>' +
      '<div class="stat-grid" style="margin-top:20px;">' +
        '<div class="stat-card"><div class="stat-val">' + fmt((d.priceStats||{}).avg_price) + '</div><div class="stat-label">Genel Ort. Fiyat</div></div>' +
        '<div class="stat-card"><div class="stat-val">' + fmt((d.priceStats||{}).min_price) + '</div><div class="stat-label">En Düşük</div></div>' +
        '<div class="stat-card"><div class="stat-val">' + fmt((d.priceStats||{}).max_price) + '</div><div class="stat-label">En Yüksek</div></div>' +
        '<div class="stat-card accent-card"><div class="stat-val">' + ((d.msgStats||{}).total||0) + '</div><div class="stat-label">Toplam Mesaj</div></div>' +
      '</div>';
  } catch(err) { c.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>'; }
}

// ================================================================
// MESAJLAR — Konuşma Listesi
// ================================================================
async function renderMessages() {
  if (!isLoggedIn()) { goTo('/giris'); return; }
  var app = document.getElementById('app');
  app.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    var convs = await api('GET', '/messages');
    var html = '<div class="container" style="max-width:720px;padding:24px 16px;">';
    if (!convs.length) {
      html += '<div class="empty-state"><div class="empty-state-icon">💬</div><div class="empty-state-title">Henüz mesajınız yok</div><div class="empty-state-sub">İlan detay sayfasından satıcılarla mesajlaşabilirsiniz.</div></div>';
    } else {
      html += '<div class="conv-list">';
      convs.forEach(function(c) {
        var hasUnread = c.unread > 0;
        html += '<a href="#/mesajlar/' + c.id + '" class="conv-item' + (hasUnread?' conv-unread':'') + '">' +
          '<div class="conv-avatar">' + esc((c.other_name||'?')[0]).toUpperCase() + '</div>' +
          '<div class="conv-body"><div class="conv-top"><span class="conv-name">' + esc(c.other_company||c.other_name||'Kullanıcı') + '</span><span class="conv-time">' + timeAgo(c.last_message_at) + '</span></div>' +
          (c.listing_title?'<div class="conv-listing">📦 '+esc(c.listing_title)+'</div>':'') +
          '<div class="conv-preview">' + esc(c.last_message||'') + '</div></div>' +
          (hasUnread?'<span class="conv-badge">'+c.unread+'</span>':'') +
        '</a>';
      });
      html += '</div>';
    }
    app.innerHTML = html + '</div>';
  } catch(e) { app.innerHTML = '<div class="container" style="padding:40px 16px;"><div class="alert alert-error">'+esc(e.message)+'</div></div>'; }
}

// ================================================================
// MESAJLAR — Tek Konuşma
// ================================================================
async function renderConversation(params) {
  if (!isLoggedIn() || !State.user) { goTo('/giris'); return; }
  var app = document.getElementById('app');
  app.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    var data    = await api('GET', '/messages/' + params.convId);
    var msgs    = data.messages;
    var other   = data.other;
    var listing = data.listing;
    var me      = State.user.id;
    updateUnreadBadge();

    var html =
      '<div class="chat-header"><div class="container" style="display:flex;align-items:center;gap:12px;">' +
        '<a href="#/mesajlar" class="btn btn-ghost btn-sm">← Geri</a>' +
        '<div class="conv-avatar" style="width:36px;height:36px;font-size:1rem;">' + esc((other.name||'?')[0]).toUpperCase() + '</div>' +
        '<div><div style="font-weight:700;">' + esc(other.company_name||other.name) + '</div>' + (other.city?'<div style="font-size:.8rem;color:var(--text-mid);">'+esc(other.city)+'</div>':'') + '</div>' +
        (listing?'<a href="#/ilan/'+listing.id+'" style="margin-left:auto;font-size:.8rem;color:var(--blue);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📦 '+esc(listing.title)+'</a>':'') +
      '</div></div>' +
      '<div class="chat-messages-wrap"><div class="container" style="max-width:720px;"><div id="chatMsgs" class="chat-messages">';

    if (!msgs.length) {
      html += '<div style="text-align:center;color:var(--text-mid);padding:32px 0;font-size:.9rem;">Konuşmaya ilk mesajı gönderin.</div>';
    } else {
      var lastDay = '';
      msgs.forEach(function(m) {
        var day = new Date(m.created_at).toLocaleDateString('tr-TR');
        if (day !== lastDay) { html += '<div class="chat-day-sep">' + day + '</div>'; lastDay = day; }
        var isMine = m.sender_id === me;
        html += '<div class="chat-msg-row ' + (isMine?'mine':'theirs') + '"><div class="chat-bubble ' + (isMine?'bubble-mine':'bubble-theirs') + '">' +
          esc(m.content) + '<div class="bubble-time">' + new Date(m.created_at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}) + '</div></div></div>';
      });
    }

    html += '</div></div></div>' +
      '<div class="chat-input-bar"><div class="container" style="max-width:720px;display:flex;gap:8px;align-items:flex-end;">' +
        '<textarea id="chatInput" class="chat-input" placeholder="Mesajınızı yazın..." rows="1"></textarea>' +
        '<button type="button" id="chatSend" class="btn btn-primary">Gönder</button>' +
      '</div></div>';

    app.innerHTML = html;
    var chatMsgs = document.getElementById('chatMsgs');
    if (chatMsgs) chatMsgs.scrollTop = chatMsgs.scrollHeight;

    var textarea = document.getElementById('chatInput');
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    textarea.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('chatSend').click(); }
    });
    document.getElementById('chatSend').addEventListener('click', async function() {
      var txt = textarea.value.trim();
      if (!txt) return;
      this.disabled = true;
      try {
        await api('POST', '/messages/' + params.convId, { content: txt });
        renderConversation(params);
      } catch(e) { toast(e.message,'error'); this.disabled = false; }
    });
  } catch(e) {
    app.innerHTML = '<div class="container" style="padding:40px 16px;"><div class="alert alert-error">'+esc(e.message)+'</div></div>';
  }
}

// ================================================================
// SATICI SAYFASI — Firmanın tüm ilanları
// ================================================================
async function renderSellerPage(params) {
  var app = document.getElementById('app');
  app.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    var data = await api('GET', '/listings?seller_id=' + params.userId + '&limit=50');
    var listings = data.listings || [];

    // Satıcı adını ilk ilandan al
    var sellerName = listings.length ? (listings[0].company_name || listings[0].seller_name || 'Firma') : 'Firma';

    app.innerHTML =
      '<div class="dash-header"><div class="container">' +
        '<div class="breadcrumb" style="margin-bottom:8px;"><a href="#/">Anasayfa</a><span class="breadcrumb-sep">/</span><span>Firma İlanları</span></div>' +
        '<h1>' + esc(sellerName) + '</h1>' +
        '<p>' + listings.length + ' aktif ilan</p>' +
      '</div></div>' +
      '<div class="container" style="padding:32px 16px;">';

    if (!listings.length) {
      app.innerHTML += '<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-title">Aktif ilan bulunamadı.</div></div>';
    } else {
      app.innerHTML += '<div class="listing-grid">' + listings.map(listingCardHTML).join('') + '</div>';
      updateFxCards(listings);
    }

    app.innerHTML += '</div>';
  } catch(e) {
    app.innerHTML = '<div class="container" style="padding:60px 16px;text-align:center;"><div class="alert alert-error">' + esc(e.message) + '</div><a href="#/" class="btn btn-primary" style="margin-top:16px;">Ana Sayfaya Dön</a></div>';
  }
}

// ================================================================
// 404
// ================================================================
function render404() {
  document.getElementById('app').innerHTML =
    '<div style="text-align:center;padding:80px 24px;">' +
    '<div style="font-size:4rem;font-weight:800;color:var(--border-mid);">404</div>' +
    '<div style="font-size:1.3rem;font-weight:700;margin:8px 0;">Sayfa Bulunamadı</div>' +
    '<div style="color:var(--text-mid);margin-bottom:24px;">Aradığınız sayfa mevcut değil.</div>' +
    '<a href="#/" class="btn btn-primary">Ana Sayfaya Dön</a></div>';
}

// ================================================================
// ADMİN — FİRMALAR
// ================================================================
async function loadAdminCompanies() {
  var c = document.getElementById('companiesContent');
  c.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    var d   = await api('GET', '/admin/stats/detailed');
    var cos = d.topCompanies    || [];
    var cs  = d.companyStats    || {};
    var csd = d.companySectorDist || [];
    var fmt = function(n) { return n ? Number(n).toLocaleString('tr-TR') + ' ₺' : '—'; };

    // Özet metrikler
    var metricHTML =
      '<div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px;">' +
        '<div class="stat-card"><div class="stat-val">' + (cs.total_companies||0) + '</div><div class="stat-label">Toplam Üye</div></div>' +
        '<div class="stat-card accent-card"><div class="stat-val">' + (cs.named_companies||0) + '</div><div class="stat-label">Kayıtlı Firma</div></div>' +
        '<div class="stat-card green-card"><div class="stat-val">' + (cs.companies_with_listings||0) + '</div><div class="stat-label">İlan Veren Firma</div></div>' +
        '<div class="stat-card"><div class="stat-val">' + (cs.avg_listings_per_company||0) + '</div><div class="stat-label">Firma Başı Ort. İlan</div></div>' +
      '</div>';

    // En çok ilan veren firmalar tablosu
    var tableHTML =
      '<div class="card" style="margin-bottom:24px;"><div class="card-header">En Çok İlan Veren Firmalar</div>' +
      '<div class="table-wrapper"><table><thead><tr>' +
        '<th>#</th><th>Firma</th><th>Şehir</th><th>Toplam</th><th>Aktif</th><th>Satılan</th><th>Görüntülenme</th><th>Ort. Fiyat</th><th>Son İlan</th><th></th>' +
      '</tr></thead><tbody>' +
      cos.map(function(co, i) {
        return '<tr>' +
          '<td style="color:var(--text-mid);font-size:.82rem;">' + (i+1) + '</td>' +
          '<td><div style="font-weight:700;">' + esc(co.company_name) + '</div>' +
            '<div style="font-size:.72rem;color:var(--text-mid);">Üye: ' + new Date(co.member_since).toLocaleDateString('tr-TR') + '</div></td>' +
          '<td style="font-size:.82rem;">' + esc(co.city||'—') + '</td>' +
          '<td><strong>' + co.total_listings + '</strong></td>' +
          '<td><span class="badge badge-active">' + (co.active_listings||0) + '</span></td>' +
          '<td><span class="badge badge-sold">' + (co.sold_listings||0) + '</span></td>' +
          '<td>' + (co.total_views||0) + '</td>' +
          '<td style="font-size:.82rem;">' + fmt(co.avg_price) + '</td>' +
          '<td style="font-size:.75rem;white-space:nowrap;color:var(--text-mid);">' + (co.last_listing_at ? new Date(co.last_listing_at).toLocaleDateString('tr-TR') : '—') + '</td>' +
          '<td><a href="#/satici/' + co.user_id + '" target="_blank" class="btn btn-ghost btn-sm">İlanlar</a></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div></div>';

    // Sektör dağılımı (en aktif firma+sektör kombinasyonları)
    var sectorHTML =
      '<div class="card"><div class="card-header">Firma × Sektör Dağılımı (Aktif İlanlar)</div>' +
      '<div class="table-wrapper"><table><thead><tr><th>Firma</th><th>Sektör</th><th>İlan Sayısı</th><th></th></tr></thead><tbody>' +
      csd.map(function(r) {
        var maxCount = csd[0] ? csd[0].count : 1;
        var pct = Math.round((r.count / maxCount) * 100);
        return '<tr>' +
          '<td style="font-weight:600;">' + esc(r.company_name) + '</td>' +
          '<td><span class="badge badge-sell">' + esc(r.category) + '</span></td>' +
          '<td>' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<div style="flex:1;background:var(--bg-alt);border-radius:4px;height:7px;overflow:hidden;">' +
                '<div style="background:var(--blue);width:' + pct + '%;height:100%;border-radius:4px;"></div>' +
              '</div>' +
              '<span style="font-weight:700;min-width:24px;">' + r.count + '</span>' +
            '</div>' +
          '</td>' +
          '<td><a href="#/satici/' + r.user_id + '" target="_blank" class="btn btn-ghost btn-sm">İlanlar</a></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div></div>';

    c.innerHTML = '<h2 style="margin-bottom:20px;">Firmalar</h2>' + metricHTML + tableHTML + sectorHTML;

    // Client-side search
    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Firma adı ara...';
    input.className = 'form-control';
    input.style = 'width:220px;font-size:.82rem;padding:5px 10px;margin-bottom:12px;';
    var tableWrap = c.querySelector('.table-wrapper');
    if (tableWrap) {
      tableWrap.parentNode.insertBefore(input, tableWrap);
      input.addEventListener('input', function() {
        var q = this.value.toLowerCase();
        tableWrap.querySelectorAll('tbody tr').forEach(function(tr) {
          tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }
  } catch(err) {
    c.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>';
  }
}

// ================================================================
// FAVORİLERİM
// ================================================================
async function renderFavorites() {
  if (!isLoggedIn()) { goTo('/giris'); return; }
  var app = document.getElementById('app');
  app.innerHTML = '<div class="container" style="padding:40px 24px;"><div class="page-loading"><div class="spinner"></div></div></div>';
  try {
    var d = await api('GET', '/favorites');
    var favs = d.favorites || [];
    app.innerHTML =
      '<div class="container" style="padding:40px 24px;">' +
        '<h1 style="margin-bottom:24px;">Favorilerim <span style="font-size:1rem;color:var(--text-mid);font-weight:400;">(' + favs.length + ' ilan)</span></h1>' +
        (favs.length === 0
          ? '<div class="empty-state"><div class="empty-state-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" style="opacity:.35;"><circle cx="12" cy="12" r="8"/></svg></div><div class="empty-state-title">Henüz favori ilanınız yok</div><div class="empty-state-sub">İlan detayında <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;"><circle cx="12" cy="12" r="8"/></svg> butonuna tıklayarak favorilere ekleyebilirsiniz.</div><a href="#/ara" class="btn btn-primary" style="margin-top:16px;">İlanları Keşfet</a></div>'
          : '<div class="listing-grid">' + favs.map(listingCardHTML).join('') + '</div>'
        ) +
      '</div>';
  } catch(err) {
    app.innerHTML = '<div class="container" style="padding:40px;"><div class="alert alert-error">' + esc(err.message) + '</div></div>';
  }
}

// ================================================================
// BİLDİRİMLER
// ================================================================
async function renderNotifications() {
  if (!isLoggedIn()) { goTo('/giris'); return; }
  var app = document.getElementById('app');
  app.innerHTML = '<div class="container" style="padding:40px 24px;"><div class="page-loading"><div class="spinner"></div></div></div>';
  try {
    var d = await api('GET', '/notifications');
    var notifs = d.notifications || [];
    if (notifs.length > 0) {
      try { await api('PATCH', '/notifications/read-all'); } catch(e) {}
      var badge = document.getElementById('notifBadge');
      if (badge) badge.style.display = 'none';
    }

    var icons = { listing_approved: '✅', listing_rejected: '❌', new_message: '💬', price_change: '💰', favorite: '⭐', system: 'ℹ️' };

    app.innerHTML =
      '<div class="container" style="padding:40px 24px;max-width:680px;">' +
        '<h1 style="margin-bottom:24px;">Bildirimler</h1>' +
        (notifs.length === 0
          ? '<div class="empty-state"><div class="empty-state-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.3;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div><div class="empty-state-title">Bildirim yok</div></div>'
          : notifs.map(function(n) {
              return '<div class="notif-item' + (n.is_read ? '' : ' notif-unread') + '"' +
                (n.link ? ' style="cursor:pointer;" onclick="goTo(\'' + n.link + '\')"' : '') + '>' +
                '<div class="notif-icon">' + (icons[n.type] || 'ℹ️') + '</div>' +
                '<div class="notif-body">' +
                  '<div class="notif-title">' + esc(n.title) + '</div>' +
                  (n.body ? '<div class="notif-sub">' + esc(n.body) + '</div>' : '') +
                  '<div class="notif-time">' + new Date(n.created_at).toLocaleString('tr-TR') + '</div>' +
                '</div>' +
              '</div>';
            }).join('')
        ) +
      '</div>';
  } catch(err) {
    app.innerHTML = '<div class="container" style="padding:40px;"><div class="alert alert-error">' + esc(err.message) + '</div></div>';
  }
}

// ================================================================
// ŞİFREMİ UNUTTUM
// ================================================================
function renderForgotPassword() {
  if (isLoggedIn()) { goTo('/'); return; }
  document.getElementById('app').innerHTML =
    '<div class="auth-page">' +
      '<div class="auth-card">' +
        '<h2>Şifremi Unuttum</h2>' +
        '<p style="color:var(--text-mid);margin-bottom:20px;">E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.</p>' +
        '<form id="forgotForm">' +
          '<div class="form-group mb-4"><label class="form-label">E-posta <span class="req">*</span></label>' +
            '<input type="email" name="email" class="form-control" placeholder="ornek@firma.com" required autofocus /></div>' +
          '<div id="forgotMsg" class="alert" style="display:none;"></div>' +
          '<button type="submit" class="btn btn-primary w-100 btn-lg" id="forgotBtn">Sıfırlama Linki Gönder</button>' +
          '<div class="auth-divider"></div>' +
          '<a href="#/giris" class="btn btn-outline w-100">Giriş Yap</a>' +
        '</form>' +
      '</div>' +
    '</div>';

  document.getElementById('forgotForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = document.getElementById('forgotBtn');
    var msg = document.getElementById('forgotMsg');
    btn.disabled = true; btn.textContent = 'Gönderiliyor...';
    msg.style.display = 'none';
    try {
      var res = await api('POST', '/auth/forgot-password', { email: e.target.email.value });
      msg.className = 'alert alert-success';
      if (res.dev_link) {
        msg.innerHTML = esc(res.message) + '<br><br><strong>Geliştirici Modu — Sıfırlama Linki:</strong><br><a href="' + esc(res.dev_link) + '" style="word-break:break-all;color:var(--blue);">' + esc(res.dev_link) + '</a>';
      } else {
        msg.textContent = res.message;
      }
      msg.style.display = 'block';
      btn.textContent = 'Gönderildi ✓';
      if (!document.getElementById('resendWrap')) {
        var resendWrap = document.createElement('div');
        resendWrap.id = 'resendWrap';
        resendWrap.style.marginTop = '12px';
        msg.insertAdjacentElement('afterend', resendWrap);
      }
      document.getElementById('resendWrap').innerHTML = '<button type="button" class="btn btn-outline w-100" id="resendBtn">Link gelmedi mi? Tekrar gönder</button>';
      document.getElementById('resendBtn').onclick = async function() {
        var rb = this;
        var emailVal = document.querySelector('#forgotForm [name="email"]').value;
        rb.disabled = true; rb.textContent = 'Gönderiliyor...';
        try {
          await api('POST', '/auth/forgot-password', { email: emailVal });
          rb.textContent = 'Tekrar gönderildi ✓';
          setTimeout(function() { rb.disabled = false; rb.textContent = 'Link gelmedi mi? Tekrar gönder'; }, 30000);
        } catch(e) { rb.disabled = false; rb.textContent = 'Link gelmedi mi? Tekrar gönder'; toast(e.message,'error'); }
      };
    } catch(err) {
      msg.className = 'alert alert-error';
      msg.textContent = err.message;
      msg.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Sıfırlama Linki Gönder';
    }
  });
}

// ================================================================
// ŞİFRE SIFIRLA
// ================================================================
function renderResetPassword() {
  if (isLoggedIn()) { goTo('/'); return; }
  var sp = new URLSearchParams(window.location.hash.split('?')[1] || '');
  var token = sp.get('token') || '';
  document.getElementById('app').innerHTML =
    '<div class="auth-page">' +
      '<div class="auth-card">' +
        '<h2>Yeni Şifre Belirle</h2>' +
        (!token
          ? '<div class="alert alert-error">Geçersiz veya eksik sıfırlama bağlantısı.</div><a href="#/sifremi-unuttum" class="btn btn-primary w-100" style="margin-top:16px;">Tekrar Dene</a>'
          : '<form id="resetForm">' +
              '<div class="form-group mb-4"><label class="form-label">Yeni Şifre <span class="req">*</span></label>' +
                '<input type="password" name="password" class="form-control" placeholder="En az 8 karakter" required minlength="8" autofocus /></div>' +
              '<div class="form-group mb-4"><label class="form-label">Şifre Tekrar <span class="req">*</span></label>' +
                '<input type="password" name="password2" class="form-control" placeholder="Şifreyi tekrar girin" required /></div>' +
              '<div id="resetMsg" class="alert" style="display:none;"></div>' +
              '<button type="submit" class="btn btn-primary w-100 btn-lg" id="resetBtn">Şifremi Güncelle</button>' +
            '</form>'
        ) +
      '</div>' +
    '</div>';

  if (!token) return;
  document.getElementById('resetForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = document.getElementById('resetBtn');
    var msg = document.getElementById('resetMsg');
    var pw  = e.target.password.value;
    var pw2 = e.target.password2.value;
    if (pw !== pw2) {
      msg.className = 'alert alert-error'; msg.textContent = 'Şifreler eşleşmiyor.'; msg.style.display = 'block'; return;
    }
    btn.disabled = true; btn.textContent = 'Güncelleniyor...';
    msg.style.display = 'none';
    try {
      var res = await api('POST', '/auth/reset-password', { token: token, password: pw });
      msg.className = 'alert alert-success'; msg.textContent = res.message; msg.style.display = 'block';
      btn.textContent = 'Güncellendi ✓';
      setTimeout(function() { goTo('/giris'); }, 2000);
    } catch(err) {
      msg.className = 'alert alert-error'; msg.textContent = err.message; msg.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Şifremi Güncelle';
    }
  });
}

// ================================================================
// ADMIN: RAPORLAR
// ================================================================
async function loadAdminReports() {
  var c = document.getElementById('reportsContent');
  if (!c) return;
  c.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    var d = await api('GET', '/admin/reports');
    var reports = d.reports || [];
    if (!reports.length) {
      c.innerHTML = '<h2 style="margin-bottom:20px;">Şikayet Raporları</h2><div class="alert alert-success">Bekleyen şikayet yok.</div>';
      return;
    }
    var html = '<h2 style="margin-bottom:16px;">Şikayet Raporları <span style="font-size:.85rem;color:var(--text-mid);font-weight:400;">(' + reports.length + ' rapor)</span></h2>' +
      '<div class="table-wrapper"><table><thead><tr>' +
        '<th>#</th><th>İlan</th><th>Sebep</th><th>Şikayetçi</th><th>Durum</th><th>Tarih</th><th>İşlem</th>' +
      '</tr></thead><tbody>' +
      reports.map(function(r) {
        return '<tr id="rrow_' + r.id + '">' +
          '<td>' + r.id + '</td>' +
          '<td><a href="#/ilan/' + r.listing_id + '" style="color:var(--blue);">' + esc(r.listing_title || '#' + r.listing_id) + '</a></td>' +
          '<td>' + esc(r.reason) + (r.detail ? '<div style="font-size:.75rem;color:var(--text-mid);">' + esc(r.detail) + '</div>' : '') + '</td>' +
          '<td style="font-size:.8rem;">' + esc(r.reporter_name || '—') + '</td>' +
          '<td><span class="badge ' + (r.status === 'pending' ? 'badge-pending' : 'badge-active') + '">' + (r.status === 'pending' ? 'Bekliyor' : 'Kapatıldı') + '</span></td>' +
          '<td style="font-size:.78rem;">' + new Date(r.created_at).toLocaleDateString('tr-TR') + '</td>' +
          '<td style="display:flex;gap:4px;">' +
            (r.listing_id ? '<button type="button" class="btn btn-danger btn-sm" data-report-del-listing="' + r.listing_id + '">İlanı Sil</button>' : '') +
            (r.status === 'pending' ? '<button type="button" class="btn btn-ghost btn-sm" data-report-resolve="' + r.id + '">Kapat</button>' : '') +
          '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>';

    c.innerHTML = html;

    c.querySelectorAll('[data-report-resolve]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        try { await api('PATCH', '/admin/reports/' + btn.dataset.reportResolve + '/resolve'); document.getElementById('rrow_' + btn.dataset.reportResolve)?.remove(); toast('Kapatıldı.','success'); }
        catch(e) { toast(e.message,'error'); }
      });
    });
    c.querySelectorAll('[data-report-del-listing]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (!confirm('İlan kalıcı silinecek. Emin misiniz?')) return;
        try { await api('DELETE', '/admin/listings/' + btn.dataset.reportDelListing); toast('İlan silindi.','success'); loadAdminReports(); }
        catch(e) { toast(e.message,'error'); }
      });
    });
  } catch(err) {
    c.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>';
  }
}
