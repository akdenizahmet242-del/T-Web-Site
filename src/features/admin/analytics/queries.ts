import "server-only";

import { OrderEventType, PaymentStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

export type DailyPoint = { day: string; revenueMinor: number; orders: number };

type Totals = {
  revenueMinor: number;
  orders: number;
  created: number;
  succeeded: number;
  failed: number;
};

const TZ = "Europe/Istanbul";

/** Gün gün tahsilat — boş günler sıfırla doldurulur (generate_series), saat dilimi İstanbul. */
async function dailyRevenue(days: number, offsetDays = 0): Promise<DailyPoint[]> {
  const rows = await db.$queryRaw<{ day: string; revenue: bigint; orders: bigint }[]>`
    WITH bounds AS (
      SELECT ((now() AT TIME ZONE ${TZ})::date - ${offsetDays}::int) AS last_day
    ), series AS (
      SELECT generate_series(last_day - (${days}::int - 1), last_day, interval '1 day')::date AS day
      FROM bounds
    )
    SELECT to_char(s.day, 'YYYY-MM-DD') AS day,
           COALESCE(SUM(o."totalMinor"), 0)::bigint AS revenue,
           COUNT(o.id)::bigint AS orders
    FROM series s
    LEFT JOIN "Order" o
      ON ((o."paidAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ})::date = s.day
     AND o."paymentStatus" = 'CAPTURED'
    GROUP BY s.day
    ORDER BY s.day`;

  return rows.map((row) => ({
    day: row.day,
    revenueMinor: Number(row.revenue),
    orders: Number(row.orders),
  }));
}

function periodStart(days: number, offsetDays = 0) {
  return new Date(Date.now() - (days + offsetDays) * 86_400_000);
}

async function totals(days: number, offsetDays = 0): Promise<Totals> {
  const gte = periodStart(days, offsetDays);
  const lt = periodStart(0, offsetDays);
  const [paid, created, succeeded, failed] = await Promise.all([
    db.order.aggregate({
      where: { paymentStatus: PaymentStatus.CAPTURED, paidAt: { gte, lt } },
      _sum: { totalMinor: true },
      _count: { _all: true },
    }),
    db.order.count({ where: { placedAt: { gte, lt } } }),
    db.orderEvent.count({
      where: { type: OrderEventType.PAYMENT_SUCCEEDED, createdAt: { gte, lt } },
    }),
    db.orderEvent.count({ where: { type: OrderEventType.PAYMENT_FAILED, createdAt: { gte, lt } } }),
  ]);
  return {
    revenueMinor: paid._sum.totalMinor ?? 0,
    orders: paid._count._all,
    created,
    succeeded,
    failed,
  };
}

export async function getAnalytics(days: Period) {
  const since = periodStart(days);
  const [daily, current, previous, topProducts, statusCounts, categoryRows] = await Promise.all([
    dailyRevenue(days),
    totals(days),
    totals(days, days),
    db.orderItem.groupBy({
      by: ["productName"],
      where: { order: { paymentStatus: PaymentStatus.CAPTURED, paidAt: { gte: since } } },
      _sum: { lineTotalMinor: true, quantity: true },
      orderBy: { _sum: { lineTotalMinor: "desc" } },
      take: 6,
    }),
    db.order.groupBy({
      by: ["status"],
      where: { placedAt: { gte: since } },
      _count: { _all: true },
    }),
    db.$queryRaw<{ name: string; revenue: bigint }[]>`
      SELECT c.name, COALESCE(SUM(oi."lineTotalMinor"), 0)::bigint AS revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      JOIN "Product" p ON p.id = oi."productId"
      JOIN "Category" c ON c.id = p."categoryId"
      WHERE o."paymentStatus" = 'CAPTURED' AND o."paidAt" >= ${since}
      GROUP BY c.name
      ORDER BY revenue DESC`,
  ]);

  const derive = (t: Totals) => ({
    ...t,
    aovMinor: t.orders ? Math.round(t.revenueMinor / t.orders) : 0,
    conversion: t.created ? t.orders / t.created : null,
    paymentSuccess: t.succeeded + t.failed ? t.succeeded / (t.succeeded + t.failed) : null,
  });

  return {
    days,
    daily,
    current: derive(current),
    previous: derive(previous),
    topProducts: topProducts.map((row) => ({
      name: row.productName,
      revenueMinor: row._sum.lineTotalMinor ?? 0,
      quantity: row._sum.quantity ?? 0,
    })),
    statusCounts: statusCounts.map((row) => ({ status: row.status, count: row._count._all })),
    categories: categoryRows.map((row) => ({ name: row.name, revenueMinor: Number(row.revenue) })),
  };
}

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
