'use strict';

// iOS'a (APNs) push bildirimi gonderme yardimcisi. Ortam degiskenleri
// ayarlanmamissa sessizce devre disi kalir — yani bu dosya olmadan da
// uygulama normal calismaya devam eder, sadece push gonderilmez.
//
// Gerekli ortam degiskenleri (Railway > Variables):
//   APNS_KEY        — .p8 dosyasinin icerigi (satir sonlari \n olarak kacisli
//                      tek satirda, ya da oldugu gibi coklu satir)
//   APNS_KEY_ID      — .p8 anahtarinin Key ID'si (Apple Developer Portal)
//   APNS_TEAM_ID     — Apple Developer hesabinin Team ID'si
//   APNS_BUNDLE_ID   — varsayilan: com.toptango.app
//   NODE_ENV=production oldugunda APNs'in production ortami kullanilir,
//   aksi halde sandbox (development) ortami kullanilir — Xcode'dan simulator/
//   debug build ile gelen token'lar sandbox'ta kayitlidir.

const apn = require('@parse/node-apn');
const { getDb } = require('../database/db');

let _provider = null;
let _attempted = false;

function getProvider() {
  if (_attempted) return _provider;
  _attempted = true;

  const key = process.env.APNS_KEY;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  if (!key || !keyId || !teamId) {
    console.info('[PUSH] APNS ortam degiskenleri eksik, push bildirimleri devre disi.');
    return null;
  }

  try {
    _provider = new apn.Provider({
      token: {
        key: key.replace(/\\n/g, '\n'),
        keyId,
        teamId,
      },
      production: process.env.NODE_ENV === 'production',
    });
    console.info('[PUSH] APNs provider hazir (' + (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') + ').');
  } catch (e) {
    console.error('[PUSH] APNs provider olusturulamadi:', e.message);
    _provider = null;
  }
  return _provider;
}

// userId'nin kayitli tum cihazlarina push gonderir. Gecersiz/suresi dolmus
// token'lari (Apple'in "failed" listesinden) veritabanindan siler.
async function sendPushToUser(userId, { title, body, link }) {
  const provider = getProvider();
  if (!provider) return;

  try {
    const db = getDb();
    const rows = db.prepare('SELECT token FROM device_tokens WHERE user_id = ?').all(userId);
    if (!rows.length) return;

    const notification = new apn.Notification();
    notification.alert = { title, body };
    notification.sound = 'default';
    notification.topic = process.env.APNS_BUNDLE_ID || 'com.toptango.app';
    if (link) notification.payload = { link };

    const tokens = rows.map(r => r.token);
    const result = await provider.send(notification, tokens);

    (result.failed || []).forEach(f => {
      if (f.status === '410' || (f.response && f.response.reason === 'BadDeviceToken')) {
        try { db.prepare('DELETE FROM device_tokens WHERE token = ?').run(f.device); } catch (e) {}
      }
    });
  } catch (e) {
    console.error('[PUSH] gonderim hatasi:', e.message);
  }
}

module.exports = { sendPushToUser };
