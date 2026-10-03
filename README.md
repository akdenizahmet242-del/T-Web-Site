# T Atelier — Tasarım Odaklı E-Ticaret Platformu

Duvar saatleri, Hilton banyo dolapları, su arıtma & tesisat ürünleri ve tasarım kitap
ayraçları için; scroll ile canlanan ürün sahneleri, CDN dostu statik sayfalar ve
entegrasyona hazır servis katmanlarıyla kurulmuş bir Next.js 16 platformu.

Mimari kararlar ve diyagramlar: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

## Neler var?

| Alan                    | İçerik                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scroll sahneleri**    | Ana sayfa saat vitrini (yelkovan döner, 8 katman 3D ayrılır) · ürün sayfalarında dolap kapağı açılışı, arıtma filtre katmanları, kitap ayracı — GSAP + Lenis, 60 FPS |
| **Vitrin (ISR)**        | Statik HTML + etiket bazlı on-demand yenileme · veritabanısız build · sitemap/robots · JSON-LD                                                                       |
| **Sepet & checkout**    | Zustand (misafir: tarayıcıda, üye: sunucuyla senkron) · adres formu · KDV/kargo hesabı · mock 3D Secure · sipariş onay sayfası                                       |
| **Sipariş servisi**     | Atomik stok rezervasyonu · idempotency · ödeme penceresi + otomatik bırakma · iptal/iade · denetim kaydı                                                             |
| **Hesap**               | Kayıt, giriş (rate limit), sipariş geçmişi                                                                                                                           |
| **Yönetim paneli**      | Ürün formu (ölçü, ağırlık, teknik tablo, galeri, stok/fiyat, SEO) · siparişler · vitrin slot editörü · analitik · rol bazlı erişim                                   |
| **Entegrasyon katmanı** | `PaymentService` (mock; İyzico/PayTR/Stripe iskeleti) · `track()` → GTM/GA4 + Meta Pixel · KVKK çerez onayı (Consent Mode v2)                                        |
| **Kalite**              | 48 birim + eşzamanlılık entegrasyon testleri · GitHub Actions CI · Docker (standalone)                                                                               |

## Teknoloji yığını

| Katman    | Teknoloji                                                          |
| --------- | ------------------------------------------------------------------ |
| Framework | Next.js 16.3 (App Router, Turbopack) · React 19.2 · TypeScript 5.9 |
| Stil & UI | Tailwind CSS 4.3 · shadcn/ui (new-york) · Lucide                   |
| Animasyon | GSAP 3.15 + ScrollTrigger + SplitText · Lenis 1.3                  |
| Veri      | PostgreSQL 16 · Prisma ORM 7.10 (`@prisma/adapter-pg`)             |
| Durum     | Zustand 5 (localStorage persist + sunucu senkronu)                 |
| Kimlik    | Auth.js v5 (NextAuth 5 beta) · JWT · Credentials · rol tabanlı     |
| Doğrulama | Zod 4                                                              |
| Görsel    | next/image (AVIF/WebP) · sharp (yükleme normalize + LQIP)          |
| Test      | Vitest 5                                                           |

---

## Kurulum (adım adım)

### 0. Gereksinimler

| Araç           | Sürüm                                 | Kontrol                  |
| -------------- | ------------------------------------- | ------------------------ |
| Node.js        | **20.19+** veya **22 LTS** (önerilen) | `node -v`                |
| npm            | 10+                                   | `npm -v`                 |
| Docker Desktop | güncel (PostgreSQL için)              | `docker compose version` |
| Git            | herhangi                              | `git --version`          |

