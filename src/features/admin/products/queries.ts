import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ProductStatus } from "@/generated/prisma/enums";
import { specsSchema } from "@/features/catalog/types";
import { db } from "@/lib/db";

import type { ProductFormInput } from "./schema";

export const PAGE_SIZE = 20;

export type ProductListFilters = { q?: string; status?: string; category?: string; page?: number };

export async function listProducts({ q, status, category, page = 1 }: ProductListFilters) {
  const where: Prisma.ProductWhereInput = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(status &&
      Object.values(ProductStatus).includes(status as ProductStatus) && {
        status: status as ProductStatus,
      }),
    ...(category && { category: { slug: category } }),
  };

  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        name: true,
        sku: true,
        status: true,
        priceMinor: true,
        currency: true,
        stock: true,
        lowStockThreshold: true,
        isFeatured: true,
        category: { select: { name: true, slug: true, accentColor: true } },
        images: {
          where: { kind: "GALLERY" },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true, alt: true, width: true, height: true, blurDataUrl: true },
        },
      },
    }),
  ]);

  return { total, rows, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function getCategoryOptions() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });
}

/** Düzenleme formu için ürün → form değerleri. */
export async function getProductFormValues(id: string): Promise<ProductFormInput | null> {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      detail: true,
      images: { where: { kind: "GALLERY" }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) return null;

  const d = product.detail;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
    categoryId: product.categoryId,
    status: product.status,
    isFeatured: product.isFeatured,
    showcaseTemplate: product.showcaseTemplate,
    tagline: product.tagline,
    description: product.description,
    priceMinor: product.priceMinor,
    compareAtPriceMinor: product.compareAtPriceMinor,
    vatRate: product.vatRate,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    detail: {
      widthMm: d?.widthMm ?? null,
      heightMm: d?.heightMm ?? null,
      depthMm: d?.depthMm ?? null,
      weightGrams: d?.weightGrams ?? null,
      packageWidthMm: d?.packageWidthMm ?? null,
      packageHeightMm: d?.packageHeightMm ?? null,
      packageDepthMm: d?.packageDepthMm ?? null,
      packageWeightGrams: d?.packageWeightGrams ?? null,
      material: d?.material ?? null,
      color: d?.color ?? null,
      finish: d?.finish ?? null,
      origin: d?.origin ?? null,
      warrantyMonths: d?.warrantyMonths ?? null,
      careInstructions: d?.careInstructions ?? null,
      inTheBox: d?.inTheBox ?? [],
      specs: specsSchema.parse(d?.specs ?? []),
    },
    images: product.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      width: image.width,
      height: image.height,
      blurDataUrl: image.blurDataUrl,
    })),
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
  };
}
