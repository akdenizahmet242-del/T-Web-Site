/**
 * Geliştirme verisi. Tekrar tekrar çalıştırılabilir (idempotent — upsert).
 *
 *   npm run db:seed
 */
import "dotenv/config";

import { randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import {
  OrderEventType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  PrismaClient,
  type Prisma,
  ProductStatus,
  Role,
  ShowcaseTemplate,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL tanımlı değil (.env dosyasını kontrol edin).");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type Spec = { group: string; label: string; value: string; unit?: string };

type SeedProduct = {
  slug: string;
  sku: string;
  name: string;
  tagline: string;
  description: string;
  brand: string;
  priceMinor: number;
  compareAtPriceMinor?: number;
  stock: number;
  isFeatured?: boolean;
  showcaseTemplate?: ShowcaseTemplate;
  detail: Omit<Prisma.ProductDetailCreateWithoutProductInput, "specs"> & { specs: Spec[] };
};

const categories = [
  {
    slug: "duvar-saatleri",
    name: "Duvar Saatleri",
    description: "Masif ahşap, pirinç ve beton gövdeli, sessiz mekanizmalı tasarım saatler.",
    accentColor: "#c9a36a",
    sortOrder: 1,
  },
  {
    slug: "banyo-dolaplari",
    name: "Hilton Banyo Dolapları",
    description: "Neme dayanıklı lake gövde, yavaşlatıcılı menteşe ve entegre aydınlatma.",
    accentColor: "#9fb3b8",
    sortOrder: 2,
  },
  {
    slug: "su-aritma-tesisat",
    name: "Su Arıtma & Tesisat",
    description: "Çok aşamalı arıtma sistemleri, pirinç bağlantı ve ankastre tesisat çözümleri.",
    accentColor: "#5aa9c9",
    sortOrder: 3,
  },
  {
    slug: "kitap-ayraclari",
    name: "Tasarım Kitap Ayraçları",
    description: "Pirinç, deri ve ceviz — okuma ritüeline eşlik eden küçük nesneler.",
    accentColor: "#c46a4a",
    sortOrder: 4,
  },
] as const;

const productsByCategory: Record<(typeof categories)[number]["slug"], SeedProduct[]> = {
  "duvar-saatleri": [
    {
      slug: "meridyen-ceviz-duvar-saati",
      sku: "TWS-CLK-001",
      name: "Meridyen Ceviz Duvar Saati",
      tagline: "Masif ceviz gövde, sessiz süpürme mekanizma",
      description:
        "Meridyen; tek parça masif ceviz kasası, mat lake kadranı ve el işçiliği pirinç akrep-yelkovanıyla zamanı sessizce ölçer. Süpürme (sweep) mekanizma sayesinde tik-tak sesi yoktur; yatak odası ve çalışma alanları için idealdir.",
      brand: "T-Atelier",
      priceMinor: 489_000,
      compareAtPriceMinor: 549_000,
      stock: 42,
      isFeatured: true,
      showcaseTemplate: ShowcaseTemplate.CLOCK_EXPLODED,
      detail: {
        widthMm: 400,
        heightMm: 400,
        depthMm: 48,
        weightGrams: 1650,
        packageWidthMm: 450,
        packageHeightMm: 450,
        packageDepthMm: 90,
        packageWeightGrams: 2200,
        material: "Masif Amerikan cevizi",
        color: "Ceviz / Pirinç",
        finish: "Doğal yağ",
        origin: "Türkiye",
        warrantyMonths: 24,
        inTheBox: ["Duvar saati", "Montaj vidası ve dübel", "1 adet AA pil"],
        careInstructions: "Nemli bezle silmeyin; yılda bir kez ahşap bakım yağı uygulayın.",
        specs: [
          { group: "Mekanizma", label: "Tip", value: "Sessiz süpürme (sweep) quartz" },
          { group: "Mekanizma", label: "Pil", value: "1 × AA, ~14 ay" },
          { group: "Gövde", label: "Kasa", value: "Tek parça masif ceviz" },
          { group: "Gövde", label: "Cam", value: "Mineral cam, yansıma önleyici" },
          { group: "Gövde", label: "Kadran çapı", value: "340", unit: "mm" },
        ],
      },
    },
    {
      slug: "atlas-minimal-pirinc-saat",
      sku: "TWS-CLK-002",
      name: "Atlas Minimal Pirinç Saat",
      tagline: "Fırçalanmış pirinç çerçeve, rakamsız kadran",
      description:
        "Atlas, ince pirinç çerçevesi ve rakamsız kadranıyla duvarda bir grafik çizgi gibi durur.",
      brand: "T-Atelier",
      priceMinor: 329_000,
      stock: 18,
      isFeatured: true,
      detail: {
        widthMm: 350,
        heightMm: 350,
        depthMm: 35,
        weightGrams: 980,
        material: "Pirinç, alüminyum",
        color: "Fırçalanmış pirinç",
        origin: "Türkiye",
        warrantyMonths: 24,
        inTheBox: ["Duvar saati", "Montaj aparatı"],
        specs: [
          { group: "Mekanizma", label: "Tip", value: "Sessiz süpürme quartz" },
          { group: "Gövde", label: "Çerçeve", value: "Fırçalanmış pirinç" },
        ],
      },
    },
    {
      slug: "nordik-beton-saat",
      sku: "TWS-CLK-003",
      name: "Nordik Beton Saat",
      tagline: "Ham beton doku, siyah çelik ibreler",
      description: "El dökümü beton gövdesiyle her Nordik saat, kendine has bir doku taşır.",
      brand: "T-Atelier",
      priceMinor: 219_000,
      stock: 3,
      detail: {
        widthMm: 300,
        heightMm: 300,
        depthMm: 40,
        weightGrams: 2100,
        material: "Lifli beton",
        color: "Antrasit",
        origin: "Türkiye",
        warrantyMonths: 12,
        specs: [{ group: "Mekanizma", label: "Tip", value: "Quartz (tik-tak)" }],
      },
    },
  ],
  "banyo-dolaplari": [
    {
      slug: "hilton-80-lake-banyo-dolabi",
      sku: "TWS-BTH-001",
      name: "Hilton 80 cm Lake Banyo Dolabı",
      tagline: "Yavaşlatıcılı kapak, LED aynalı üst modül",
      description:
        "Hilton 80; suya dayanıklı MDF-lam gövde, yüksek parlaklıkta lake kapaklar ve yavaşlatıcılı Blum menteşelerle uzun ömürlü bir banyo düzeni sunar.",
      brand: "Hilton",
      priceMinor: 1_849_000,
      compareAtPriceMinor: 2_090_000,
      stock: 9,
      isFeatured: true,
      showcaseTemplate: ShowcaseTemplate.CABINET_REVEAL,
      detail: {
        widthMm: 800,
        heightMm: 600,
        depthMm: 460,
        weightGrams: 38_500,
        material: "Suya dayanıklı MDF-lam",
        color: "Mat beyaz",
        finish: "Yüksek parlak lake",
        origin: "Türkiye",
        warrantyMonths: 36,
        inTheBox: ["Alt modül", "Porselen lavabo", "LED ayna", "Montaj seti"],
        specs: [
          { group: "Donanım", label: "Menteşe", value: "Yavaşlatıcılı, 110°" },
          { group: "Donanım", label: "Ray", value: "Tam açılım, frenli" },
          { group: "Aydınlatma", label: "LED", value: "4000K, dokunmatik" },
          { group: "Aydınlatma", label: "Güç", value: "12", unit: "W" },
        ],
      },
    },
    {
      slug: "hilton-100-ceviz-dolap-seti",
      sku: "TWS-BTH-002",
      name: "Hilton 100 cm Ceviz Kaplama Dolap Seti",
      tagline: "Doğal ceviz kaplama, çift çekmece",
      description: "Doğal ceviz kaplama kapaklar ve çift çekmeceli alt modül ile sıcak bir banyo.",
      brand: "Hilton",
      priceMinor: 2_499_000,
      stock: 4,
      detail: {
        widthMm: 1000,
        heightMm: 620,
        depthMm: 480,
        weightGrams: 46_000,
        material: "Ceviz kaplama MDF",
        color: "Ceviz",
        origin: "Türkiye",
        warrantyMonths: 36,
        specs: [{ group: "Donanım", label: "Çekmece", value: "2 adet, frenli" }],
      },
    },
  ],
  "su-aritma-tesisat": [
    {
      slug: "pura-5-asamali-su-aritma",
      sku: "TWS-WTR-001",
      name: "Pura 5 Aşamalı Su Arıtma Sistemi",
      tagline: "Tezgah altı, pompasız, 5 aşamalı filtrasyon",
      description:
        "Pura; sediment, granül karbon, blok karbon, membran ve mineral katmanlarıyla şebeke suyunu içme kalitesine taşır.",
      brand: "Pura",
      priceMinor: 899_000,
      stock: 27,
      isFeatured: true,
      showcaseTemplate: ShowcaseTemplate.LAYER_STACK,
      detail: {
        widthMm: 380,
        heightMm: 420,
        depthMm: 150,
        weightGrams: 6200,
        material: "Gıdaya uygun ABS, paslanmaz çelik",
        origin: "Türkiye",
        warrantyMonths: 24,
        inTheBox: ["Ana ünite", "5 filtre", "Musluk", "Bağlantı seti"],
        specs: [
          { group: "Filtrasyon", label: "Aşama", value: "5" },
          { group: "Filtrasyon", label: "Kapasite", value: "190", unit: "L/gün" },
          { group: "Bağlantı", label: "Giriş", value: '1/2"' },
        ],
      },
    },
    {
      slug: "pirinc-ankastre-ara-musluk-seti",
      sku: "TWS-WTR-002",
      name: "Pirinç Ankastre Ara Musluk Seti",
      tagline: "Krom kaplama, seramik kartuş",
      description: "Seramik kartuşlu pirinç ara musluklar; sızdırmaz ve uzun ömürlü.",
      brand: "Pura",
      priceMinor: 129_000,
      stock: 120,
      detail: {
        weightGrams: 640,
        material: "Pirinç",
        finish: "Krom",
        origin: "Türkiye",
        warrantyMonths: 60,
        specs: [{ group: "Bağlantı", label: "Ölçü", value: '1/2" × 3/8"' }],
      },
    },
  ],
  "kitap-ayraclari": [
    {
      slug: "folio-pirinc-kitap-ayraci",
      sku: "TWS-BKM-001",
      name: "Folio Pirinç Kitap Ayracı",
      tagline: "Lazer kesim pirinç, ipek püskül",
      description: "0,4 mm pirinç levhadan lazer kesim; sayfayı çizmeyen yuvarlatılmış kenarlar.",
      brand: "Folio",
      priceMinor: 34_900,
      stock: 300,
      isFeatured: true,
      showcaseTemplate: ShowcaseTemplate.BOOKMARK_FLIP,
      detail: {
        widthMm: 30,
        heightMm: 120,
        depthMm: 1,
        weightGrams: 9,
        material: "Pirinç, ipek",
        color: "Pirinç / Bordo",
        origin: "Türkiye",
        specs: [{ group: "Malzeme", label: "Kalınlık", value: "0,4", unit: "mm" }],
      },
    },
    {
      slug: "kalem-deri-ayrac-seti",
      sku: "TWS-BKM-002",
      name: "Kalem Deri Ayraç Seti (3'lü)",
      tagline: "Bitkisel tabaklanmış deri",
      description: "Zamanla patine olan bitkisel tabaklanmış deri, el dikişi kenarlar.",
      brand: "Folio",
      priceMinor: 44_900,
      stock: 85,
      detail: {
        widthMm: 35,
        heightMm: 150,
        weightGrams: 15,
        material: "Bitkisel tabaklanmış deri",
        origin: "Türkiye",
        specs: [{ group: "Set", label: "Adet", value: "3" }],
      },
    },
  ],
};

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@tws.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
    create: { email, name: "Mağaza Yöneticisi", role: Role.ADMIN, passwordHash },
  });
  console.log(`  ✓ Yönetici: ${email}`);
}

