'use strict';

const express = require('express');
const { getDb } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();
router.use(authenticate);

function sanitize(str) {
  return String(str || '').replace(/<[^>]*>/g, '').trim().substring(0, 2000);
}

// GET /api/messages — konuşma listesi
router.get('/', (req, res) => {
  try {
    const db  = getDb();
    const uid = req.userId;
    const rows = db.prepare(`
      SELECT
        c.id, c.listing_id, c.last_message_at,
        CASE WHEN c.user1_id=? THEN c.user2_id ELSE c.user1_id END AS other_user_id,
        u.name AS other_name, u.company_name AS other_company,
        l.title AS listing_title,
        m.content AS last_message,
        m.sender_id AS last_sender_id,
        (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND is_read=0 AND sender_id!=?) AS unread
      FROM conversations c
      JOIN users u ON u.id = CASE WHEN c.user1_id=? THEN c.user2_id ELSE c.user1_id END
      LEFT JOIN listings l ON l.id = c.listing_id
      LEFT JOIN messages m ON m.id = (
        SELECT id FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC, id DESC LIMIT 1
      )
      WHERE c.user1_id=? OR c.user2_id=?
      ORDER BY c.last_message_at DESC
    `).all(uid, uid, uid, uid, uid);
    res.json(rows);
  } catch (err) {
    console.error('[MESSAGES] list:', err.message);
    res.status(500).json({ error: 'Mesajlar yüklenemedi.' });
  }
});

// GET /api/messages/unread
router.get('/unread', (req, res) => {
  try {
    const db  = getDb();
    const uid = req.userId;
    const row = db.prepare(`
      SELECT COUNT(*) AS n FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE (c.user1_id=? OR c.user2_id=?) AND m.sender_id!=? AND m.is_read=0
    `).get(uid, uid, uid);
    res.json({ unread: row.n });
  } catch (err) {
    console.error('[MESSAGES] unread:', err.message);
    res.status(500).json({ error: 'Okunmamış sayısı alınamadı.' });
  }
});

// GET /api/messages/:convId
router.get('/:convId', (req, res) => {
  try {
    const db  = getDb();
    const uid = req.userId;
    const conv = db.prepare(
      'SELECT * FROM conversations WHERE id=? AND (user1_id=? OR user2_id=?)'
    ).get(req.params.convId, uid, uid);
    if (!conv) return res.status(404).json({ error: 'Konuşma bulunamadı.' });

    db.prepare(
      'UPDATE messages SET is_read=1 WHERE conversation_id=? AND sender_id!=? AND is_read=0'
    ).run(conv.id, uid);

    const msgs = db.prepare(`
      SELECT m.*, u.name AS sender_name, u.company_name AS sender_company
      FROM messages m JOIN users u ON u.id=m.sender_id
      WHERE m.conversation_id=?
      ORDER BY m.created_at ASC
    `).all(conv.id);

    const otherId = conv.user1_id === uid ? conv.user2_id : conv.user1_id;
    const other   = db.prepare('SELECT id, name, company_name, city FROM users WHERE id=?').get(otherId);
    const listing = conv.listing_id
      ? db.prepare('SELECT id, title, status, category_id FROM listings WHERE id=?').get(conv.listing_id)
      : null;

    res.json({ conversation: conv, messages: msgs, other, listing });
  } catch (err) {
    console.error('[MESSAGES] get conv:', err.message);
    res.status(500).json({ error: 'Konuşma yüklenemedi.' });
  }
});

