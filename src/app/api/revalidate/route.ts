import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ tags: z.array(z.string().min(1).max(256)).min(1).max(50) });

/**
 * Harici sistemler (ERP, PIM, stok servisi) için on-demand ISR webhook'u.
 *
 *   curl -X POST $SITE/api/revalidate \
 *     -H "Authorization: Bearer $REVALIDATE_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"tags":["product:meridyen-ceviz-duvar-saati"]}'
 *
 * Panel içi güncellemeler bu uca değil, doğrudan Server Action içindeki
 * `revalidateTag(...)` çağrısına gider.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  // "max": eski sayfa anında servis edilir, yenisi arka planda üretilir (SWR).
  for (const tag of parsed.data.tags) revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: parsed.data.tags, now: Date.now() });
}
