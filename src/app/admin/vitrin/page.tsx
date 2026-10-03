import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { readParam } from "@/features/admin/pagination";
import { createShowcaseAction } from "@/features/admin/showcase/actions";
import { requireStaff } from "@/features/auth/guards";
import { resolveLayers, showcaseTemplates } from "@/features/showcase/templates";
import { BannerPlacement } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const metadata = { title: "Vitrin & Banner" };

const placementLabels: Record<BannerPlacement, string> = {
  HOME_HERO: "Ana sayfa · Hero",
  HOME_SHOWCASE: "Ana sayfa · Vitrin",
  HOME_PROMO_STRIP: "Ana sayfa · Kampanya şeridi",
  CATEGORY_TOP: "Kategori üstü / ürün sahnesi",
};

export default async function AdminShowcasePage({ searchParams }: PageProps<"/admin/vitrin">) {
  await requireStaff();
  const error = readParam((await searchParams).hata);
  const banners = await db.showcaseBanner.findMany({
    orderBy: [{ placement: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      key: true,
      title: true,
      template: true,
      placement: true,
      isActive: true,
      startsAt: true,
      endsAt: true,
      layers: true,
      product: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-5xl">Vitrin &amp; Banner</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Her vitrin bir animasyon şablonuna bağlıdır. Görseller şablonun sabit slotlarına atanır;
          eksik slotlar varsayılan çizimle gösterilir.
        </p>
      </header>

      <ul className="grid gap-4 lg:grid-cols-2">
        {banners.map((banner) => {
          const template = showcaseTemplates[banner.template];
          const slotCount = Object.keys(template.slots).length;
          const custom = Object.keys(resolveLayers(banner.template, banner.layers).layers).length;
          return (
            <li key={banner.id}>
              <Link
                href={`/admin/vitrin/${banner.id}`}
                className="block rounded-xl border bg-card p-5 transition-colors hover:border-brass/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{banner.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">{banner.key}</p>
                  </div>
                  <Badge variant={banner.isActive ? "default" : "secondary"}>
                    {banner.isActive ? "Yayında" : "Pasif"}
                  </Badge>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {template.label} · {placementLabels[banner.placement]}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <span
                      className="block h-full origin-left bg-brass"
                      style={{ transform: `scaleX(${custom / slotCount})` }}
                    />
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {custom}/{slotCount} özel görsel
                  </span>
                </div>
                {banner.endsAt || banner.startsAt ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {banner.startsAt?.toLocaleDateString("tr-TR") ?? "…"} –{" "}
                    {banner.endsAt?.toLocaleDateString("tr-TR") ?? "…"}
                  </p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Yeni vitrin</CardTitle>
          <CardDescription>
            Ürün sayfası sahneleri için anahtar <code>product:&lt;slug&gt;</code> biçiminde olmalı.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 text-sm text-destructive">
              {error === "anahtar" ? "Bu anahtar zaten kullanılıyor." : "Bilgiler geçersiz."}
            </p>
          ) : null}
          <form action={createShowcaseAction} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="key">Anahtar</Label>
              <Input
                id="key"
                name="key"
                placeholder="product:hilton-80-lake-banyo-dolabi"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-title">Başlık</Label>
              <Input id="new-title" name="title" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template">Şablon</Label>
              <NativeSelect id="template" name="template">
                {Object.entries(showcaseTemplates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="placement">Yerleşim</Label>
              <NativeSelect id="placement" name="placement">
                {Object.values(BannerPlacement).map((placement) => (
                  <option key={placement} value={placement}>
                    {placementLabels[placement]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button type="submit" className="w-fit">
              Oluştur
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
