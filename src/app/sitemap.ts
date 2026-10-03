import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { ProductStatus } from "@/generated/prisma/enums";
import { withBuildFallback } from "@/lib/cache";
import { db } from "@/lib/db";

// Sitemap de ISR: saatte bir arka planda yenilenir.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await withBuildFallback(
    "sitemap",
    () =>
      Promise.all([
        db.product.findMany({
          where: { status: ProductStatus.ACTIVE },
          select: { slug: true, updatedAt: true },
        }),
        db.category.findMany({
          where: { isActive: true },
          select: { slug: true, updatedAt: true },
        }),
      ]),
    [[], []],
  );

  const url = (path: string) => new URL(path, siteConfig.url).toString();

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    ...categories.map((category) => ({
      url: url(`/kategori/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: url(`/urun/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
