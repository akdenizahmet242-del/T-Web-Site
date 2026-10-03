import "server-only";

import { unstable_cache } from "next/cache";

import type { ShowcaseTemplate } from "@/generated/prisma/enums";
import { CacheTags, RevalidateSeconds, withBuildFallback } from "@/lib/cache";
import { db } from "@/lib/db";

import {
  resolveLayers,
  showcaseContentSchema,
  showcaseThemeSchema,
  type ResolvedLayers,
  type ShowcaseContent,
} from "./templates";

export type ShowcaseData<T extends ShowcaseTemplate> = {
  key: string;
  template: T;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  layers: ResolvedLayers<T>;
  content: ShowcaseContent;
  theme: { accent?: string; background?: string };
};

/**
 * Bir vitrin kaydını şablon sözleşmesine göre çözerek döndürür.
 * Kayıt yoksa, pasifse ya da farklı bir şablona aitse `null` → bileşen
 * kendi varsayılan içerik ve katmanlarıyla çizilir (sayfa asla kırılmaz).
 *
 * Not: `startsAt/endsAt` penceresi önbelleğe alındığı anda değerlendirilir;
 * hassasiyet `RevalidateSeconds.showcase` kadardır.
 */
export function getShowcase<T extends ShowcaseTemplate>(
  key: string,
  template: T,
): Promise<ShowcaseData<T> | null> {
  return withBuildFallback(
    `getShowcase(${key})`,
    unstable_cache(
      async () => {
        const now = new Date();
        const banner = await db.showcaseBanner.findFirst({
          where: {
            key,
            template,
            isActive: true,
            AND: [
              { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
              { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
            ],
          },
          select: {
            key: true,
            eyebrow: true,
            title: true,
            subtitle: true,
            ctaLabel: true,
            ctaHref: true,
            layers: true,
            content: true,
            theme: true,
          },
        });
        if (!banner) return null;

        const { layers, issues } = resolveLayers(template, banner.layers);
        if (issues.length > 0) {
          console.warn(`[showcase:${key}] varsayılana dönen slotlar:`, issues);
        }

        return {
          ...banner,
          template,
          layers,
          content: showcaseContentSchema.catch({ steps: [] }).parse(banner.content),
          theme: showcaseThemeSchema.catch({}).parse(banner.theme),
        };
      },
      ["showcase", key, template],
      { tags: [CacheTags.showcase], revalidate: RevalidateSeconds.showcase },
    ),
    null,
  );
}