async function seedCatalog() {
  for (const category of categories) {
    const { id: categoryId } = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { ...category },
      create: { ...category },
    });

    for (const { detail, ...product } of productsByCategory[category.slug]) {
      const detailData = { ...detail, specs: detail.specs as Prisma.InputJsonValue };
      await prisma.product.upsert({
        where: { slug: product.slug },
        // Var olan ürüne dokunma: panelden yapılan düzenlemeler seed ile ezilmesin.
        update: {},
        create: {
          ...product,
          categoryId,
          status: ProductStatus.ACTIVE,
          publishedAt: new Date(),
          detail: { create: detailData },
        },
      });
    }
    console.log(`  ✓ ${category.name}: ${productsByCategory[category.slug].length} ürün`);
  }
}

async function seedShowcase() {
  const product = await prisma.product.findUnique({
    where: { slug: "meridyen-ceviz-duvar-saati" },
    select: { id: true },
  });

  const data = {
    placement: "HOME_SHOWCASE" as const,
    template: ShowcaseTemplate.CLOCK_EXPLODED,
    eyebrow: "Meridyen · Ceviz Duvar Saati",
    title: "Zamanın anatomisi",
    subtitle: "Kaydırın; saat zamanı ileri sarsın, ardından katman katman açılsın.",
    ctaLabel: "Meridyen'i incele",
    ctaHref: "/urun/meridyen-ceviz-duvar-saati",
    productId: product?.id ?? null,
    // Boş `layers` → tüm slotlar koddaki varsayılan SVG katmanlarını kullanır.
    layers: {},
    content: {
      steps: [
        {
          title: "Sessiz bir saat",
          body: "Süpürme mekanizma ibreleri tik-tak olmadan, kesintisiz hareket ettirir.",
        },
        {
          title: "Katman katman",
          body: "Masif ceviz kasa, quartz mekanizma, lake kadran, pirinç ibreler ve mineral cam.",
        },
        {
          title: "Yeniden bir bütün",
          body: "400 mm çap, 48 mm derinlik, 1,65 kg. Duvara iki vidayla, ömür boyu.",
        },
      ],
    },
    theme: { accent: "#c9a36a" },
    sortOrder: 0,
    isActive: true,
  } satisfies Omit<Prisma.ShowcaseBannerUncheckedCreateInput, "key">;

  await prisma.showcaseBanner.upsert({
    where: { key: "home-clock-showcase" },
    update: {}, // panel düzenlemeleri korunur
    create: { key: "home-clock-showcase", ...data },
  });
  console.log("  ✓ Vitrin: home-clock-showcase");
}

