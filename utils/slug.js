'use strict';

// Turkce karakterleri sadelestirip URL'ye uygun slug uretir.
// public/js/app.js icindeki slugify() ile AYNI kurali kullanmali —
// istemci ve sunucu ayni ilan icin ayni URL'yi uretmeli.
function slugify(s) {
  return String(s || '').toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o')
    .replace(/ş/g, 's').replace(/ü/g, 'u').replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80).replace(/-+$/, '');
}

function listingPath(l) {
  const s = slugify(l && l.title);
  return '/ilan/' + l.id + (s ? '-' + s : '');
}

module.exports = { slugify, listingPath };
