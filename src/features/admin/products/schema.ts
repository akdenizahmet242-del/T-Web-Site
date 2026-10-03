import { z } from "zod";

import { specSchema } from "@/features/catalog/types";
import { ProductStatus, ShowcaseTemplate } from "@/generated/prisma/enums";
import { SLUG_PATTERN } from "@/lib/slug";

const measure = z.number().int().min(0).max(100_000_000).nullable();
const shortText = (max: number) => z.string().trim().max(max).nullable();

export const productImageInputSchema = z.object({
  url: z.string().min(1).max(500),
  alt: z.string().trim().max(160),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurDataUrl: z.string().max(4000).nullable().optional(),
});

/**
 * Ürün formu sözleşmesi — istemci formu ve Server Action aynı şemayı kullanır.
 * Para kuruş, ölçüler mm, ağırlık gram (Int).
 */
export const productFormSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, "Ürün adı en az 2 karakter.").max(120),
    slug: z.string().regex(SLUG_PATTERN, "Yalnızca küçük harf, rakam ve tire.").max(96),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9-]{1,39}$/, "SKU: harf, rakam ve tire (2–40)."),
    brand: shortText(60),
    categoryId: z.string().min(1, "Kategori seçin."),
    status: z.enum(ProductStatus),
    isFeatured: z.boolean(),
    showcaseTemplate: z.enum(ShowcaseTemplate).nullable(),
    tagline: shortText(140),
    description: z.string().trim().min(10, "Açıklama en az 10 karakter.").max(5000),
    priceMinor: z
      .number({ error: "Geçerli bir fiyat girin." })
      .int()
      .positive("Fiyat 0'dan büyük olmalı."),
    compareAtPriceMinor: z.number().int().positive().nullable(),
    vatRate: z.number().int().min(0).max(30),
    stock: z.number({ error: "Stok girin." }).int().min(0).max(1_000_000),
    lowStockThreshold: z.number().int().min(0).max(10_000),
    detail: z.object({
      widthMm: measure,
      heightMm: measure,
      depthMm: measure,
      weightGrams: measure,
      packageWidthMm: measure,
      packageHeightMm: measure,
      packageDepthMm: measure,
      packageWeightGrams: measure,
      material: shortText(120),
      color: shortText(80),
      finish: shortText(80),
      origin: shortText(60),
      warrantyMonths: z.number().int().min(0).max(240).nullable(),
      careInstructions: z.string().trim().max(2000).nullable(),
      inTheBox: z.array(z.string().trim().min(1).max(120)).max(20),
      specs: z
        .array(
          specSchema.extend({
            group: z.string().trim().min(1).max(60),
            label: z.string().trim().min(1).max(80),
            value: z.string().trim().min(1).max(200),
          }),
        )
        .max(60),
    }),
    images: z.array(productImageInputSchema).max(12, "En fazla 12 görsel."),
    seoTitle: shortText(70),
    seoDescription: shortText(160),
  })
  .refine(
    (value) => value.compareAtPriceMinor == null || value.compareAtPriceMinor > value.priceMinor,
    { path: ["compareAtPriceMinor"], message: "Eski fiyat, satış fiyatından yüksek olmalı." },
  );

export type ProductFormInput = z.infer<typeof productFormSchema>;
export type ProductImageInput = z.infer<typeof productImageInputSchema>;