async function seedUsers() {
  const users = [
    {
      email: "editor@tws.local",
      name: "Vitrin Editörü",
      role: Role.EDITOR,
      password: "Editor123!",
    },
    {
      email: "musteri@tws.local",
      name: "Ayşe Yılmaz",
      role: Role.CUSTOMER,
      password: "Musteri123!",
    },
  ];
  for (const { password, ...user } of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { role: user.role },
      create: { ...user, passwordHash: await bcrypt.hash(password, 12) },
    });
  }
  console.log(
    "  ✓ Editör: editor@tws.local / Editor123! · Müşteri: musteri@tws.local / Musteri123!",
  );
}

/** Ürün sayfası sahneleri: anahtar `product:<slug>`; içerik ve slotlar panelden düzenlenir. */
async function seedProductScenes() {
  const scenes = [
    {
      slug: "hilton-80-lake-banyo-dolabi",
      template: ShowcaseTemplate.CABINET_REVEAL,
      title: "Kapağın ardındaki düzen",
      eyebrow: "Hilton 80 · Lake banyo dolabı",
      steps: [
        {
          title: "Yavaşlatıcılı kapaklar",
          body: "110° açılan Blum menteşeler, son 3 cm'de kendiliğinden yavaşlar.",
        },
        {
          title: "Her şeyin bir yeri var",
          body: "Ayarlanabilir cam raflar ve tam açılım frenli çekmece.",
        },
        { title: "Neme karşı", body: "Suya dayanıklı MDF-lam gövde, kenarları ABS bantlı." },
      ],
    },
    {
      slug: "pura-5-asamali-su-aritma",
      template: ShowcaseTemplate.LAYER_STACK,
      title: "Beş katmanda saf su",
      eyebrow: "Pura · 5 aşamalı arıtma",
      steps: [
        { title: "Sediment ve karbon", body: "Kum, pas ve klor; ilk iki aşamada tutulur." },
        { title: "Membran", body: "0,0001 mikron gözenek: ağır metaller ve bakteriler geçemez." },
        { title: "Mineral", body: "Son aşama suya kalsiyum ve magnezyumu geri kazandırır." },
      ],
    },
    {
      slug: "folio-pirinc-kitap-ayraci",
      template: ShowcaseTemplate.BOOKMARK_FLIP,
      title: "Kaldığınız sayfa",
      eyebrow: "Folio · Pirinç kitap ayracı",
      steps: [
        { title: "0,4 mm pirinç", body: "Sayfaya iz bırakmayan yuvarlatılmış kenarlar." },
        { title: "İpek püskül", body: "Kitabın dışından bile hangi sayfada olduğunuzu söyler." },
      ],
    },
  ];

  for (const scene of scenes) {
    const product = await prisma.product.findUnique({
      where: { slug: scene.slug },
      select: { id: true },
    });
    const data = {
      placement: "CATEGORY_TOP" as const,
      template: scene.template,
      eyebrow: scene.eyebrow,
      title: scene.title,
      productId: product?.id ?? null,
      content: { steps: scene.steps },
      isActive: true,
    };
    await prisma.showcaseBanner.upsert({
      where: { key: `product:${scene.slug}` },
      update: {},
      create: { key: `product:${scene.slug}`, ...data },
    });
  }
  console.log(`  ✓ Ürün sahneleri: ${scenes.length}`);
}