> Docker kullanmak istemiyorsanız makinenizdeki PostgreSQL 14+ ile de çalışır — bkz.
> [Docker olmadan](#docker-olmadan-yerel-postgresql).

### 1. Depoyu alın ve bağımlılıkları kurun

```bash
git clone https://github.com/akdenizahmet242-del/T-Web-Site.git
cd T-Web-Site
npm install
```

`npm install` bitince `postinstall` adımı Prisma Client'ı `src/generated/prisma` altına
otomatik üretir (`✔ Generated Prisma Client` satırını görmelisiniz).

### 2. Ortam değişkenlerini oluşturun

```bash
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

`AUTH_SECRET` için rastgele bir değer üretip `.env` içindeki satıra yapıştırın:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Diğer değerler yerel geliştirme için hazırdır; değiştirmeniz gerekmez.

### 3. Veritabanını başlatın

```bash
npm run db:up
```

PostgreSQL 16 konteyneri **5433** portunda açılır (makinenizde 5432'de çalışan başka bir
PostgreSQL ile çakışmasın diye). Hazır olduğunu doğrulayın — `STATUS` sütununda
`(healthy)` görünmeli (ilk açılışta ~5 sn):

```bash
docker compose ps
```

### 4. Tabloları oluşturun ve örnek veriyi yükleyin

```bash
npm run db:deploy   # migration'ları uygular
npm run db:seed     # kategoriler, ürünler, vitrinler, hesaplar, 140 demo sipariş
```

Seed çıktısı `✅ Seed tamamlandı.` ile bitmelidir. Tekrar çalıştırılabilir; panelden
yaptığınız düzenlemeleri ezmez. Demo siparişleri istemiyorsanız `SEED_DEMO_ORDERS=false`.

### 5. Geliştirme sunucusunu çalıştırın

```bash
npm run dev
```

| Adres                                                  | Ne var?                                  |
| ------------------------------------------------------ | ---------------------------------------- |
| http://localhost:3000                                  | Ana sayfa · aşağı kaydırın: saat vitrini |
| http://localhost:3000/urun/hilton-80-lake-banyo-dolabi | Ürün sayfası + dolap kapağı sahnesi      |
| http://localhost:3000/urun/pura-5-asamali-su-aritma    | Ürün sayfası + filtre katmanları sahnesi |
| http://localhost:3000/urun/folio-pirinc-kitap-ayraci   | Ürün sayfası + kitap ayracı sahnesi      |
| http://localhost:3000/odeme                            | Checkout (sepete ürün ekledikten sonra)  |
| http://localhost:3000/admin                            | Yönetim paneli                           |

**Demo hesaplar** (seed ile oluşur — canlıya çıkmadan değiştirin):

| Rol      | E-posta             | Şifre         | Erişim                                   |
| -------- | ------------------- | ------------- | ---------------------------------------- |
| Yönetici | `admin@tws.local`   | `Admin123!`   | Panelin tamamı                           |
| Editör   | `editor@tws.local`  | `Editor123!`  | Ürünler ve vitrin (sipariş/analitik yok) |
| Müşteri  | `musteri@tws.local` | `Musteri123!` | `/hesap` sipariş geçmişi                 |

### 6. Production derlemesi (isteğe bağlı)

```bash
npm run build
npm start          # http://localhost:3000
```

Build çıktısında `/` için `Revalidate 10m`, ürün ve kategori sayfaları için `● (SSG)`
görmelisiniz.

### Kontrol listesi

```bash
npm run check              # ESLint + TypeScript + Prettier + birim testleri
npm run test:integration   # gerçek veritabanında stok yarışı, idempotency, rezervasyon
```

---

## Ödeme akışını test etmek

Ödeme sağlayıcısı varsayılan olarak `mock`'tur; gerçek kart bilgisi istenmez.

1. Ürün sayfasında **Sepete ekle** → sepette **Ödemeye geç**.
2. Formu doldurun → **Güvenli ödeme (3D Secure)** → test POS sayfası açılır.
3. **Ödemeyi onayla** → sipariş onay sayfası (Purchase olayı, sepet temizlenir).
   **Reddet** → "Ödeme tamamlanmadı" + **Ödemeyi tekrar dene**.
4. Kuruş kısmı **13** olan tutarlarda (ör. 100,13 TL) banka "onay"da da reddeder.

Ödenmeyen siparişlerin stoğu 30 dk rezerve kalır. Süresi dolanları bırakmak için panelde
**Siparişler → Süresi dolan rezervasyonları bırak** ya da üretimde 5 dakikada bir:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://alanadiniz.com/api/cron/release-orders
```

## Yönetim paneli

| Bölüm           | Ne yapılır?                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ürünler         | Ekle/düzenle: fiyat (KDV dahil, "4.890,00" yazılabilir), stok, en/boy/derinlik, ağırlık, paket ölçüleri, teknik tablo, kutu içeriği, galeri (sürükle-bırak), SEO |
| Siparişler      | Durum sekmeleri, arama, detay; Hazırlanıyor → Kargoda (takip no) → Teslim edildi; iptal ve iade                                                                  |
| Vitrin & Banner | Her sahnenin metinleri, yayın tarihleri ve **katman slotları**: oranı uyan görsel yüklenince animasyon o görselle çalışır                                        |
| Analitik        | 7/30/90 gün: tahsilat, ödenen sipariş, ortalama sepet, ödeme başarı oranı, günlük grafik, en çok satanlar                                                        |

Kaydettiğiniz değişiklik vitrinde arka planda yenilenir (stale-while-revalidate): ilk
ziyaretçi eski sayfayı anında görür, sonraki istekler yeni hali alır.

---

## Docker olmadan (yerel PostgreSQL)

```bash
# psql ile (kullanıcı adı/şifreyi dilediğiniz gibi seçin)
psql -U postgres -c "CREATE USER tws WITH PASSWORD 'tws_dev_password' CREATEDB;"
psql -U postgres -c "CREATE DATABASE tws OWNER tws;"
```

`.env` içinde portu **5432** yapın:

```
DATABASE_URL="postgresql://tws:tws_dev_password@localhost:5432/tws?schema=public"
```

Ardından 4. adımdan devam edin.

## Docker ile üretim benzeri çalıştırma

Uygulama, migration ve PostgreSQL'i birlikte ayağa kaldırır (Next.js standalone imajı):

```bash
docker compose --profile app up --build
```

`AUTH_SECRET` `.env`'den okunur. `.env` dosyası imaja kopyalanmaz (`.dockerignore`);
değişkenler compose üzerinden verilir. Yüklenen görseller `tws-storage` volume'unda kalır.

## Komutlar

| Komut                       | Açıklama                                                     |
| --------------------------- | ------------------------------------------------------------ |
| `npm run dev`               | Geliştirme sunucusu (Turbopack)                              |
| `npm run build`             | Production derlemesi                                         |
| `npm start`                 | Derlenmiş uygulamayı çalıştırır                              |
| `npm run check`             | Lint + tip + format kontrolü + birim testleri                |
| `npm test`                  | Birim testleri                                               |
| `npm run test:integration`  | Veritabanı entegrasyon testleri (DATABASE_URL gerekir)       |
| `npm run format`            | Prettier ile biçimlendirir (Tailwind sınıf sıralaması dahil) |
| `npm run db:up` / `db:down` | PostgreSQL konteynerini başlatır / durdurur                  |
| `npm run db:deploy`         | Mevcut migration'ları uygular (kurulum ve CI için)           |
| `npm run db:migrate`        | Şemayı değiştirdikten sonra yeni migration üretir            |
| `npm run db:seed`           | Örnek veriyi yükler                                          |
| `npm run db:reset`          | ⚠ Veritabanını siler, migration'ları baştan uygular          |
| `npm run db:studio`         | Prisma Studio (tarayıcıda veri gezgini)                      |
| `npm run db:generate`       | Prisma Client'ı yeniden üretir                               |

> Prisma 7 notu: `migrate dev` artık `generate` ve `seed`'i kendiliğinden çalıştırmaz. Şemayı
> değiştirdiğinizde: `npm run db:migrate -- --name aciklama` → `npm run db:generate`.

## Sorun giderme

| Belirti                                                | Çözüm                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `P1001: Can't reach database server at localhost:5433` | `docker compose ps` ile konteynerin `healthy` olduğunu kontrol edin; Docker Desktop açık olmalı.                                     |
| `port is already allocated` (db:up)                    | 5433 doluysa `docker-compose.yml` içindeki `"5433:5432"` ve `.env`'deki portu birlikte değiştirin.                                   |
| `DATABASE_URL tanımlı değil`                           | `.env` dosyası proje kökünde değil ya da adı yanlış (`.env.txt` olmamalı).                                                           |
| `Cannot find module '@/generated/prisma/client'`       | `npm run db:generate`                                                                                                                |
| `[auth][error] MissingSecret`                          | `.env` içinde `AUTH_SECRET` boş — 2. adımdaki komutla üretin.                                                                        |
| Ödeme sonrası `localhost:3000`'e bağlanamıyor          | POS dönüş adresi `NEXT_PUBLIC_SITE_URL`'den gelir; uygulamayı başka portta çalıştırıyorsanız bu değeri güncelleyip yeniden derleyin. |
| Build'de `Failed to fetch font`                        | Fontlar build sırasında Google Fonts'tan indirilip kendi sunucunuzdan servis edilir; internet erişimi gerekir.                       |
| Build'de `⚠ [build] … veritabanına ulaşamadı`          | Hata değil: DB'siz build (CI) desteklenir, sayfalar ilk istekte gerçek veriyle üretilir.                                             |
| Ana sayfada değişiklik görünmüyor (production)         | ISR önbelleği — en geç 10 dk ya da `POST /api/revalidate` (bkz. aşağısı). `npm run dev`'de önbellek yoktur.                          |
| Yüklenen görsel kayboldu                               | Yerel sürücü dosyaları `./storage`'a yazar; bu klasör silinmemeli (git'e girmez). Üretimde S3/R2 kullanın.                           |
| `npm audit` uyarıları                                  | Yalnızca geliştirme araçlarının (Prisma CLI, ESLint) alt bağımlılıklarında; uygulama çalışma zamanını etkilemez.                     |

