import { NextResponse } from "next/server";

import { auth } from "@/auth";
import type { CartLine } from "@/features/cart/cart-store";
import { cartSyncRequestSchema } from "@/features/cart/schema";
import { ProductStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

const MAX_QUANTITY = 99;

async function readCart(userId: string): Promise<CartLine[]> {
  const items = await db.cartItem.findMany({
    where: { userId, product: { status: ProductStatus.ACTIVE } },
    orderBy: { createdAt: "asc" },
    select: {
      quantity: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          priceMinor: true,
          currency: true,
          stock: true,
          category: { select: { name: true } },
          images: { where: { kind: "GALLERY" }, orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
    },
  });

  return items
    .filter(({ product }) => product.stock > 0)
    .map(({ quantity, product }) => {
      const maxQuantity = Math.min(product.stock, MAX_QUANTITY);
      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category.name,
        // Fiyat her zaman sunucudan gelir; istemcinin gönderdiği fiyata güvenilmez.
        priceMinor: product.priceMinor,
        currency: product.currency,
        imageUrl: product.images[0]?.url ?? null,
        quantity: Math.min(quantity, maxQuantity),
        maxQuantity,
      };
    });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json({ lines: await readCart(session.user.id) });
}

export async function PUT(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = cartSyncRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { mode, items } = parsed.data;

  const products = await db.product.findMany({
    where: { id: { in: items.map((item) => item.productId) }, status: ProductStatus.ACTIVE },
    select: { id: true },
  });
  const known = new Set(products.map((product) => product.id));
  const valid = items.filter((item) => known.has(item.productId));

  await db.$transaction(async (tx) => {
    if (mode === "replace") {
      await tx.cartItem.deleteMany({
        where: { userId, productId: { notIn: valid.map((item) => item.productId) } },
      });
    }

    const existing =
      mode === "merge"
        ? new Map(
            (
              await tx.cartItem.findMany({
                where: { userId },
                select: { productId: true, quantity: true },
              })
            ).map((row) => [row.productId, row.quantity]),
          )
        : new Map<string, number>();

    for (const { productId, quantity } of valid) {
      // merge: aynı ürün iki cihazda varsa büyük adet kazanır (kullanıcı ürünü kaybetmez).
      const next = Math.max(quantity, existing.get(productId) ?? 0);
      await tx.cartItem.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, quantity: next },
        update: { quantity: next },
      });
    }
  });

  return NextResponse.json({ lines: await readCart(userId) });
}
