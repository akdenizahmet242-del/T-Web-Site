import { NextResponse } from "next/server";

import { siteConfig } from "@/config/site";
import { applyPaymentVerification, confirmationPath } from "@/features/orders/service";
import { getPaymentService } from "@/services/payment";

/**
 * POS dönüş adresi. Sağlayıcıya göre GET (yönlendirme) ya da POST (form post /
 * webhook) ile gelir; ikisi de aynı doğrulama → idempotent sipariş güncellemesi.
 * Doğrulama (imza, tutar, sipariş eşleşmesi) her zaman sunucuda yapılır.
 */
async function handle(request: Request) {
  const url = new URL(request.url);
  const body: Record<string, string> = Object.fromEntries(url.searchParams);

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      for (const [key, value] of Object.entries(json)) body[key] = String(value);
    } else {
      const form = await request.formData().catch(() => null);
      form?.forEach((value, key) => {
        if (typeof value === "string") body[key] = value;
      });
    }
  }

  const verification = await getPaymentService().verifyCallback({
    body,
    headers: Object.fromEntries(request.headers),
  });
  const order = await applyPaymentVerification(verification);

  const target = order ? confirmationPath(order) : "/odeme?odeme=hata";
  // 303: POST'tan sonra tarayıcı hedefi GET ile açar.
  return NextResponse.redirect(new URL(target, siteConfig.url), 303);
}

export const GET = handle;
export const POST = handle;
