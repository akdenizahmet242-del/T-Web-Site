"use server";

import { revalidateTag } from "next/cache";

import { requireStaff } from "@/features/auth/guards";
import { Prisma } from "@/generated/prisma/client";
import { ProductStatus } from "@/generated/prisma/enums";
import { CacheTags } from "@/lib/cache";
import { db } from "@/lib/db";

import { productFormSchema, type ProductFormInput } from "./schema";

export type SaveProductResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function invalidateProducts(slugs: string[]) {
  for (const slug of new Set(slugs)) revalidateTag(CacheTags.product(slug), "max");
  revalidateTag(CacheTags.products, "max");
  revalidateTag(CacheTags.categories, "max"); // kategori kartlarındaki ürün sayısı
}

async function invalidateCategories(categoryIds: string[]) {
  const categories = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: { slug: true },
  });
  for (const { slug } of categories) revalidateTag(CacheTags.category(slug), "max");
}

/**
 * Ürünü (temel bilgiler + teknik detay + galeri) tek transaction'da kaydeder ve
 * yalnızca etkilenen ISR sayfalarını geçersiz kılar (stale-while-revalidate).
 */
export async function saveProductAction(input: ProductFormInput): Promise<SaveProductResult> {
  await requireStaff();

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, error: "Formda düzeltilmesi gereken alanlar var.", fieldErrors };
  }

  const { id, detail, images, ...data } = parsed.data;
  const previous = id
    ? await db.product.findUnique({
        where: { id },
        select: { slug: true, categoryId: true, publishedAt: true },
      })
    : null;
  if (id && !previous) return { ok: false, error: "Ürün bulunamadı." };

  const productData = {
    ...data,
    // İlk kez yayına alındığında yayın tarihi atanır (sıralama + JSON-LD).
    publishedAt:
      data.status === ProductStatus.ACTIVE
        ? (previous?.publishedAt ?? new Date())
        : (previous?.publishedAt ?? null),
  };
  const detailData = { ...detail, specs: detail.specs as Prisma.InputJsonValue };
  const imageRows = images.map((image, index) => ({
    url: image.url,
    alt: image.alt || data.name,
    width: image.width,
    height: image.height,
    blurDataUrl: image.blurDataUrl ?? null,
    sortOrder: index,
    kind: "GALLERY" as const,
  }));

  try {
    const saved = await db.$transaction(async (tx) => {
      const product = id
        ? await tx.product.update({
            where: { id },
            data: productData,
            select: { id: true, slug: true },
          })
        : await tx.product.create({ data: productData, select: { id: true, slug: true } });

      await tx.productDetail.upsert({
        where: { productId: product.id },
        create: { productId: product.id, ...detailData },
        update: detailData,
      });

      // Galeri: sıra ve alt metin değişebildiği için yeniden yazılır (en fazla 12 satır).
      await tx.productImage.deleteMany({ where: { productId: product.id, kind: "GALLERY" } });
      if (imageRows.length) {
        await tx.productImage.createMany({
          data: imageRows.map((row) => ({ ...row, productId: product.id })),
        });
      }
      return product;
    });

    invalidateProducts([saved.slug, previous?.slug].filter(Boolean) as string[]);
    await invalidateCategories([data.categoryId, previous?.categoryId].filter(Boolean) as string[]);
    return { ok: true, id: saved.id, slug: saved.slug };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const message = String(error.message);
      const field = message.includes("sku") ? "sku" : "slug";
      return {
        ok: false,
        error: "Bu değer başka bir üründe kullanılıyor.",
        fieldErrors: {
          [field]: field === "sku" ? "Bu SKU zaten kayıtlı." : "Bu adres (slug) zaten kayıtlı.",
        },
      };
    }
    throw error;
  }
}

/**
 * Siparişi olan ürün silinmez, arşivlenir (sipariş geçmişi snapshot taşısa da
 * raporlama ilişkisi korunur). Hiç satılmamışsa kalıcı silinir.
 */
export async function deleteProductAction(id: string): Promise<{ ok: boolean; archived: boolean }> {
  await requireStaff();
  const product = await db.product.findUnique({
    where: { id },
    select: { slug: true, categoryId: true, _count: { select: { orderItems: true } } },
  });
  if (!product) return { ok: false, archived: false };

  const archived = product._count.orderItems > 0;
  if (archived) {
    await db.product.update({ where: { id }, data: { status: ProductStatus.ARCHIVED } });
  } else {
    await db.product.delete({ where: { id } });
  }
  invalidateProducts([product.slug]);
  await invalidateCategories([product.categoryId]);
  return { ok: true, archived };
}
