'use strict';
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const NAVY = '#16213A';
const GOLD = '#E0972E';
const FONT = "'Arial Black', Arial, sans-serif";

const markSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${NAVY}"/>
  <text x="256" y="325" text-anchor="middle" font-family="${FONT}" font-size="195" letter-spacing="-2"><tspan fill="#ffffff">T</tspan><tspan fill="${GOLD}">GO</tspan></text>
</svg>`;

const wordmarkSvg = `
<svg width="700" height="120" viewBox="0 0 700 120" xmlns="http://www.w3.org/2000/svg">
  <text x="10" y="90" font-family="${FONT}" font-size="76" letter-spacing="-1"><tspan fill="#ffffff">TOPTAN</tspan><tspan fill="${GOLD}">GO</tspan></text>
</svg>`;

const outDir = path.join(__dirname, '..', 'brand_assets');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'mark.svg'), markSvg);
fs.writeFileSync(path.join(outDir, 'wordmark.svg'), wordmarkSvg);

function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const dirEntries = [];
  const imageDatas = [];
  let offset = 6 + count * 16;
  for (const e of entries) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(e.size === 256 ? 0 : e.size, 0);
    dir.writeUInt8(e.size === 256 ? 0 : e.size, 1);
    dir.writeUInt8(0, 2);
    dir.writeUInt8(0, 3);
    dir.writeUInt16LE(1, 4);
    dir.writeUInt16LE(32, 6);
    dir.writeUInt32LE(e.buf.length, 8);
    dir.writeUInt32LE(offset, 12);
    offset += e.buf.length;
    dirEntries.push(dir);
    imageDatas.push(e.buf);
  }
  return Buffer.concat([header, ...dirEntries, ...imageDatas]);
}

async function run() {
  const squareBuf = await sharp(Buffer.from(markSvg)).png().toBuffer();
  fs.writeFileSync(path.join(outDir, 'square_512.png'), squareBuf);

  const maskSvg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><circle cx="256" cy="256" r="256" fill="#ffffff"/></svg>`;
  const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
  const roundBuf = await sharp(squareBuf)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(outDir, 'round_512.png'), roundBuf);

  await sharp(squareBuf).resize(180, 180).png().toFile(path.join(outDir, 'apple_touch_180.png'));

  const png48 = await sharp(squareBuf).resize(48, 48).png().toBuffer();
  const png32 = await sharp(squareBuf).resize(32, 32).png().toBuffer();
  const png16 = await sharp(squareBuf).resize(16, 16).png().toBuffer();
  fs.copyFileSync(path.join(outDir, 'square_512.png'), path.join(outDir, 'favicon_512.png'));

  const ico = buildIco([
    { size: 16, buf: png16 },
    { size: 32, buf: png32 },
    { size: 48, buf: png48 },
  ]);
  fs.writeFileSync(path.join(outDir, 'favicon.ico'), ico);

  const wordmarkBuf = await sharp(Buffer.from(wordmarkSvg)).png().toBuffer();
  fs.writeFileSync(path.join(outDir, 'wordmark_700.png'), wordmarkBuf);

  console.log('done, files in', outDir);
}
run().catch(e => { console.error(e); process.exit(1); });
