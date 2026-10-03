import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusActions, RefundForm } from "@/features/admin/orders/order-actions";
import { getOrderDetail } from "@/features/admin/orders/queries";
import { requireAdmin } from "@/features/auth/guards";
import type { Address } from "@/features/checkout/schema";
import { confirmationPath } from "@/features/orders/service";
import {
  allowedTransitions,
  orderStatusLabels,
  paymentStatusLabels,
} from "@/features/orders/status";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Sipariş detayı" };

const dateTime = (date: Date | null) =>
  date
    ? date.toLocaleString("tr-TR", {
        timeZone: "Europe/Istanbul",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export default async function AdminOrderPage({ params }: PageProps<"/admin/siparisler/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  const address = order.shippingAddress as Address;
  const transitions = allowedTransitions[order.status] ?? [];
  const refundable =
    order.paymentStatus === "CAPTURED" &&
    (order.status === "SHIPPED" || order.status === "DELIVERED");

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/siparisler"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Siparişler
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-4xl">{order.orderNumber}</h1>
          <Badge variant="outline">{orderStatusLabels[order.status]}</Badge>
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
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {dateTime(order.placedAt)} ·{" "}
          <Link
            href={confirmationPath(order)}
            target="_blank"
            className="underline underline-offset-4"
          >
            Müşteri sayfası
          </Link>
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kalemler</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead className="text-right">Birim</TableHead>
                    <TableHead className="text-right">Adet</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-normal">
                        {item.product ? (
                          <Link
                            href={`/admin/urunler/${item.product.id}`}
                            className="hover:underline"
                          >
                            {item.productName}
                          </Link>
                        ) : (
                          item.productName
                        )}
                        <span className="block font-mono text-xs text-muted-foreground">
                          {item.sku} · KDV %{item.vatRate}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.unitPriceMinor, order.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.lineTotalMinor, order.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <dl className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
                {(
                  [
                    ["Ara toplam", order.subtotalMinor],
                    ["Kargo", order.shippingMinor],
                    ["İndirim", -order.discountMinor],
                    ["Dahil KDV", order.taxMinor],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex justify-between text-muted-foreground">
                    <dt>{label}</dt>
                    <dd className="tabular-nums">{formatMoney(value, order.currency)}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 font-medium">
                  <dt>Toplam</dt>
                  <dd className="tabular-nums">{formatMoney(order.totalMinor, order.currency)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zaman çizelgesi</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-5 border-l pl-6">
                {order.events.map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full bg-brass" />
                    <p className="text-sm">{event.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {dateTime(event.createdAt)} · {event.type} · {event.actor}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {order.refundedAt ? (
                <p role="status" className="rounded-md bg-accent p-3 text-sm">
                  Bu sipariş {dateTime(order.refundedAt)} tarihinde iade edildi.
                </p>
              ) : order.cancelledAt ? (
                <p role="status" className="rounded-md bg-accent p-3 text-sm">
                  Bu sipariş {dateTime(order.cancelledAt)} tarihinde iptal edildi.
                </p>
              ) : null}
              <OrderStatusActions orderId={order.id} transitions={transitions} />
              {refundable ? <RefundForm orderId={order.id} /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Müşteri ve teslimat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                {address.fullName}
                <span className="block text-muted-foreground">{order.email}</span>
                <span className="block text-muted-foreground">{order.phone}</span>
              </p>
              <p className="text-muted-foreground">
                {address.line1}
                <br />
                {address.district} / {address.city} {address.postalCode}
              </p>
              {order.customerNote ? (
                <p className="rounded-md bg-accent p-3">
                  <span className="text-xs text-muted-foreground">Müşteri notu</span>
                  <br />
                  {order.customerNote}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {order.user ? `Üye: ${order.user.name ?? order.user.email}` : "Misafir sipariş"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ödeme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Sağlayıcı</span>{" "}
                {order.paymentProvider ?? "—"}
              </p>
              <p className="flex justify-between gap-4">
                <span className="text-muted-foreground">Referans</span>
                <span className="truncate font-mono text-xs">{order.paymentReference ?? "—"}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Ödendi</span> {dateTime(order.paidAt)}
              </p>
              {order.trackingNumber ? (
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Kargo</span>
                  {order.carrier} · {order.trackingNumber}
                </p>
              ) : null}
              {order.paymentFailureReason ? (
                <p className="text-destructive">{order.paymentFailureReason}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
