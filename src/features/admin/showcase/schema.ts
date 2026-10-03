import { z } from "zod";

import { layerAssetSchema } from "@/features/showcase/templates";
import { BannerPlacement, ShowcaseTemplate } from "@/generated/prisma/enums";

const optionalText = (max: number) => z.string().trim().max(max).nullable();

/** Site içi yol ya da https bağlantısı (javascript: vb. engellenir). */
const href = z
  .string()
  .trim()
  .max(300)
  .refine(
    (value) => value.startsWith("/") || /^https:\/\//.test(value),
    "“/” ile başlayan bir yol ya da https bağlantısı girin.",
  )
  .nullable();

export const showcaseFormSchema = z
  .object({
    id: z.string().min(1),
    eyebrow: optionalText(80),
    title: z.string().trim().min(2, "Başlık girin.").max(120),
    subtitle: optionalText(240),
    ctaLabel: optionalText(40),
    ctaHref: href,
    isActive: z.boolean(),
    startsAt: z.iso.datetime().nullable(),
    endsAt: z.iso.datetime().nullable(),
    accent: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i, "#rrggbb biçiminde renk.")
      .nullable(),
    steps: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(60),
          body: z.string().trim().min(1).max(240),
        }),
      )
      .max(6),
    layers: z.record(z.string(), layerAssetSchema),
  })
  .refine((value) => !value.startsAt || !value.endsAt || value.startsAt < value.endsAt, {
    path: ["endsAt"],
    message: "Bitiş, başlangıçtan sonra olmalı.",
  });

export type ShowcaseFormInput = z.infer<typeof showcaseFormSchema>;

export const createShowcaseSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:[-:][a-z0-9]+)*$/, "Küçük harf, rakam, tire."),
  title: z.string().trim().min(2).max(120),
  template: z.enum(ShowcaseTemplate),
  placement: z.enum(BannerPlacement),
});
