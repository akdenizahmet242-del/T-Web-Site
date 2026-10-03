import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/guards";
import { confirmationPath } from "@/features/orders/service";
import { orderStatusLabels } from "@/features/orders/status";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Hesabım", robots: { index: false } };

export default async function AccountPage() {
  const session = await requireUser();
  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { placedAt: "desc" },
    take: 50,
    select: {
      id: true,
      orderNumber: true,
      accessToken: true,
      status: true,
      totalMinor: true,
      currency: true,
      placedAt: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <section className="mx-auto max-w-4xl px-5 pt-32 pb-28 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.25em] text-brass uppercase">Hesabım</p>
          <h1 className="mt-3 font-display text-6xl">
            Merhaba{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        <form action={logoutAction}>
          <Button variant="outline" type="submit">
            <LogOut /> Çıkış yap
          </Button>
        </form>
      </div>

      <h2 className="mt-16 font-display text-3xl">Siparişlerim</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Henüz siparişiniz yok.{" "}
          <Link href="/" className="text-foreground underline underline-offset-4">
            Koleksiyonları keşfedin
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 divide-y rounded-2xl border bg-card">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={confirmationPath(order)}
                className="flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:bg-accent/40"
              >
                <span>
                  <span className="block font-mono text-sm">{order.orderNumber}</span>
                  <span className="text-xs text-muted-foreground">
                    {order.placedAt.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })} ·{" "}
                    {order._count.items} kalem
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <Badge variant="outline">{orderStatusLabels[order.status]}</Badge>
                  <span className="tabular-nums">
                    {formatMoney(order.totalMinor, order.currency)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
