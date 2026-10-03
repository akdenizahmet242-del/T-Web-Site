import "server-only";

import { unstable_cache } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { ProductStatus } from "@/generated/prisma/enums";
import { CacheTags, RevalidateSeconds, withBuildFallback } from "@/lib/cache";
import { db } from "@/lib/db";

import {
  specsSchema,
  type CategoryDTO,
  type ImageDTO,
  type ProductCardDTO,
  type ProductDetailDTO,
} from "./types";

// -----------------------------------------------------------------------------
//  Ortak select'ler & eşleyiciler
// -----------------------------------------------------------------------------

const imageSelect = {
  url: true,
  alt: true,
  width: true,
  height: true,
  blurDataUrl: true,
} satisfies Prisma.ProductImageSelect;

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  priceMinor: true,
  compareAtPriceMinor: true,
  currency: true,
  stock: true,
  category: { select: { slug: true, name: true, accentColor: true } },
  images: {
    where: { kind: "GALLERY" },
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: imageSelect,
  },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard({ images, ...row }: CardRow): ProductCardDTO {
  return { ...row, image: (images[0] as ImageDTO | undefined) ?? null };
}

const activeProduct = { status: ProductStatus.ACTIVE } satisfies Prisma.ProductWhereInput;

// -----------------------------------------------------------------------------
//  Sorgular — hepsi Data Cache'te etiketli olarak tutulur
// -----------------------------------------------------------------------------

export function getCategories(): Promise<CategoryDTO[]> {
  return withBuildFallback(
    "getCategories",
    unstable_cache(
      async () => {
        const rows = await db.category.findMany({
          where: { isActive: true, parentId: null },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            accentColor: true,
            _count: { select: { products: { where: activeProduct } } },
          },
        });
        return rows.map(({ _count, ...category }) => ({
          ...category,
          productCount: _count.products,
        }));
      },
      ["catalog", "categories"],
      { tags: [CacheTags.catalog, CacheTags.categories], revalidate: RevalidateSeconds.catalog },
    ),
    [],
  );
}

export function getFeaturedProducts(limit = 8): Promise<ProductCardDTO[]> {
  return withBuildFallback(
    "getFeaturedProducts",
    unstable_cache(
      async () => {
        const rows = await db.product.findMany({
          where: { ...activeProduct, isFeatured: true },
          orderBy: [{ category: { sortOrder: "asc" } }, { publishedAt: "desc" }],
          take: limit,
          select: cardSelect,
        });
        return rows.map(toCard);
      },
      ["catalog", "featured", String(limit)],
      { tags: [CacheTags.catalog, CacheTags.products], revalidate: RevalidateSeconds.catalog },
    ),
    [],
  );
}

export function getProductBySlug(slug: string): Promise<ProductDetailDTO | null> {
  return withBuildFallback(
    `getProductBySlug(${slug})`,
    unstable_cache(
      async () => {
        const row = await db.product.findFirst({
          where: { ...activeProduct, slug },
          select: {
            ...cardSelect,
            sku: true,
            brand: true,
            description: true,
            vatRate: true,
            lowStockThreshold: true,
            showcaseTemplate: true,
            seoTitle: true,
            seoDescription: true,
            images: {
              where: { kind: "GALLERY" },
              orderBy: { sortOrder: "asc" },
              select: imageSelect,
            },
            detail: {
              select: {
                widthMm: true,
                heightMm: true,
                depthMm: true,
                weightGrams: true,
                material: true,
                color: true,
                finish: true,
                origin: true,
                warrantyMonths: true,
                inTheBox: true,
                careInstructions: true,
                specs: true,
              },
            },
          },
        });
        if (!row) return null;

        const { images, detail, ...product } = row;
        return {
          ...product,
          image: images[0] ?? null,
          gallery: images,
          detail: detail ? { ...detail, specs: specsSchema.parse(detail.specs) } : null,
        } satisfies ProductDetailDTO;
      },
      ["catalog", "product", slug],
      {
        tags: [CacheTags.catalog, CacheTags.products, CacheTags.product(slug)],
        revalidate: RevalidateSeconds.catalog,
      },
    ),
    null,
  );
}

export function getCategoryWithProducts(slug: string) {
  return withBuildFallback(
    `getCategoryWithProducts(${slug})`,
    unstable_cache(
      async () => {
        const category = await db.category.findFirst({
          where: { slug, isActive: true },
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            accentColor: true,
            seoTitle: true,
            seoDescription: true,
            products: {
              where: activeProduct,
              orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
              select: cardSelect,
            },
          },
        });
        if (!category) return null;
        const { products, ...rest } = category;
        return { ...rest, products: products.map(toCard) };
      },
      ["catalog", "category", slug],
      {
        tags: [CacheTags.catalog, CacheTags.categories, CacheTags.category(slug)],
        revalidate: RevalidateSeconds.catalog,
      },
    ),
    null,
  );
}

/** Build anında önceden derlenecek ürünler (en çok satan/öne çıkan ilk N). */
export function getPrerenderProductSlugs(limit = 200) {
  return withBuildFallback(
    "getPrerenderProductSlugs",
    () =>
      db.product.findMany({
        where: activeProduct,
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        take: limit,
        select: { slug: true },
      }),
    [],
  );
}

export function getPrerenderCategorySlugs() {
  return withBuildFallback(
    "getPrerenderCategorySlugs",
    () => db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    [],
  );
}
