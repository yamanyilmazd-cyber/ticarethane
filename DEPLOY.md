# Ticarethane — Kurulum ve Yayinlama Rehberi

## 1. Yerel Kurulum (Test)

### Gereksinimler
- Node.js 18 veya uzeri (https://nodejs.org)
- npm (Node ile birlikte gelir)

### Adimlar

```bash
# 1. Proje klasorune gir
cd ticarethane

# 2. Bagimliliklari yukle
npm install

# 3. .env dosyasini olustur
cp .env.example .env

# 4. .env dosyasini bir metin editoruyle ac ve degerleri degistir:
#    - JWT_SECRET: Guclu, rastgele bir anahtar yazin (en az 32 karakter)
#    - ADMIN_EMAIL: Kendi e-postaniz
#    - ADMIN_PASSWORD: Guclu bir sifre

# 5. Sunucuyu baslat
npm start

# Tarayicida ac:
# http://localhost:3000
```

Admin paneline giris: http://localhost:3000/#/admin
(`.env` dosyasinda tanimladiginiz e-posta ve sifre ile)

---

## 2. Internete Yayinlama — Railway (En Kolay Yol)

**Railway** ucretsiz tier sunar, kredi karti gerektirmez, 5 dakikada canli.

### Adim 1 — Railway hesabi ac
https://railway.app adresine gidin, GitHub ile kayit olun.

### Adim 2 — Proje dosyalarini GitHub'a yukle

```bash
# Proje klasorunde terminal ac
git init
git add .
git commit -m "Ticarethane ilk surum"

# GitHub'da yeni bir repository olusturun (github.com)
# Ardindan:
git remote add origin https://github.com/KULLANICI_ADI/ticarethane.git
git branch -M main
git push -u origin main
```

### Adim 3 — Railway'de deploy et

1. Railway dashboard'da **New Project** tiklayin
2. **Deploy from GitHub repo** secin
3. Ticarethane reponuzu secin
4. Deploy baslar — ~2 dakika bekleyin

### Adim 4 — Ortam degiskenlerini ayarla

Railway dashboard → projeniz → **Variables** sekmesi:

| Degisken       | Deger                                          |
|----------------|------------------------------------------------|
| PORT           | 3000                                           |
| NODE_ENV       | production                                     |
| JWT_SECRET     | (cok uzun, rastgele bir sifre yazin)           |
| ADMIN_EMAIL    | (sizin e-postaniz)                             |
| ADMIN_PASSWORD | (guclu sifreniz)                               |
| DB_PATH        | /app/database/ticarethane.db                   |

### Adim 5 — Domain al

Railway → projeniz → **Settings** → **Domains** → Generate Domain
Size `ticarethane-xxx.up.railway.app` gibi bir URL verir.

**Kendi domaininizi baglamak icin:**
Railway → Settings → Custom Domain → domain adinizi yazin
→ DNS ayarlarinizda CNAME kaydini Railway'in verdigi adrese yonlendirin.

---

## 3. Alternatif: Render.com

1. https://render.com → New → Web Service
2. GitHub reponuzu baglayin
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Environment Variables: Yukaridaki tabloyu girin
6. Free tier secin → Deploy

---

## 4. VPS / Sunucu (Digitalocean, Hetzner vb.)

```bash
# Sunucuda Node yukle
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Projeyi yukle
git clone https://github.com/KULLANICI/ticarethane.git
cd ticarethane
npm install

# .env olustur ve degerleri gir
nano .env

# PM2 ile kalici calistir
npm install -g pm2
pm2 start server.js --name ticarethane
pm2 startup
pm2 save

# Nginx kurarak 80/443 portuna yonlendir
sudo apt install nginx
# /etc/nginx/sites-available/ticarethane dosyasina:
# proxy_pass http://localhost:3000;
```

---

## 5. Iyzico Entegrasyonu (Sonradan)

Site gelir modeline gecildiginde asagidaki adimlar uygulanacak:

### 5.1 — iyzico paketi yukle
```bash
npm install iyzipay
```

### 5.2 — .env'e ekle
```
IYZICO_API_KEY=sandbox-xxx
IYZICO_SECRET_KEY=sandbox-xxx
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

### 5.3 — routes/payment.js olustur
iyzico Node.js SDK dokumanini kullanarak odeme akisi:
- Ilan sahibi "Premium Ilan" satin almak ister
- /api/payment/init endpoint'i iyzico Initialize Payment cagrisini yapar
- Frontend iyzico checkout formunu gosterir
- Basarili odeme sonrasi ilan "premium" statuse gecer

### 5.4 — Veritabanina premium sutunu ekle
```sql
ALTER TABLE listings ADD COLUMN is_premium INTEGER DEFAULT 0;
ALTER TABLE listings ADD COLUMN premium_expires_at DATETIME;
```

Iyzico test API anahtarlari icin: https://dev.iyzipay.com/

---

## 6. Onemli Guvenlik Notlari (Canli Ortam)

- [ ] JWT_SECRET'i hic kimseyle paylasmayın, guclu yapın (32+ karakter, rastgele)
- [ ] ADMIN_PASSWORD'u tahmin edilemez yapin
- [ ] HTTPS kullanın (Railway/Render otomatik saglar; VPS'te Let's Encrypt)
- [ ] Uploads klasorunu duzenli yedekleyin
- [ ] `.env` dosyasini asla Git'e push etmeyin (.gitignore'a ekli oldugunu dogrulayin)

---

## 7. Proje Yapisi

```
ticarethane/
├── server.js              # Express ana sunucu
├── package.json
├── .env.example           # Ornek ortam degiskenleri
├── database/
│   └── db.js              # SQLite baglantisi + tablo olusturma + seed
├── middleware/
│   ├── auth.js            # JWT dogrulama
│   └── upload.js          # Multer gorsel yukleme
├── routes/
│   ├── auth.js            # Kayit, giris, profil
│   ├── listings.js        # Ilan CRUD
│   ├── categories.js      # Kategori listesi
│   └── admin.js           # Yonetici islemleri
├── public/
│   ├── index.html         # SPA kabugu
│   ├── css/style.css      # Tum stiller
│   └── js/app.js          # Frontend SPA mantigi
└── uploads/               # Yuklenen gorseller (otomatik olusur)
```