## On-demand ISR (harici sistemler için)

Ürün/stok başka bir sistemden (ERP, PIM) güncellendiğinde ilgili sayfaları anında yenileyin:

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tags":["product:meridyen-ceviz-duvar-saati"]}'
```

Etiketler: `catalog`, `products`, `product:<slug>`, `categories`, `category:<slug>`, `showcase`.
İlk istek eski sayfayı anında döner ve arka planda yeniler (stale-while-revalidate).

## Scroll sahneleri nasıl çalışır?

Her sahne bir **şablon** (`ShowcaseTemplate`) ve onun sabit **slotlarından** oluşur.
Animasyon slotlara bağlıdır; panelden yüklenen görsel yalnızca slotun içini değiştirir.

| Şablon           | Nerede               | Hareket                                                                |
| ---------------- | -------------------- | ---------------------------------------------------------------------- |
| `CLOCK_EXPLODED` | Ana sayfa · Meridyen | Yelkovan tam tur, dişliler oranlı döner, 8 katman 3D ayrılır, birleşir |
| `CABINET_REVEAL` | Hilton 80            | Kapaklar menteşe ekseninde açılır, LED yanar, raflar öne kayar         |
| `LAYER_STACK`    | Pura arıtma          | Gövde kalkar, kartuşlar dizilir, damla bulanıktan berraka geçer        |
| `BOOKMARK_FLIP`  | Folio ayraç          | Ayraç sayfa arasından süzülür, püskül salınır, sayfa çevrilir          |

Ürün sayfası sahnesi ürün formundaki **Ürün sayfası sahnesi** alanından seçilir; metin ve
görselleri `product:<slug>` anahtarlı vitrin kaydından gelir. `prefers-reduced-motion`
açıksa pin ve animasyon devre dışı kalır, adımlar statik listelenir.

## Proje yapısı

Ayrıntılı açıklama: [docs/ARCHITECTURE.md → Klasör yapısı](docs/ARCHITECTURE.md#12-klasör-yapısı)

```
src/app/          rotalar: (storefront) · (auth) · admin · api · media · mock-pos
src/features/     alan modülleri: showcase · catalog · cart · checkout · orders · auth · admin · consent · home
src/services/     payment (PaymentService + mock) · analytics (track + GTM/Meta) · storage (yerel/S3)
src/components/   ui (shadcn) · layout · providers (Lenis)
src/lib/          db · cache · gsap · money · slug · ids · rate-limit · utils
prisma/           schema.prisma · migrations · seed.ts
tests/            unit · integration
```
