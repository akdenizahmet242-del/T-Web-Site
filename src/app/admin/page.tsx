import { AlertTriangle, Package, ShoppingCart, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboard } from "@/features/admin/queries";
import { resolveLayers, showcaseTemplates } from "@/features/showcase/templates";
import { formatMoney } from "@/lib/money";

export default async function AdminDashboardPage() {
  const data = await getDashboard();

  const stats = [
    { label: "Aktif ürün", value: data.activeProducts.toString(), icon: Package },
    { label: "Kritik stok", value: data.lowStock.length.toString(), icon: AlertTriangle },
    { label: "Bekleyen sipariş", value: data.pendingOrders.toString(), icon: ShoppingCart },
    { label: "Tahsil edilen ciro", value: formatMoney(data.revenueMinor), icon: Wallet },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-5xl">Genel bakış</h1>
        <p className="mt-2 text-sm text-muted-foreground">Mağazanın anlık durumu.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="gap-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardDescription>{label}</CardDescription>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kritik stok</CardTitle>
            <CardDescription>Stok, ürünün eşik değerinin altına indi.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Kritik stokta ürün yok.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Stok / Eşik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStock.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="whitespace-normal">{product.name}</TableCell>
                      <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {product.stock} / {product.lowStockThreshold}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vitrin katmanları</CardTitle>
            <CardDescription>
              Görsel atanmamış slotlar varsayılan SVG katmanıyla çizilir; animasyon zinciri her
              durumda sağlamdır.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.banners.map((banner) => {
              const template = showcaseTemplates[banner.template];
              const slots = Object.keys(template.slots);
              const { layers, issues } = resolveLayers(banner.template, banner.layers);
              const custom = Object.keys(layers).length;
              return (
                <div key={banner.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{banner.title}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {banner.key} · {template.label}
                      </p>
                    </div>
                    <Badge variant={banner.isActive ? "default" : "secondary"}>
                      {banner.isActive ? "Yayında" : "Pasif"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {slots.length} slot · {custom} özel görsel · {slots.length - custom} varsayılan
                  </p>
                  {issues.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-destructive">
                      {issues.map((issue) => (
                        <li key={issue.slot}>
                          {issue.slot}: {issue.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz sipariş yok. Ödeme akışı (PaymentService) Faz 2&apos;de bağlanacak.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                    <TableCell>{order.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(order.totalMinor, order.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
