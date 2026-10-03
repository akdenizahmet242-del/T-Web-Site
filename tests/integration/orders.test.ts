import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Next.js çalışma zamanı dışında: önbellek invalidation'ı no-op
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("sipariş servisi (gerçek PostgreSQL)", async () => {
  const { db } = await import("@/lib/db");
  const { createOrder, OrderError, releaseExpiredOrders } =
    await import("@/features/orders/service");

  const sku = `TEST-${Date.now().toString(36).toUpperCase()}`;
  let productId = "";

  const input = (idempotencyKey: string, quantity = 1) => ({
    email: "yaris@example.com",
    phone: "05321234567",
    address: {
      fullName: "Yarış Testi",
      line1: "Test Mah. No: 1",
      district: "Kadıköy",
      city: "İstanbul",
      country: "TR" as const,
    },
    acceptTerms: "on" as const,
    idempotencyKey,
    items: [{ productId, quantity }],
  });

  beforeAll(async () => {
    const category = await db.category.findFirstOrThrow({ select: { id: true } });
    ({ id: productId } = await db.product.create({
      data: {
        slug: sku.toLowerCase(),
        sku,
        name: "Yarış Testi Ürünü",
        description: "Eşzamanlılık testi için geçici ürün.",
        priceMinor: 10_000,
        stock: 1,
        status: "ACTIVE",
        categoryId: category.id,
      },
      select: { id: true },
    }));
  });

  afterAll(async () => {
    await db.order.deleteMany({ where: { email: "yaris@example.com" } });
    await db.product.deleteMany({ where: { sku } });
    await db.$disconnect();
  });

  it("son 1 adede aynı anda gelen 10 siparişten yalnızca biri başarılı olur", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => createOrder(input(randomUUID()))),
    );

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(9);
    for (const result of rejected) {
      expect((result as PromiseRejectedResult).reason).toBeInstanceOf(OrderError);
    }

    const product = await db.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stock: true },
    });
    expect(product.stock).toBe(0); // asla negatife düşmez
  });

  it("aynı idempotency anahtarı aynı siparişi döndürür (çift tıklama)", async () => {
    await db.product.update({ where: { id: productId }, data: { stock: 5 } });
    const key = randomUUID();
    const [first, second] = await Promise.all([createOrder(input(key)), createOrder(input(key))]);
    expect(second.id).toBe(first.id);

    const product = await db.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stock: true },
    });
    expect(product.stock).toBe(4); // yalnızca bir kez rezerve edildi
  });

  it("ödeme süresi dolan sipariş iptal edilir ve stok geri bırakılır", async () => {
    const before = await db.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stock: true },
    });
    const order = await createOrder(input(randomUUID(), 2));
    await db.order.update({
      where: { id: order.id },
      data: { placedAt: new Date(Date.now() - 2 * 3_600_000) },
    });

    await releaseExpiredOrders();

    const [after, cancelled] = await Promise.all([
      db.product.findUniqueOrThrow({ where: { id: productId }, select: { stock: true } }),
      db.order.findUniqueOrThrow({ where: { id: order.id }, select: { status: true } }),
    ]);
    expect(cancelled.status).toBe("CANCELLED");
    expect(after.stock).toBe(before.stock);
  });
});
