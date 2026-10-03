# T Atelier — Tasarım Odaklı E-Ticaret Platformu

Duvar saatleri, Hilton banyo dolapları, su arıtma & tesisat ürünleri ve tasarım kitap
ayraçları için; scroll ile canlanan ürün sahneleri, CDN dostu statik sayfalar ve
entegrasyona hazır servis katmanlarıyla kurulmuş bir Next.js 16 platformu.

> **Faz 1 kapsamı:** klasör yapısı ve mimari · Prisma şeması · scroll-driven saat vitrini ·
> sepet (Zustand + sunucu senkronu) · Auth.js ile rol korumalı panel iskeleti ·
> `PaymentService` (mock) ve merkezi izleme (`track()`) altyapısı.
> Mimari kararlar ve diyagramlar: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

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
npm run db:seed     # 4 kategori, 9 ürün, vitrin kaydı, yönetici hesabı
```

Seed çıktısı `✅ Seed tamamlandı.` ile bitmelidir. Komut tekrar çalıştırılabilir
(idempotent).

### 5. Geliştirme sunucusunu çalıştırın

```bash
npm run dev
```

| Adres                                                 | Ne var?                                        |
| ----------------------------------------------------- | ---------------------------------------------- |
| http://localhost:3000                                 | Ana sayfa · aşağı kaydırın: saat vitrini       |
| http://localhost:3000/urun/meridyen-ceviz-duvar-saati | Ürün detayı, teknik tablo, sepete ekleme       |
| http://localhost:3000/admin                           | Panel → giriş: `admin@tws.local` / `Admin123!` |

> Yönetici bilgileri `.env` içindeki `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`'dan gelir.
> Canlıya çıkmadan önce mutlaka değiştirin.

### 6. Production derlemesi (isteğe bağlı)

```bash
npm run build
npm start          # http://localhost:3000
```

Build çıktısında `/` için `Revalidate 10m`, ürün ve kategori sayfaları için `● (SSG)`
görmelisiniz.

### Kontrol listesi

```bash
npm run check      # ESLint + TypeScript + Prettier — üçü de hatasız geçmeli
```

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

## Komutlar

| Komut                       | Açıklama                                                     |
| --------------------------- | ------------------------------------------------------------ |
| `npm run dev`               | Geliştirme sunucusu (Turbopack)                              |
| `npm run build`             | Production derlemesi                                         |
| `npm start`                 | Derlenmiş uygulamayı çalıştırır                              |
| `npm run check`             | Lint + tip kontrolü + format kontrolü                        |
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

| Belirti                                                | Çözüm                                                                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `P1001: Can't reach database server at localhost:5433` | `docker compose ps` ile konteynerin `healthy` olduğunu kontrol edin; Docker Desktop açık olmalı.                 |
| `port is already allocated` (db:up)                    | 5433 doluysa `docker-compose.yml` içindeki `"5433:5432"` ve `.env`'deki portu birlikte değiştirin.               |
| `DATABASE_URL tanımlı değil`                           | `.env` dosyası proje kökünde değil ya da adı yanlış (`.env.txt` olmamalı).                                       |
| `Cannot find module '@/generated/prisma/client'`       | `npm run db:generate`                                                                                            |
| `[auth][error] MissingSecret`                          | `.env` içinde `AUTH_SECRET` boş — 2. adımdaki komutla üretin.                                                    |
| Build'de `Failed to fetch font`                        | Fontlar build sırasında Google Fonts'tan indirilip kendi sunucunuzdan servis edilir; internet erişimi gerekir.   |
| Build'de `⚠ [build] … veritabanına ulaşamadı`          | Hata değil: DB'siz build (CI) desteklenir, sayfalar ilk istekte gerçek veriyle üretilir.                         |
| Ana sayfada değişiklik görünmüyor (production)         | ISR önbelleği — en geç 10 dk ya da `POST /api/revalidate` (bkz. aşağısı). `npm run dev`'de önbellek yoktur.      |
| `npm audit` uyarıları                                  | Yalnızca geliştirme araçlarının (Prisma CLI, ESLint) alt bağımlılıklarında; uygulama çalışma zamanını etkilemez. |

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

## Saat vitrini nasıl çalışır?

`src/features/showcase/clock/` — sahne 8 bağımsız katmandan oluşur (kasa, mekanizma,
kadran, akrep, yelkovan, saniye, cam, çerçeve). Sayfa kaydırıldıkça pinlenmiş bölümde:

1. **Zaman** — yelkovan tam tur atar, akrep 30° ilerler, dişliler diş oranlarıyla döner
   (göstergede 10:10 → 11:10). Saniye ibresi scroll'dan bağımsız, gerçek zamanlı süpürür.
2. **Anatomi** — sahne 3D eğilir, katmanlar z ekseninde ayrılır, etiketler sırayla belirir.
3. **Bütün** — katmanlar yeniden birleşir.

Panelden bir katmana görsel atanırsa (`ShowcaseBanner.layers`) o slotun içi değişir;
animasyon zinciri aynı kalır. `prefers-reduced-motion` açıksa pin ve animasyon devre dışı
kalır, tüm adımlar statik listelenir.

## Proje yapısı

Ayrıntılı açıklama: [docs/ARCHITECTURE.md → Klasör yapısı](docs/ARCHITECTURE.md#10-klasör-yapısı)

```
src/app/          rotalar: (storefront) · (auth) · admin · api
src/features/     alan modülleri: showcase · catalog · cart · auth · admin · home · checkout
src/services/     payment (PaymentService + mock) · analytics (track + GTM/Meta)
src/components/   ui (shadcn) · layout · providers (Lenis)
src/lib/          db · cache · gsap · money · utils
prisma/           schema.prisma · migrations · seed.ts
```
