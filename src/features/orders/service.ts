import "server-only";

import { revalidateTag } from "next/cache";

import { siteConfig } from "@/config/site";
import { commerceConfig } from "@/config/commerce";
import { computeTotals } from "@/features/checkout/pricing";
import type { CheckoutInput } from "@/features/checkout/schema";
import { Prisma } from "@/generated/prisma/client";
import {
  OrderEventType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProductStatus,
} from "@/generated/prisma/enums";
import { CacheTags } from "@/lib/cache";
import { db } from "@/lib/db";
import { createAccessToken, createOrderNumber } from "@/lib/ids";
import { getPaymentService, type PaymentVerification } from "@/services/payment";

import { allowedTransitions } from "./status";

/** Kullanıcıya gösterilebilir iş kuralı hatası (stok, ürün yok, durum geçişi…). */
export class OrderError extends Error {}

const orderForPayment = {
  id: true,
  orderNumber: true,
  accessToken: true,
  idempotencyKey: true,
  email: true,
  phone: true,
  status: true,
  paymentStatus: true,
  totalMinor: true,
  currency: true,
  shippingAddress: true,
  items: { select: { productId: true, productName: true, unitPriceMinor: true, quantity: true } },
} satisfies Prisma.OrderSelect;

export type OrderForPayment = Prisma.OrderGetPayload<{ select: typeof orderForPayment }>;

export function confirmationPath(order: { orderNumber: string; accessToken: string }) {
  return `/siparis/${order.orderNumber}?t=${encodeURIComponent(order.accessToken)}`;
}

/** Stok değişen ürünlerin ISR sayfalarını (stok rozeti, "tükendi") arka planda tazele. */
function revalidateProducts(slugs: (string | null | undefined)[]) {
  for (const slug of new Set(slugs.filter(Boolean) as string[])) {
    revalidateTag(CacheTags.product(slug), "max");
  }
  revalidateTag(CacheTags.products, "max");
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

type Tx = Prisma.TransactionClient;

/** Kalemleri productId sırasıyla kilitler → eşzamanlı siparişlerde deadlock olmaz. */
async function restock(tx: Tx, items: { productId: string | null; quantity: number }[]) {
  const sorted = [...items].sort((a, b) => (a.productId ?? "").localeCompare(b.productId ?? ""));
  for (const item of sorted) {
    if (!item.productId) continue;
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

// -----------------------------------------------------------------------------
//  Sipariş oluşturma
// -----------------------------------------------------------------------------

/**
 * Sepetten sipariş oluşturur ve stoğu **rezerve eder**.
 *
 *  - Fiyat, KDV ve ad sunucudan okunur; istemciden yalnızca ürün kimliği + adet gelir.
 *  - Stok düşümü koşullu (`stock >= adet`) tek bir UPDATE: satır kilidiyle atomik,
 *    aynı son ürüne aynı anda iki sipariş gelirse yalnızca biri başarılı olur.
 *  - `idempotencyKey`: çift tıklama / ağ tekrarı aynı siparişi döndürür.
 */
export async function createOrder(input: CheckoutInput, userId?: string | null) {
  const existing = await db.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: orderForPayment,
  });
  if (existing) return existing;

  const quantities = new Map<string, number>();
  for (const item of input.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  const products = await db.product.findMany({
    where: { id: { in: [...quantities.keys()] }, status: ProductStatus.ACTIVE },
    select: {
      id: true,
      slug: true,
      name: true,
      sku: true,
      priceMinor: true,
      vatRate: true,
      currency: true,
      images: {
        where: { kind: "GALLERY" },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { url: true },
      },
    },
    orderBy: { id: "asc" },
  });

  if (products.length !== quantities.size) {
    throw new OrderError("Sepetinizdeki bazı ürünler artık satışta değil. Sepeti güncelleyin.");
  }

  const lines = products.map((product) => {
    const quantity = quantities.get(product.id)!;
    return {
      product,
      quantity,
      unitPriceMinor: product.priceMinor,
      vatRate: product.vatRate,
      lineTotalMinor: product.priceMinor * quantity,
    };
  });
  const totals = computeTotals(lines);
  const { address } = input;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const order = await db.$transaction(async (tx) => {
        for (const line of lines) {
          const reserved = await tx.product.updateMany({
            where: {
              id: line.product.id,
              status: ProductStatus.ACTIVE,
              stock: { gte: line.quantity },
            },
            data: { stock: { decrement: line.quantity } },
          });
          if (reserved.count !== 1) {
            throw new OrderError(`"${line.product.name}" için yeterli stok kalmadı.`);
          }
        }

        return tx.order.create({
          data: {
            orderNumber: createOrderNumber(),
            accessToken: createAccessToken(),
            idempotencyKey: input.idempotencyKey,
            userId: userId ?? null,
            email: input.email,
            phone: input.phone,
            currency: commerceConfig.currency,
            ...totals,
            shippingAddress: address,
            customerNote: input.note,
            items: {
              create: lines.map((line) => ({
                productId: line.product.id,
                productName: line.product.name,
                sku: line.product.sku,
                imageUrl: line.product.images[0]?.url ?? null,
                unitPriceMinor: line.unitPriceMinor,
                vatRate: line.vatRate,
                quantity: line.quantity,
                lineTotalMinor: line.lineTotalMinor,
              })),
            },
            events: {
              create: {
                type: OrderEventType.CREATED,
                message: `Sipariş oluşturuldu, stok ${commerceConfig.paymentWindowMinutes} dk rezerve edildi.`,
                actor: userId ? "customer" : "guest",
              },
            },
          },
          select: orderForPayment,
        });
      });

      revalidateProducts(products.map((product) => product.slug));
      return order;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Aynı idempotencyKey ile eşzamanlı istek kazandıysa onu döndür;
      // değilse sipariş numarası çakışmıştır (çok nadir) → yeni numarayla tekrar dene.
      const winner = await db.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: orderForPayment,
      });
      if (winner) return winner;
    }
  }
  throw new OrderError("Sipariş oluşturulamadı, lütfen tekrar deneyin.");
}

