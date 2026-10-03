import "server-only";

import { OrderStatus, ProductStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

const paidStatuses = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

/** Panel verisi önbelleğe alınmaz: yönetici her zaman güncel durumu görür. */
export async function getDashboard() {
  const [activeProducts, lowStock, pendingOrders, revenue, banners, recentOrders] =
    await Promise.all([
      db.product.count({ where: { status: ProductStatus.ACTIVE } }),
      db.product.findMany({
        where: {
          status: ProductStatus.ACTIVE,
          stock: { lte: db.product.fields.lowStockThreshold },
        },
        orderBy: { stock: "asc" },
        take: 8,
        select: { id: true, name: true, sku: true, stock: true, lowStockThreshold: true },
      }),
      db.order.count({
        where: { status: { in: [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT] } },
      }),
      db.order.aggregate({ where: { status: { in: paidStatuses } }, _sum: { totalMinor: true } }),
      db.showcaseBanner.findMany({
        orderBy: [{ placement: "asc" }, { sortOrder: "asc" }],
        select: { id: true, key: true, title: true, template: true, isActive: true, layers: true },
      }),
      db.order.findMany({
        orderBy: { placedAt: "desc" },
        take: 6,
        select: {
          id: true,
          orderNumber: true,
          email: true,
          status: true,
          totalMinor: true,
          currency: true,
        },
      }),
    ]);

  return {
    activeProducts,
    lowStock,
    pendingOrders,
    revenueMinor: revenue._sum.totalMinor ?? 0,
    banners,
    recentOrders,
  };
}