// POST /api/messages — yeni konuşma başlat
router.post('/', (req, res) => {
  try {
    const db      = getDb();
    const uid     = req.userId;
    const { to_user_id, listing_id, content } = req.body;

    if (!to_user_id || !content || !String(content).trim())
      return res.status(400).json({ error: 'Alıcı ve mesaj içeriği zorunludur.' });
    if (String(to_user_id) === String(uid))
      return res.status(400).json({ error: 'Kendinize mesaj gönderemezsiniz.' });
    if (!listing_id)
      return res.status(400).json({ error: 'Mesaj göndermek için bir ilan üzerinden iletişime geçmelisiniz.' });
    const lst = db.prepare('SELECT id, user_id FROM listings WHERE id = ?').get(parseInt(listing_id));
    if (!lst || String(lst.user_id) !== String(to_user_id))
      return res.status(400).json({ error: 'Geçersiz ilan.' });

    const target = db.prepare('SELECT id FROM users WHERE id=? AND is_active=1').get(to_user_id);
    if (!target) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    let conv = db.prepare(`
      SELECT * FROM conversations
      WHERE (user1_id=? AND user2_id=?) OR (user1_id=? AND user2_id=?)
      ${listing_id ? 'AND listing_id=?' : 'AND listing_id IS NULL'}
      LIMIT 1
    `).get(...(listing_id ? [uid, to_user_id, to_user_id, uid, listing_id] : [uid, to_user_id, to_user_id, uid]));

    if (!conv) {
      const r = db.prepare(
        'INSERT INTO conversations (user1_id, user2_id, listing_id) VALUES (?, ?, ?)'
      ).run(uid, to_user_id, listing_id || null);
      conv = db.prepare('SELECT * FROM conversations WHERE id=?').get(r.lastInsertRowid);
    }

    db.prepare(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)'
    ).run(conv.id, uid, sanitize(content));
    db.prepare("UPDATE conversations SET last_message_at=datetime('now') WHERE id=?").run(conv.id);

    // Alıcıya bildirim gönder
    try {
      const sender = db.prepare('SELECT name, company_name FROM users WHERE id=?').get(uid);
      const senderLabel = sender?.company_name || sender?.name || 'Biri';
      const listingTitle = listing_id
        ? db.prepare('SELECT title FROM listings WHERE id=?').get(listing_id)?.title
        : null;
      createNotification(
        db, parseInt(to_user_id), 'new_message',
        'Yeni Mesaj',
        listingTitle
          ? `${senderLabel} "${listingTitle}" ilanınız için mesaj gönderdi.`
          : `${senderLabel} size bir mesaj gönderdi.`,
        '/mesajlar/' + conv.id
      );
    } catch(e) {}

    res.status(201).json({ conversation_id: conv.id });
  } catch (err) {
    console.error('[MESSAGES] create:', err.message);
    res.status(500).json({ error: 'Mesaj gönderilemedi.' });
  }
});

// POST /api/messages/:convId — mevcut konuşmaya mesaj
router.post('/:convId', (req, res) => {
  try {
    const db  = getDb();
    const uid = req.userId;
    const conv = db.prepare(
      'SELECT * FROM conversations WHERE id=? AND (user1_id=? OR user2_id=?)'
    ).get(req.params.convId, uid, uid);
    if (!conv) return res.status(404).json({ error: 'Konuşma bulunamadı.' });

    const { content } = req.body;
    if (!content || !content.trim())
      return res.status(400).json({ error: 'Mesaj içeriği boş olamaz.' });

    const msgResult = db.prepare(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)'
    ).run(conv.id, uid, sanitize(content));
    db.prepare("UPDATE conversations SET last_message_at=datetime('now') WHERE id=?").run(conv.id);

    // Karşı tarafa bildirim gönder
    try {
      const recipientId = conv.user1_id === uid ? conv.user2_id : conv.user1_id;
      const sender = db.prepare('SELECT name, company_name FROM users WHERE id=?').get(uid);
      const senderLabel = sender?.company_name || sender?.name || 'Biri';
      const listingTitle = conv.listing_id
        ? db.prepare('SELECT title FROM listings WHERE id=?').get(conv.listing_id)?.title
        : null;
      createNotification(
        db, recipientId, 'new_message',
        'Yeni Mesaj',
        listingTitle
          ? `${senderLabel} "${listingTitle}" ilanı için yanıt verdi.`
          : `${senderLabel} size yanıt verdi.`,
        '/mesajlar/' + conv.id
      );
    } catch(e) {}

    res.status(201).json({ message_id: msgResult.lastInsertRowid });
  } catch (err) {
    console.error('[MESSAGES] reply:', err.message);
    res.status(500).json({ error: 'Mesaj gönderilemedi.' });
  }
});

module.exports = router;
