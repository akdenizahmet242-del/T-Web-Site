import { getCategories, getFeaturedProducts } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/product-card";
import { Collections } from "@/features/home/collections";
import { Hero } from "@/features/home/hero";
import { ClockShowcase } from "@/features/showcase/clock/clock-showcase";
import { getShowcase } from "@/features/showcase/queries";

// ISR: sayfa statik üretilir, en geç 10 dakikada bir arka planda tazelenir.
// Panelden yapılan değişiklikler etiket bazlı (revalidateTag) anında düşer.
export const revalidate = 600;

export default async function HomePage() {
  const [showcase, categories, featured] = await Promise.all([
    getShowcase("home-clock-showcase", "CLOCK_EXPLODED"),
    getCategories(),
    getFeaturedProducts(4),
  ]);

  return (
    <>
      <Hero />
      <div id="anatomi">
        <ClockShowcase data={showcase} />
      </div>
      <Collections categories={categories} />

      {featured.length > 0 ? (
        <section aria-labelledby="featured-title" className="mx-auto max-w-7xl px-5 pb-28 sm:px-8">
          <h2 id="featured-title" className="reveal font-display text-5xl sm:text-6xl">
            Öne çıkanlar
          </h2>
          <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
