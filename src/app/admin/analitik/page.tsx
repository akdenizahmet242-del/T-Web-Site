import { Check } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarList } from "@/features/admin/analytics/bar-list";
import { PERIODS, getAnalytics, type Period } from "@/features/admin/analytics/queries";
import { RevenueChart } from "@/features/admin/analytics/revenue-chart";
import { StatTile } from "@/features/admin/analytics/stat-tile";
import { requireAdmin } from "@/features/auth/guards";
import { orderStatusLabels } from "@/features/orders/status";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analitik" };

const percent = (value: number | null) => (value === null ? "—" : `%${Math.round(value * 100)}`);

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analitik">) {
  await requireAdmin();
  const requested = Number((await searchParams).gun);
  const days: Period = (PERIODS as readonly number[]).includes(requested)
    ? (requested as Period)
    : 30;
  const data = await getAnalytics(days);
  const { current, previous } = data;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-5xl">Analitik</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tahsil edilmiş siparişler üzerinden. Ziyaret ve huni verisi için GA4 / Meta olayları
          kullanılır.
        </p>
      </header>

      {/* Filtreler: tek satır, tüm grafikleri kapsar */}
      <nav aria-label="Dönem" className="flex gap-1">
        {PERIODS.map((period) => (
          <Link
            key={period}
            href={`/admin/analitik?gun=${period}`}
            aria-current={period === days ? "true" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
              period === days
                ? "border-foreground/30 bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            {period === days ? <Check className="size-4" strokeWidth={3} /> : null}
            Son {period} gün
          </Link>
        ))}
      </nav>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Tahsilat"
          value={formatMoney(current.revenueMinor)}
          current={current.revenueMinor}
          previous={previous.revenueMinor}
        />
        <StatTile
          label="Ödenen sipariş"
          value={current.orders.toLocaleString("tr-TR")}
          current={current.orders}
          previous={previous.orders}
        />
        <StatTile
          label="Ortalama sepet"
          value={formatMoney(current.aovMinor)}
          current={current.aovMinor}
          previous={previous.aovMinor}
        />
        <StatTile
          label="Ödeme başarı oranı"
          value={percent(current.paymentSuccess)}
          current={current.paymentSuccess}
          previous={previous.paymentSuccess}
          formatDelta={(delta) => `${delta > 0 ? "+" : ""}${Math.round(delta * 100)}%`}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Günlük tahsilat</CardTitle>
          <CardDescription>
            Son {days} gün · {current.created} sipariş oluşturuldu, {current.orders} tanesi ödendi
            (dönüşüm {percent(current.conversion)})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={data.daily} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>En çok kazandıran ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              rows={data.topProducts.map((row) => ({
                label: row.name,
                value: row.revenueMinor,
                hint: `${row.quantity} adet`,
              }))}
              format={(value) => formatMoney(value)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Kategori bazında tahsilat</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              rows={data.categories.map((row) => ({ label: row.name, value: row.revenueMinor }))}
              format={(value) => formatMoney(value)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sipariş durumları</CardTitle>
            <CardDescription>Bu dönemde oluşturulan siparişler</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              rows={data.statusCounts
                .sort((a, b) => b.count - a.count)
                .map((row) => ({ label: orderStatusLabels[row.status], value: row.count }))}
              format={(value) => value.toLocaleString("tr-TR")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