// -----------------------------------------------------------------------------
//  Ödeme
// -----------------------------------------------------------------------------

const providerEnum: Record<string, PaymentProvider> = {
  mock: PaymentProvider.MOCK,
  iyzico: PaymentProvider.IYZICO,
  paytr: PaymentProvider.PAYTR,
  stripe: PaymentProvider.STRIPE,
};

export async function startPayment(order: OrderForPayment, buyerIp: string) {
  if (order.paymentStatus === PaymentStatus.CAPTURED) {
    return { kind: "completed" as const, providerReference: "", status: "CAPTURED" as const };
  }
  if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.AWAITING_PAYMENT) {
    throw new OrderError("Bu sipariş için ödeme alınamaz.");
  }

  const payment = getPaymentService();
  const attempt = await db.orderEvent.count({
    where: { orderId: order.id, type: OrderEventType.PAYMENT_STARTED },
  });
  const address = order.shippingAddress as CheckoutInput["address"];

  const result = await payment.createPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amountMinor: order.totalMinor,
    currency: order.currency,
    buyer: {
      email: order.email,
      fullName: address.fullName,
      phone: order.phone ?? undefined,
      ip: buyerIp,
    },
    shippingAddress: { ...address, country: "TR" },
    items: order.items.map((item) => ({
      id: item.productId ?? item.productName,
      name: item.productName,
      category: "Genel",
      unitPriceMinor: item.unitPriceMinor,
      quantity: item.quantity,
    })),
    callbackUrl: new URL("/api/payment/callback", siteConfig.url).toString(),
    // Her deneme ayrı anahtar: POS tarafında da mükerrer çekim engellenir.
    idempotencyKey: `${order.idempotencyKey ?? order.id}-${attempt + 1}`,
  });

  await db.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.AWAITING_PAYMENT,
      paymentProvider: providerEnum[payment.provider],
      paymentReference: result.providerReference,
      events: {
        create: {
          type: OrderEventType.PAYMENT_STARTED,
          message: `Ödeme başlatıldı (${payment.provider}, deneme ${attempt + 1}).`,
        },
      },
    },
  });

  return result;
}

/**
 * POS dönüşünü siparişe uygular. Hem tarayıcı yönlendirmesi hem sunucudan
 * sunucuya webhook aynı sonucu iki kez getirebilir → işlem idempotenttir.
 */
