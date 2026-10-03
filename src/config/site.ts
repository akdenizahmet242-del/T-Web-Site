export const siteConfig = {
  name: "T Atelier",
  tagline: "Biçim, işlev ve zaman",
  description:
    "Tasarım duvar saatleri, Hilton banyo dolapları, su arıtma & tesisat çözümleri ve kitap ayraçları.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "tr_TR",
  currency: "TRY",
} as const;
