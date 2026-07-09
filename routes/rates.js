'use strict';

const express = require('express');
const router  = express.Router();

// Son bilinen kurlar (sunucu ayakta kaldıkça hafızada tutulur)
let _cache = { USD: null, EUR: null, at: 0, source: null };
const FALLBACK = { USD: 40, EUR: 43 }; // her şey çökerse son çare
const TTL = 30 * 60 * 1000; // 30 dk

async function tryFetch(url, timeoutMs) {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs || 8000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function fetchFresh() {
  // Kaynak 1: open.er-api.com (TRY bazlı)
  try {
    const d = await tryFetch('https://open.er-api.com/v6/latest/TRY');
    if (d && d.rates && d.rates.USD > 0 && d.rates.EUR > 0) {
      return { USD: 1 / d.rates.USD, EUR: 1 / d.rates.EUR, source: 'er-api' };
    }
  } catch (e) { /* siradakine gec */ }
  // Kaynak 2: frankfurter.dev (Avrupa Merkez Bankası)
  try {
    const d = await tryFetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=TRY,EUR');
    if (d && d.rates && d.rates.TRY > 0 && d.rates.EUR > 0) {
      return { USD: d.rates.TRY, EUR: d.rates.TRY / d.rates.EUR, source: 'frankfurter' };
    }
  } catch (e) { /* siradakine gec */ }
  // Kaynak 3: fawazahmed0 currency-api (CDN, cok yuksek erisilebilirlik)
  try {
    const d = await tryFetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/try.json');
    const t = d && d.try;
    if (t && t.usd > 0 && t.eur > 0) {
      return { USD: 1 / t.usd, EUR: 1 / t.eur, source: 'currency-api' };
    }
  } catch (e) { /* hepsi coktu */ }
  return null;
}

async function getRates() {
  if (_cache.USD && Date.now() - _cache.at < TTL) return _cache;
  const fresh = await fetchFresh();
  if (fresh) {
    _cache = { USD: fresh.USD, EUR: fresh.EUR, at: Date.now(), source: fresh.source };
  } else if (!_cache.USD) {
    // hic veri yoksa son care sabit degerler (bayat oldugu belirtilir)
    _cache = { USD: FALLBACK.USD, EUR: FALLBACK.EUR, at: 0, source: 'fallback' };
  }
  // fresh null ama eski _cache varsa: bayat da olsa son bilinen gercek kuru sun
  return _cache;
}

router.get('/', async (_req, res) => {
  try {
    const r = await getRates();
    res.json({
      USD: Math.round(r.USD * 10000) / 10000,
      EUR: Math.round(r.EUR * 10000) / 10000,
      source: r.source,
      updated_at: r.at ? new Date(r.at).toISOString() : null
    });
  } catch (err) {
    res.json({ USD: FALLBACK.USD, EUR: FALLBACK.EUR, source: 'fallback', updated_at: null });
  }
});

// Acilista ve saatte bir arka planda tazele — ilk ziyaretci bile guncel kur gorsun
getRates().then(r => console.log('[FX] Kurlar hazir:', r.source, 'USD', r.USD && r.USD.toFixed(2), 'EUR', r.EUR && r.EUR.toFixed(2))).catch(() => {});
setInterval(() => { _cache.at = 0; getRates().catch(() => {}); }, 60 * 60 * 1000);

module.exports = router;
