'use strict';

// Resend HTTP API uzerinden mail gonderme — SMTP port bloklarina takilmadigi
// icin (ör. sifre sifirlama, e-posta dogrulama kodu, ilan onay bildirimi)
// tum sistem mailleri bu tek yardimciyi kullanir.
async function sendResendMail(to, subject, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return { sent: false };
  try {
    const fromAddr = process.env.SMTP_FROM || 'Toptango <onboarding@resend.dev>';
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddr, to: [to], subject, html }),
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
    '<h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:700;">Toptango</h1>',
    '<p style="color:#93c5fd;font-size:13px;margin:6px 0 0;">B2B Ticaret Platformu</p>',
    '</div>',
    '<div style="padding:32px;">',
    '<h2 style="color:#111827;font-size:18px;margin:0 0 16px;">' + title + '</h2>',
    bodyHtml,
    '</div>',
    '<div style="background:#f9fafb;padding:16px 32px;text-align:center;">',
    '<p style="color:#9ca3af;font-size:11px;margin:0;">&copy; 2025 Toptango &middot; <a href="https://www.toptango.com.tr" style="color:#6b7280;text-decoration:none;">toptango.com.tr</a></p>',
    '</div>',
    '</div>',
  ].join('');
}

module.exports = { sendResendMail, mailTemplate };
