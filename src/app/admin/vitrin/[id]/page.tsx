import Link from "next/link";
import { notFound } from "next/navigation";

import { ShowcaseEditor } from "@/features/admin/showcase/showcase-editor";
import { requireStaff } from "@/features/auth/guards";
import {
  resolveLayers,
  showcaseContentSchema,
  showcaseTemplates,
  showcaseThemeSchema,
} from "@/features/showcase/templates";
import { db } from "@/lib/db";

export const metadata = { title: "Vitrin düzenle" };

export default async function EditShowcasePage({ params }: PageProps<"/admin/vitrin/[id]">) {
  await requireStaff();
  const { id } = await params;
  const banner = await db.showcaseBanner.findUnique({ where: { id } });
  if (!banner) notFound();

  const template = showcaseTemplates[banner.template];
  const { layers } = resolveLayers(banner.template, banner.layers);
  const content = showcaseContentSchema.catch({ steps: [] }).parse(banner.content);
  const theme = showcaseThemeSchema.catch({}).parse(banner.theme);

  return (
    <div>
      <Link href="/admin/vitrin" className="text-sm text-muted-foreground hover:text-foreground">
        ← Vitrin & Banner
      </Link>
      <h1 className="mt-4 font-display text-5xl">{banner.title}</h1>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {banner.key} · {template.label}
      </p>
      <ShowcaseEditor
        initial={{
          id: banner.id,
          eyebrow: banner.eyebrow,
          title: banner.title,
          subtitle: banner.subtitle,
          ctaLabel: banner.ctaLabel,
          ctaHref: banner.ctaHref,
          isActive: banner.isActive,
          startsAt: banner.startsAt?.toISOString() ?? null,
          endsAt: banner.endsAt?.toISOString() ?? null,
          accent: theme.accent ?? null,
          steps: content.steps,
          layers: layers as Record<string, (typeof layers)[keyof typeof layers] & object>,
        }}
        slots={template.slots}
        stepCount={template.steps}
      />
    </div>
  );
}
