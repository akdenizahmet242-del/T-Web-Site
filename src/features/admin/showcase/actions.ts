"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/features/auth/guards";
import { resolveLayers } from "@/features/showcase/templates";
import { Prisma } from "@/generated/prisma/client";
import { CacheTags } from "@/lib/cache";
import { db } from "@/lib/db";

import { createShowcaseSchema, showcaseFormSchema, type ShowcaseFormInput } from "./schema";

export type SaveShowcaseResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function saveShowcaseAction(input: ShowcaseFormInput): Promise<SaveShowcaseResult> {
  await requireStaff();

  const parsed = showcaseFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, error: "Formda düzeltilmesi gereken alanlar var.", fieldErrors };
  }

  const banner = await db.showcaseBanner.findUnique({
    where: { id: parsed.data.id },
    select: { template: true, theme: true },
  });
  if (!banner) return { ok: false, error: "Vitrin bulunamadı." };

  // Ön yüzün kullandığı aynı sözleşme: yanlış slot / yanlış oran kaydedilemez.
  const { layers, issues } = resolveLayers(banner.template, parsed.data.layers);
  if (issues.length) {
    return {
      ok: false,
      error: "Bazı katman görselleri şablonla uyumsuz.",
      fieldErrors: Object.fromEntries(
        issues.map((issue) => [`layers.${issue.slot}`, issue.message]),
      ),
    };
  }

  const {
    id,
    steps,
    accent,
    startsAt,
    endsAt,
    eyebrow,
    title,
    subtitle,
    ctaLabel,
    ctaHref,
    isActive,
  } = parsed.data;
  await db.showcaseBanner.update({
    where: { id },
    data: {
      eyebrow,
      title,
      subtitle,
      ctaLabel,
      ctaHref,
      isActive,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      layers: layers as Prisma.InputJsonValue,
      content: { steps },
      theme: { ...(banner.theme as object), accent: accent ?? undefined },
    },
  });

  revalidateTag(CacheTags.showcase, "max");
  return { ok: true };
}

export async function createShowcaseAction(formData: FormData) {
  await requireStaff();
  const parsed = createShowcaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/vitrin?hata=gecersiz");

  let id: string;
  try {
    ({ id } = await db.showcaseBanner.create({
      data: { ...parsed.data, isActive: false },
      select: { id: true },
    }));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/admin/vitrin?hata=anahtar");
    }
    throw error;
  }
  redirect(`/admin/vitrin/${id}`);
}
