import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { OrderStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const ORDER_PAGE_SIZE = 25;

export async function listOrders({
  q,
  status,
  page = 1,
}: {
  q?: string;
  status?: string;
  page?: number;
}) {
  const where: Prisma.OrderWhereInput = {
    ...(q && {
      OR: [
        { orderNumber: { contains: q.toUpperCase() } },
        { email: { contains: q, mode: "insensitive" } },
        { trackingNumber: { contains: q } },
      ],
    }),
    ...(status &&
      Object.values(OrderStatus).includes(status as OrderStatus) && {
        status: status as OrderStatus,
      }),
  };

  const [total, rows, counts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * ORDER_PAGE_SIZE,
      take: ORDER_PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        email: true,
        status: true,
        paymentStatus: true,
        totalMinor: true,
        currency: true,
        placedAt: true,
        shippingAddress: true,
        _count: { select: { items: true } },
      },
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return {
    total,
    rows,
    pages: Math.max(1, Math.ceil(total / ORDER_PAGE_SIZE)),
    counts: Object.fromEntries(counts.map((row) => [row.status, row._count._all])) as Partial<
      Record<OrderStatus, number>
    >,
  };
}

export function getOrderDetail(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { productName: "asc" },
        include: { product: { select: { id: true, slug: true } } },
      },
      events: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