export async function applyPaymentVerification(verification: PaymentVerification) {
  if (!verification.orderId) return null;

  const order = await db.order.findUnique({
    where: { id: verification.orderId },
    select: {
      id: true,
      orderNumber: true,
      accessToken: true,
      status: true,
      paymentStatus: true,
      totalMinor: true,
      currency: true,
      paymentReference: true,
    },
  });
  if (!order) return null;

  // İmza/format hatası: siparişe dokunma (saldırgan bir siparişi "başarısız" yapamasın).
  if (!verification.ok && verification.code === "INVALID") return order;
  if (order.paymentStatus === PaymentStatus.CAPTURED) return order;

  if (!verification.ok) {
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        paymentFailureReason: verification.reason,
        events: { create: { type: OrderEventType.PAYMENT_FAILED, message: verification.reason } },
      },
    });
    return order;
  }

  if (verification.amountMinor !== order.totalMinor) {
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        paymentFailureReason: "Tahsil edilen tutar sipariş tutarıyla uyuşmuyor.",
        events: {
          create: {
            type: OrderEventType.PAYMENT_FAILED,
            message: `Tutar uyuşmazlığı: beklenen ${order.totalMinor}, gelen ${verification.amountMinor}.`,
            data: { expected: order.totalMinor, received: verification.amountMinor },
          },
        },
      },
    });
    return order;
  }

  // Rezervasyon süresi dolup iptal edilmiş bir siparişe geç gelen ödeme → otomatik iade.
  if (order.status === OrderStatus.CANCELLED) {
    const refund = await getPaymentService().refund({
      providerReference: verification.providerReference,
      amountMinor: verification.amountMinor,
      currency: order.currency,
      reason: "Süresi dolmuş sipariş",
    });
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: refund.ok ? PaymentStatus.REFUNDED : PaymentStatus.CAPTURED,
        refundedAt: refund.ok ? new Date() : null,
        events: {
          create: {
            type: OrderEventType.REFUNDED,
            message: refund.ok
              ? "İptal edilmiş siparişe gelen ödeme otomatik iade edildi."
              : `Otomatik iade başarısız: ${refund.reason}. Manuel iade gerekli.`,
          },
        },
      },
    });
    return order;
  }

  // Koşullu güncelleme: eşzamanlı iki callback'ten yalnızca biri işler.
  await db.order.updateMany({
    where: { id: order.id, paymentStatus: { not: PaymentStatus.CAPTURED } },
    data: {
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.CAPTURED,
      paymentReference: verification.providerReference,
      paymentFailureReason: null,
      paidAt: new Date(),
    },
  });
  await db.orderEvent.create({
    data: {
      orderId: order.id,
      type: OrderEventType.PAYMENT_SUCCEEDED,
      message: "Ödeme tahsil edildi.",
      data: { providerReference: verification.providerReference },
    },
  });
  return { ...order, status: OrderStatus.PAID, paymentStatus: PaymentStatus.CAPTURED };
}

// -----------------------------------------------------------------------------
//  Rezervasyon süresi, iptal, durum geçişi, iade
// -----------------------------------------------------------------------------

/** Ödeme penceresi dolmuş siparişleri iptal edip stoğu geri bırakır (cron). */
export async function releaseExpiredOrders(now = new Date()) {
  const cutoff = new Date(now.getTime() - commerceConfig.paymentWindowMinutes * 60_000);
  const expired = await db.order.findMany({
    where: {
      status: { in: [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT] },
      paymentStatus: { not: PaymentStatus.CAPTURED },
      placedAt: { lt: cutoff },
    },
    select: { id: true },
    take: 200,
  });

  const slugs: string[] = [];
  for (const { id } of expired) {
    await db.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id, status: { in: [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT] } },
        data: { status: OrderStatus.CANCELLED, cancelledAt: now },
      });
      if (claimed.count !== 1) return;
      const items = await tx.orderItem.findMany({
        where: { orderId: id },
        select: { productId: true, quantity: true, product: { select: { slug: true } } },
      });
      await restock(tx, items);
      await tx.orderEvent.create({
        data: {
          orderId: id,
          type: OrderEventType.STATUS_CHANGED,
          message: "Ödeme süresi doldu; sipariş iptal edildi, stok serbest bırakıldı.",
        },
      });
      slugs.push(...items.map((item) => item.product?.slug ?? ""));
    });
  }

  if (slugs.length) revalidateProducts(slugs);
  return { released: expired.length };
}

