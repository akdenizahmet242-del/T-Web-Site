"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";

import { auth } from "@/auth";
import { confirmationPath, createOrder, OrderError, startPayment } from "@/features/orders/service";
import { db } from "@/lib/db";
import { rateLimits } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

import { checkoutFormToObject, checkoutSchema } from "./schema";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectUrl?: string;
};

function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}

export async function placeOrderAction(
  _previous: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const ip = await getClientIp();
  const limited = await rateLimits.checkout.limit(ip);
  if (!limited.ok)
    return { error: "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin." };

  const parsed = checkoutSchema.safeParse(checkoutFormToObject(formData));
  if (!parsed.success) {
    return {
      error: "Lütfen işaretli alanları kontrol edin.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    const session = await auth();
    const order = await createOrder(parsed.data, session?.user?.id);
    const payment = await startPayment(order, ip);

    if (payment.kind === "redirect") return { redirectUrl: payment.redirectUrl };
    if (payment.kind === "completed") return { redirectUrl: confirmationPath(order) };
    // Gömülü form (iyzico Checkout Form / PayTR iFrame) Faz 3'te /odeme/pos sayfasında çizilecek.
    return { error: "Seçili ödeme sağlayıcısının gömülü formu henüz desteklenmiyor." };
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    throw error;
  }
}

/** Başarısız ödemeden sonra aynı sipariş için yeniden ödeme (rezervasyon süresi içinde). */
export async function retryPaymentAction(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const token = String(formData.get("token") ?? "");

  const order = await db.order.findFirst({
    where: { orderNumber, accessToken: token },
    select: {
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
      items: {
        select: { productId: true, productName: true, unitPriceMinor: true, quantity: true },
      },
    },
  });
  if (!order) redirect("/");

  let target = confirmationPath(order);
  try {
    const payment = await startPayment(order, await getClientIp());
    if (payment.kind === "redirect") target = payment.redirectUrl;
  } catch (error) {
    if (!(error instanceof OrderError)) throw error;
  }
  redirect(target);
}
