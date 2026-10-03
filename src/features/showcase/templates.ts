import { z } from "zod";

import type { ShowcaseTemplate } from "@/generated/prisma/enums";

/**
 * Vitrin şablon sözleşmesi
 * ------------------------------------------------------------------
 * Animasyon zinciri (GSAP timeline) görsellere değil *slot*lara bağlıdır.
 * Her slot sabit bir DOM katmanıdır (`data-layer="dial"` gibi); panelden
 * yüklenen görsel yalnızca bu katmanın *içini* doldurur.
 *
 *  - Slot eksikse → koddaki varsayılan SVG katman çizilir.
 *  - Görsel en-boy oranı slotla uyuşmazsa → panel kaydı reddeder,
 *    ön yüz ise o görseli yok sayıp varsayılana döner.
 *
 * Böylece içerik ekibi görselleri değiştirirken pivot noktaları, z-derinlikleri
 * ve zamanlamalar asla bozulmaz.
 */

export type SlotDefinition = {
  label: string;
  /** genişlik / yükseklik */
  aspectRatio: number;
  hint?: string;
};

type TemplateDefinition = {
  label: string;
  /** Arkadan öne dizilim — timeline bu sırayla katmanları ayırır. */
  slots: Record<string, SlotDefinition>;
  /** İçerik adımı sayısı (scroll fazı başına bir metin). */
  steps: number;
};

const square = (label: string, hint?: string): SlotDefinition => ({ label, aspectRatio: 1, hint });

export const showcaseTemplates = {
  CLOCK_EXPLODED: {
    label: "Saat · Katmanlara ayrılan görünüm",
    steps: 3,
    slots: {
      case: square("Arka kasa"),
      movement: square("Mekanizma"),
      dial: square("Kadran"),
      hourHand: square("Akrep", "Kare tuval, pivot tam merkezde, ibre 12'yi gösterir."),
      minuteHand: square("Yelkovan", "Kare tuval, pivot tam merkezde, ibre 12'yi gösterir."),
      secondHand: square("Saniye ibresi", "Kare tuval, pivot tam merkezde, ibre 12'yi gösterir."),
      glass: square("Cam", "Şeffaf PNG/WebP/AVIF."),
      bezel: square("Çerçeve (bezel)", "Ortası şeffaf halka."),
    },
  },
  CABINET_REVEAL: {
    label: "Banyo dolabı · Kapak açılışı",
    steps: 3,
    slots: {
      carcass: { label: "Gövde", aspectRatio: 4 / 3 },
      shelfTop: { label: "Üst raf", aspectRatio: 4 / 1 },
      shelfBottom: { label: "Alt raf", aspectRatio: 4 / 1 },
      doorLeft: { label: "Sol kapak", aspectRatio: 2 / 3 },
      doorRight: { label: "Sağ kapak", aspectRatio: 2 / 3 },
    },
  },
  LAYER_STACK: {
    label: "Arıtma · Filtre katmanları",
    steps: 3,
    slots: {
      housing: { label: "Gövde", aspectRatio: 1 / 2 },
      sediment: { label: "Sediment", aspectRatio: 1 / 2 },
      carbon: { label: "Karbon", aspectRatio: 1 / 2 },
      membrane: { label: "Membran", aspectRatio: 1 / 2 },
      mineral: { label: "Mineral", aspectRatio: 1 / 2 },
    },
  },
  BOOKMARK_FLIP: {
    label: "Kitap ayracı · Sayfa arası",
    steps: 2,
    slots: {
      book: { label: "Kitap", aspectRatio: 3 / 2 },
      bookmark: { label: "Ayraç", aspectRatio: 1 / 4 },
      tassel: { label: "Püskül", aspectRatio: 1 / 2 },
    },
  },
  STATIC_HERO: {
    label: "Statik banner",
    steps: 0,
    slots: {
      background: { label: "Arka plan", aspectRatio: 16 / 9 },
    },
  },
} as const satisfies Record<ShowcaseTemplate, TemplateDefinition>;

export type SlotKey<T extends ShowcaseTemplate> = keyof (typeof showcaseTemplates)[T]["slots"] &
  string;

export const layerAssetSchema = z.object({
  url: z.string().min(1),
  alt: z.string().default(""),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurDataUrl: z.string().optional(),
});

export type LayerAsset = z.infer<typeof layerAssetSchema>;

export type ResolvedLayers<T extends ShowcaseTemplate> = Partial<Record<SlotKey<T>, LayerAsset>>;

const ASPECT_TOLERANCE = 0.02;

function fitsSlot(asset: LayerAsset, slot: SlotDefinition) {
  const ratio = asset.width / asset.height;
  return Math.abs(ratio - slot.aspectRatio) / slot.aspectRatio <= ASPECT_TOLERANCE;
}

export type LayerIssue = { slot: string; message: string };

/**
 * Veritabanındaki serbest JSON'u şablon sözleşmesine göre çözer.
 * Bilinmeyen slotlar ve uyumsuz görseller elenir; `issues` panelde gösterilir.
 */
export function resolveLayers<T extends ShowcaseTemplate>(
  template: T,
  raw: unknown,
): { layers: ResolvedLayers<T>; issues: LayerIssue[] } {
  const slots: Record<string, SlotDefinition> = showcaseTemplates[template].slots;
  const layers: Record<string, LayerAsset> = {};
  const issues: LayerIssue[] = [];

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw)) {
      const slot = slots[key];
      if (!slot) {
        issues.push({ slot: key, message: "Bu şablonda böyle bir slot yok." });
        continue;
      }
      const parsed = layerAssetSchema.safeParse(value);
      if (!parsed.success) {
        issues.push({ slot: key, message: "Görsel bilgisi eksik (url, width, height)." });
        continue;
      }
      if (!fitsSlot(parsed.data, slot)) {
        issues.push({
          slot: key,
          message: `En-boy oranı ${slot.aspectRatio.toFixed(2)} olmalı (yüklenen: ${(
            parsed.data.width / parsed.data.height
          ).toFixed(2)}).`,
        });
        continue;
      }
      layers[key] = parsed.data;
    }
  }

  return { layers: layers as ResolvedLayers<T>, issues };
}

export const showcaseContentSchema = z.object({
  steps: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
});

export type ShowcaseContent = z.infer<typeof showcaseContentSchema>;

export const showcaseThemeSchema = z.object({
  accent: z.string().optional(),
  background: z.string().optional(),
});
