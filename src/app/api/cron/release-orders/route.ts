import { NextResponse } from "next/server";

import { releaseExpiredOrders } from "@/features/orders/service";

/**
 * Ödeme penceresi dolan siparişlerin stok rezervasyonunu bırakır.
 * Vercel Cron, GitHub Actions veya k8s CronJob ile 5 dakikada bir çağırın:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" $SITE/api/cron/release-orders
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await releaseExpiredOrders());
}