type StatusChange = {
  orderId: string;
  to: OrderStatus;
  actor: string;
  carrier?: string;
  trackingNumber?: string;
  note?: string;
};

export async function changeOrderStatus({
  orderId,
  to,
  actor,
  carrier,
  trackingNumber,
  note,
}: StatusChange) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentReference: true,
      totalMinor: true,
      currency: true,
      items: { select: { productId: true, quantity: true, product: { select: { slug: true } } } },
    },
  });
  if (!order) throw new OrderError("Sipariş bulunamadı.");
  if (!allowedTransitions[order.status]?.includes(to)) {
    throw new OrderError("Bu durum geçişine izin verilmiyor.");
  }
  if (to === OrderStatus.SHIPPED && !trackingNumber) {
    throw new OrderError("Kargoya vermek için takip numarası gerekli.");
  }

  let refundMessage = "";
  if (to === OrderStatus.CANCELLED && order.paymentStatus === PaymentStatus.CAPTURED) {
    const refund = await getPaymentService().refund({
      providerReference: order.paymentReference ?? "",
      amountMinor: order.totalMinor,
      currency: order.currency,
      reason: note ?? "Sipariş iptali",
    });
    if (!refund.ok) throw new OrderError(`İade yapılamadı: ${refund.reason}`);
    refundMessage = ` Ödeme iade edildi (${refund.refundReference}).`;
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: {
        status: to,
        ...(to === OrderStatus.SHIPPED && { shippedAt: now, carrier, trackingNumber }),
        ...(to === OrderStatus.DELIVERED && { deliveredAt: now }),
        ...(to === OrderStatus.CANCELLED && {
          cancelledAt: now,
          ...(refundMessage && { paymentStatus: PaymentStatus.REFUNDED, refundedAt: now }),
        }),
      },
    });
    if (claimed.count !== 1)
      throw new OrderError("Sipariş bu sırada güncellendi, sayfayı yenileyin.");
    if (to === OrderStatus.CANCELLED) await restock(tx, order.items);
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: refundMessage ? OrderEventType.REFUNDED : OrderEventType.STATUS_CHANGED,
        message: `${order.status} → ${to}.${refundMessage}${note ? ` Not: ${note}` : ""}`,
        actor,
        data: carrier || trackingNumber ? { carrier, trackingNumber } : undefined,
      },
    });
  });

  if (to === OrderStatus.CANCELLED) revalidateProducts(order.items.map((i) => i.product?.slug));
}

/** Teslim edilmiş/kargodaki sipariş için iade (ürün iadesi). */
export async function refundOrder({
  orderId,
  actor,
  restockItems,
  note,
}: {
  orderId: string;
  actor: string;
  restockItems: boolean;
  note?: string;
}) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentReference: true,
      totalMinor: true,
      currency: true,
      items: { select: { productId: true, quantity: true, product: { select: { slug: true } } } },
    },
  });
  if (!order) throw new OrderError("Sipariş bulunamadı.");
  if (order.paymentStatus !== PaymentStatus.CAPTURED)
    throw new OrderError("İade edilecek tahsilat yok.");
  if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.DELIVERED) {
    throw new OrderError("Kargolanmamış siparişler iade yerine iptal edilir.");
  }

  const refund = await getPaymentService().refund({
    providerReference: order.paymentReference ?? "",
    amountMinor: order.totalMinor,
    currency: order.currency,
    reason: note,
  });
  if (!refund.ok) throw new OrderError(`İade yapılamadı: ${refund.reason}`);

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.REFUNDED,
        paymentStatus: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });
    if (restockItems) await restock(tx, order.items);
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: OrderEventType.REFUNDED,
        message: `Tutar iade edildi (${refund.refundReference}).${restockItems ? " Ürünler stoğa geri alındı." : ""}${note ? ` Not: ${note}` : ""}`,
        actor,
      },
    });
  });

  if (restockItems) revalidateProducts(order.items.map((i) => i.product?.slug));
}