/** Deterministik sözde-rastgele (mulberry32) → her seed aynı demo veriyi üretir. */
function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Analitik ekranı boş görünmesin diye son 60 güne yayılmış demo siparişler.
 * Stok düşmez; "DEMO-" önekiyle ayırt edilir. Kapatmak için SEED_DEMO_ORDERS=false.
 */
async function seedDemoOrders() {
  if (process.env.SEED_DEMO_ORDERS === "false") return;
  if (await prisma.order.count({ where: { orderNumber: { startsWith: "DEMO-" } } })) {
    console.log("  ✓ Demo siparişler zaten var");
    return;
  }

  const rand = random(20261003);
  const products = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    select: { id: true, name: true, sku: true, priceMinor: true, vatRate: true },
  });
  const customer = await prisma.user.findUnique({
    where: { email: "musteri@tws.local" },
    select: { id: true },
  });
  const cities = [
    ["İstanbul", "Kadıköy"],
    ["Ankara", "Çankaya"],
    ["İzmir", "Karşıyaka"],
    ["Bursa", "Nilüfer"],
    ["Antalya", "Muratpaşa"],
  ];
  const names = [
    "Elif Kaya",
    "Mehmet Demir",
    "Zeynep Şahin",
    "Can Öztürk",
    "Deniz Arslan",
    "Ayşe Yılmaz",
  ];

  const now = Date.now();
  let created = 0;
  for (let i = 0; i < 140; i += 1) {
    const daysAgo = Math.floor(rand() ** 1.4 * 60);
    const placedAt = new Date(now - daysAgo * 86_400_000 - Math.floor(rand() * 20) * 3_600_000);
    const lines = Array.from({ length: 1 + Math.floor(rand() * 2.2) }, () => {
      const product = products[Math.floor(rand() * products.length)];
      return { product, quantity: 1 + Math.floor(rand() * 1.6) };
    }).filter(
      (line, index, all) => all.findIndex((l) => l.product.id === line.product.id) === index,
    );

    const subtotal = lines.reduce((sum, line) => sum + line.product.priceMinor * line.quantity, 0);
    const shipping = subtotal >= 150_000 ? 0 : 14_990;
    const tax = lines.reduce(
      (sum, line) =>
        sum +
        Math.round(
          (line.product.priceMinor * line.quantity * line.product.vatRate) /
            (100 + line.product.vatRate),
        ),
      Math.round((shipping * 20) / 120),
    );

    const roll = rand();
    const paid = roll > 0.12;
    const status: OrderStatus = !paid
      ? OrderStatus.CANCELLED
      : daysAgo > 7
        ? OrderStatus.DELIVERED
        : daysAgo > 3
          ? OrderStatus.SHIPPED
          : daysAgo > 1
            ? OrderStatus.PROCESSING
            : OrderStatus.PAID;
    const paidAt = paid ? new Date(placedAt.getTime() + 4 * 60_000) : null;
    const [city, district] = cities[Math.floor(rand() * cities.length)];
    const fullName = names[Math.floor(rand() * names.length)];
    const failedFirst = paid && rand() < 0.15;

    await prisma.order.create({
      data: {
        orderNumber: `DEMO-${String(i + 1).padStart(4, "0")}`,
        accessToken: randomBytes(24).toString("base64url"),
        userId: fullName === "Ayşe Yılmaz" ? (customer?.id ?? null) : null,
        email: `${fullName.split(" ")[0].toLowerCase().replace("ş", "s").replace("ö", "o")}@example.com`,
        phone: "05321234567",
        status,
        paymentStatus: paid ? PaymentStatus.CAPTURED : PaymentStatus.FAILED,
        paymentProvider: PaymentProvider.MOCK,
        paymentReference: `mock_demo_${i}`,
        subtotalMinor: subtotal,
        shippingMinor: shipping,
        taxMinor: tax,
        totalMinor: subtotal + shipping,
        shippingAddress: {
          fullName,
          line1: "Örnek Mah. Demo Sok. No: 1",
          district,
          city,
          country: "TR",
        },
        carrier:
          status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED
            ? "Yurtiçi Kargo"
            : null,
        trackingNumber:
          status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED
            ? `YK${100000 + i}`
            : null,
        placedAt,
        paidAt,
        shippedAt:
          status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED
            ? new Date(placedAt.getTime() + 86_400_000)
            : null,
        deliveredAt:
          status === OrderStatus.DELIVERED ? new Date(placedAt.getTime() + 3 * 86_400_000) : null,
        cancelledAt: paid ? null : new Date(placedAt.getTime() + 30 * 60_000),
        createdAt: placedAt,
        items: {
          create: lines.map(({ product, quantity }) => ({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            unitPriceMinor: product.priceMinor,
            vatRate: product.vatRate,
            quantity,
            lineTotalMinor: product.priceMinor * quantity,
          })),
        },
        events: {
          create: [
            {
              type: OrderEventType.CREATED,
              message: "Sipariş oluşturuldu (demo).",
              createdAt: placedAt,
            },
            ...(failedFirst || !paid
              ? [
                  {
                    type: OrderEventType.PAYMENT_FAILED,
                    message: "Banka işlemi reddetti (demo).",
                    createdAt: new Date(placedAt.getTime() + 2 * 60_000),
                  },
                ]
              : []),
            ...(paid
              ? [
                  {
                    type: OrderEventType.PAYMENT_SUCCEEDED,
                    message: "Ödeme tahsil edildi (demo).",
                    createdAt: paidAt!,
                  },
                ]
              : [
                  {
                    type: OrderEventType.STATUS_CHANGED,
                    message: "Ödeme süresi doldu (demo).",
                    createdAt: new Date(placedAt.getTime() + 30 * 60_000),
                  },
                ]),
          ],
        },
      },
    });
    created += 1;
  }
  console.log(`  ✓ Demo siparişler: ${created}`);
}

async function main() {
  console.log("🌱 Seed başlıyor…");
  await seedAdmin();
  await seedUsers();
  await seedCatalog();
  await seedShowcase();
  await seedProductScenes();
  await seedDemoOrders();
  console.log("✅ Seed tamamlandı.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
