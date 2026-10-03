import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductCard } from "@/features/catalog/product-card";
import { getCategoryWithProducts, getPrerenderCategorySlugs } from "@/features/catalog/queries";

export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await getPrerenderCategorySlugs();
  return categories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryWithProducts(slug);
  if (!category) return {};
  return {
    title: category.seoTitle ?? category.name,
    description: category.seoDescription ?? category.description ?? undefined,
    alternates: { canonical: `/kategori/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/kategori/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryWithProducts(slug);
  if (!category) notFound();

  return (
    <section className="mx-auto max-w-7xl px-5 pt-32 pb-28 sm:px-8">
      <p className="font-mono text-[11px] tracking-[0.25em] text-brass uppercase">
        {category.products.length} ürün
      </p>
      <h1 className="mt-4 font-display text-6xl sm:text-7xl">{category.name}</h1>
      {category.description ? (
        <p className="mt-5 max-w-xl text-muted-foreground">{category.description}</p>
      ) : null}

      <div className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
        {category.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
