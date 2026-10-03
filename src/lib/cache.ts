import "server-only";

/**
 * ISR / Data Cache sözlüğü.
 *
 * Sayfalar CDN'de statik HTML olarak durur; veriler `unstable_cache` ile etiketlenir.
 * Panelde bir ürün güncellendiğinde yalnızca ilgili etiketler geçersiz kılınır:
 *
 *   revalidateTag(CacheTags.product(slug), "max")   // stale-while-revalidate
 */
export const CacheTags = {
  catalog: "catalog",
  categories: "categories",
  products: "products",
  product: (slug: string) => `product:${slug}`,
  category: (slug: string) => `category:${slug}`,
  showcase: "showcase",
} as const;

/** Saniye cinsinden zaman tabanlı yeniden doğrulama süreleri (on-demand'e ek güvenlik ağı). */
export const RevalidateSeconds = {
  catalog: 3600,
  showcase: 900,
} as const;

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

/**
 * `next build` sırasında veritabanı erişilemezse (ör. CI) sayfayı boş veriyle
 * üretip build'i kırmaz; ISR ilk istekte gerçek veriyle yeniden üretir.
 *
 * Çalışma zamanında hata *yutulmaz*: ISR, yenileme başarısız olursa eski
 * (sağlam) sayfayı sunmaya devam eder — bozuk bir sayfayı önbelleğe yazmayız.
 */
export async function withBuildFallback<T>(
  label: string,
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isProductionBuild) throw error;
    const reason = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.warn(`⚠ [build] "${label}" veritabanına ulaşamadı → boş veriyle devam (${reason})`);
    return fallback;
  }
}
