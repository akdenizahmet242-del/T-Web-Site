import { Search } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listOrders } from "@/features/admin/orders/queries";
import { ReleaseExpiredButton } from "@/features/admin/orders/release-expired-button";
import { Pagination, readPage, readParam } from "@/features/admin/pagination";
import { requireAdmin } from "@/features/auth/guards";
import type { Address } from "@/features/checkout/schema";
import { orderStatusLabels, paymentStatusLabels } from "@/features/orders/status";
import { OrderStatus } from "@/generated/prisma/enums";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata = { title: "Siparişler" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/siparisler">) {
  await requireAdmin();
  const params = await searchParams;
  const filters = { q: readParam(params.q), status: readParam(params.status) };
  const page = readPage(params.page);
  const { rows, total, pages, counts } = await listOrders({ ...filters, page });

  const tab = (status?: OrderStatus) => {
    const search = new URLSearchParams();
    if (filters.q) search.set("q", filters.q);
    if (status) search.set("status", status);
    return `/admin/siparisler${search.size ? `?${search}` : ""}`;
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Siparişler</h1>
          <p className="mt-2 text-sm text-muted-foreground">{total} sipariş</p>
        </div>
        <ReleaseExpiredButton />
      </header>

      <nav aria-label="Durum filtresi" className="mt-8 flex gap-1 overflow-x-auto border-b">
        {[undefined, ...Object.values(OrderStatus)].map((status) => {
          const active = filters.status === status;
          return (
            <Link
              key={status ?? "all"}
              href={tab(status)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap",
                active
                  ? "border-brass text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {status ? orderStatusLabels[status] : "Tümü"}
              {status && counts[status] ? (
                <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                  {counts[status]}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <form className="mt-6 flex gap-3" role="search">
        {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={filters.q}
            placeholder="Sipariş no, e-posta veya takip no"
            className="pl-9"
            aria-label="Ara"
          />
        </div>
        <Button type="submit" variant="outline">
          Ara
        </Button>
      </form>

      <div className="mt-6 rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sipariş</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Ödeme</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Sipariş bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/siparisler/${order.id}`}
                      className="font-mono text-sm hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {order._count.items} kalem
                    </span>
                  </TableCell>
                  <TableCell>
                    {(order.shippingAddress as Address).fullName}
                    <span className="block text-xs text-muted-foreground">{order.email}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.placedAt.toLocaleString("tr-TR", {
                      timeZone: "Europe/Istanbul",
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{orderStatusLabels[order.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.paymentStatus === "CAPTURED"
                          ? "default"
                          : order.paymentStatus === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {paymentStatusLabels[order.paymentStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(order.totalMinor, order.currency)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} pages={pages} basePath="/admin/siparisler" params={filters} />
    </div>
  );
}
