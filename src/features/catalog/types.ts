import { z } from "zod";

import type { ShowcaseTemplate } from "@/generated/prisma/enums";

/**
 * Sunucu → istemci DTO'ları. Sadece düz JSON tipleri (Date, Decimal yok):
 * `unstable_cache` sonuçları JSON olarak saklar, RSC sınırı da aynısını ister.
 */

export const specSchema = z.object({
  group: z.string(),
  label: z.string(),
  value: z.string(),
  unit: z.string().optional(),
});

export const specsSchema = z.array(specSchema).catch([]);

export type Spec = z.infer<typeof specSchema>;

export type ImageDTO = {
  url: string;
  alt: string;
  width: number;
  height: number;
  blurDataUrl: string | null;
};

export type CategoryDTO = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accentColor: string | null;
  productCount: number;
};

export type ProductCardDTO = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currency: string;
  stock: number;
  category: { slug: string; name: string; accentColor: string | null };
  image: ImageDTO | null;
};

export type ProductDimensionsDTO = {
  widthMm: number | null;
  heightMm: number | null;
  depthMm: number | null;
  weightGrams: number | null;
  material: string | null;
  color: string | null;
  finish: string | null;
  origin: string | null;
  warrantyMonths: number | null;
  inTheBox: string[];
  careInstructions: string | null;
  specs: Spec[];
};

export type ProductDetailDTO = ProductCardDTO & {
  sku: string;
  brand: string | null;
  description: string;
  vatRate: number;
  lowStockThreshold: number;
  showcaseTemplate: ShowcaseTemplate | null;
  gallery: ImageDTO[];
  detail: ProductDimensionsDTO | null;
  seoTitle: string | null;
  seoDescription: string | null;
};
