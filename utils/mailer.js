'use strict';

// Resend HTTP API uzerinden mail gonderme — SMTP port bloklarina takilmadigi
// icin (ör. sifre sifirlama, e-posta dogrulama kodu, ilan onay bildirimi)
// tum sistem mailleri bu tek yardimciyi kullanir.
const BRAND_NAME = 'ToptanGO';

// SMTP_FROM ortam degiskeni hala eski marka adini ("Ticarethane <...>")
// tasiyabilir; gonderen ADRESINI (Resend'de dogrulanmis domain) aynen
// koruyup sadece gorunen adi marka adiyla degistiriyoruz — boylece teslimat
// bozulmaz.
function buildFromAddress() {
  const raw = process.env.SMTP_FROM || '';
  const m = raw.match(/<([^>]+)>/);
  const addr = m ? m[1] : (raw.includes('@') ? raw.trim() : 'onboarding@resend.dev');
  return BRAND_NAME + ' <' + addr + '>';
}

const REPLY_TO = process.env.MAIL_REPLY_TO || 'destek@toptango.com.tr';

// HTML'den okunabilir duz metin uretir: butonlari/linkleri "metin (url)" yapar.
function htmlToText(html) {
  return String(html || '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (m, url, label) => {
      const t = label.replace(/<[^>]+>/g, '').trim();
      return t && t !== url ? t + ' (' + url + ')' : url;
    })
    .replace(/<\/(p|div|h[1-6]|tr)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr[^>]*>/gi, '\n----\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&copy;/g, '(c)').replace(/&middot;/g, '-').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function sendResendMail(to, subject, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return { sent: false };
  try {
    const fromAddr = buildFromAddress();
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      // HTML'in yaninda duz metin versiyonu da gonderiyoruz (yalnizca HTML
      // iceren mailler spam filtrelerinde daha yuksek puan aliyor) ve yanit
      // adresi olarak gercek destek kutusunu veriyoruz.
      body: JSON.stringify({ from: fromAddr, to: [to], subject, html, text: htmlToText(html), reply_to: REPLY_TO }),
    });
    const result = await resp.json();
    if (!resp.ok) { console.error('[MAIL] Resend hatasi:', JSON.stringify(result)); return { sent: false }; }
    console.info('[MAIL] gonderildi:', result.id);
    return { sent: true };
  } catch (e) {
    console.error('[MAIL] gonderim hatasi:', e.message);
    return { sent: false };
  }
}

// Butun sistem mailleri icin ortak govde/sablon.
function mailTemplate(title, bodyHtml) {
  return [
    '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">',
    '<div style="background:#1e3a8a;padding:24px 32px;">',
    '<h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:800;">Toptan<span style="color:#e09a22;">GO</span></h1>',
    '<p style="color:#93c5fd;font-size:13px;margin:6px 0 0;">B2B Ticaret Platformu</p>',
    '</div>',
    '<div style="padding:32px;">',
    '<h2 style="color:#111827;font-size:18px;margin:0 0 16px;">' + title + '</h2>',
    bodyHtml,
    '</div>',
    '<div style="background:#f9fafb;padding:16px 32px;text-align:center;">',
    '<p style="color:#9ca3af;font-size:11px;margin:0;">&copy; ' + new Date().getFullYear() + ' ToptanGO &middot; <a href="https://www.toptango.com.tr" style="color:#6b7280;text-decoration:none;">toptango.com.tr</a></p>',
    '</div>',
    '</div>',
  ].join('');
}

module.exports = { sendResendMail, mailTemplate, buildFromAddress };
