import { CheckCircle2, Clock3, PackageCheck, Truck, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { commerceConfig } from "@/config/commerce";
import { retryPaymentAction } from "@/features/checkout/actions";
import type { Address } from "@/features/checkout/schema";
import { orderStatusLabels } from "@/features/orders/status";
import { TrackPurchase } from "@/features/orders/track-purchase";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sipariş", robots: { index: false, follow: false } };

const progress = [
  { status: "PAID", label: "Ödendi", icon: CheckCircle2 },
  { status: "PROCESSING", label: "Hazırlanıyor", icon: Clock3 },
  { status: "SHIPPED", label: "Kargoda", icon: Truck },
  { status: "DELIVERED", label: "Teslim edildi", icon: PackageCheck },
] as const;

export default async function OrderPage({
  params,
  searchParams,
}: PageProps<"/siparis/[orderNumber]">) {
  const [{ orderNumber }, { t }, session] = await Promise.all([params, searchParams, auth()]);
  const token = typeof t === "string" ? t : undefined;

  // Erişim: link'teki tahmin edilemez token ya da siparişin sahibi olan oturum.
  const access = [
    ...(token ? [{ accessToken: token }] : []),
    ...(session?.user?.id ? [{ userId: session.user.id }] : []),
  ];
  if (access.length === 0) notFound();

  const order = await db.order.findFirst({
    where: { orderNumber, OR: access },
    include: { items: { orderBy: { productName: "asc" } } },
  });
  if (!order) notFound();

  const address = order.shippingAddress as Address;
  const paid = order.paymentStatus === "CAPTURED";
  const awaiting = order.status === "AWAITING_PAYMENT" || order.status === "PENDING";
  const deadline = new Date(
    order.placedAt.getTime() + commerceConfig.paymentWindowMinutes * 60_000,
  );
  const step = progress.findIndex((item) => item.status === order.status);

  return (
    <section className="mx-auto max-w-4xl px-5 pt-32 pb-28 sm:px-8">
      {paid ? (
        <TrackPurchase
          orderNumber={order.orderNumber}
          currency={order.currency}
          valueMinor={order.totalMinor}
          shippingMinor={order.shippingMinor}
          taxMinor={order.taxMinor}
          items={order.items.map((item) => ({
            id: item.productId ?? item.sku,
            sku: item.sku,
            name: item.productName,
            priceMinor: item.unitPriceMinor,
            quantity: item.quantity,
          }))}
        />
      ) : null}

      <p className="font-mono text-[11px] tracking-[0.25em] text-brass uppercase">
        Sipariş {order.orderNumber}
      </p>

      {paid ? (
        <h1 className="mt-3 font-display text-6xl">Teşekkürler, siparişiniz alındı.</h1>
      ) : awaiting ? (
        <h1 className="mt-3 font-display text-6xl">Ödeme tamamlanmadı.</h1>
      ) : (
        <h1 className="mt-3 font-display text-6xl">{orderStatusLabels[order.status]}</h1>
      )}

      {awaiting && !paid ? (
        <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="flex items-center gap-2 text-sm">
            <XCircle className="size-4 text-destructive" />
            {order.paymentFailureReason ?? "Ödeme adımı yarıda kaldı."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ürünleriniz{" "}
            {deadline.toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Istanbul",
            })}{" "}
            saatine kadar sizin için ayrıldı.
          </p>
          <form action={retryPaymentAction} className="mt-5">
            <input type="hidden" name="orderNumber" value={order.orderNumber} />
            <input type="hidden" name="token" value={order.accessToken} />
            <Button type="submit">Ödemeyi tekrar dene</Button>
          </form>
        </div>
      ) : null}

      {step >= 0 ? (
        <ol className="mt-10 grid grid-cols-4 gap-2">
          {progress.map((item, index) => {
            const Icon = item.icon;
            const done = index <= step;
            return (
              <li key={item.status} className="text-center">
                <span
                  className={cn(
                    "mx-auto grid size-11 place-items-center rounded-full border transition-colors",
                    done
                      ? "border-brass bg-brass text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span
                  className={cn(
                    "mt-2 block text-xs",
                    done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {order.trackingNumber ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Kargo: <span className="text-foreground">{order.carrier}</span> · Takip no:{" "}
          <span className="font-mono text-foreground">{order.trackingNumber}</span>
        </p>
      ) : null}

      <div className="mt-12 grid gap-8 md:grid-cols-[3fr_2fr]">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="font-display text-2xl">Ürünler</h2>
          <ul className="mt-4 divide-y text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3">
                <span>
                  {item.productName}{" "}
                  <span className="text-muted-foreground">× {item.quantity}</span>
                </span>
                <span className="tabular-nums">
                  {formatMoney(item.lineTotalMinor, order.currency)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ara toplam</dt>
              <dd className="tabular-nums">{formatMoney(order.subtotalMinor, order.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Kargo</dt>
              <dd className="tabular-nums">
                {order.shippingMinor === 0
                  ? "Ücretsiz"
                  : formatMoney(order.shippingMinor, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>Toplam</dt>
              <dd className="tabular-nums">{formatMoney(order.totalMinor, order.currency)}</dd>
            </div>
            <p className="text-xs text-muted-foreground">
              Toplama dahil KDV: {formatMoney(order.taxMinor, order.currency)}
            </p>
          </dl>
        </div>

        <div className="space-y-6 text-sm">
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-display text-2xl">Teslimat</h2>
            <p className="mt-3">{address.fullName}</p>
            <p className="text-muted-foreground">
              {address.line1}
              <br />
              {address.district} / {address.city} {address.postalCode}
            </p>
            <p className="mt-3 text-muted-foreground">{order.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{orderStatusLabels[order.status]}</Badge>
            <span className="text-xs text-muted-foreground">
              {order.placedAt.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Alışverişe devam et
        </Link>
        {session?.user ? (
          <Link href="/hesap" className={buttonVariants({ variant: "ghost" })}>
            Siparişlerim
          </Link>
        ) : null}
      </div>
    </section>
  );
}
