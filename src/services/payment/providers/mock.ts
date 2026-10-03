import { createHmac, timingSafeEqual } from "node:crypto";

import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentCallback,
  PaymentService,
  PaymentVerification,
  RefundInput,
  RefundResult,
} from "../types";

/**
 * Geliştirme / test sağlayıcısı. Gerçek 3D Secure akışını birebir taklit eder:
 *
 *   createPayment → /mock-pos (sahte banka sayfası) → kullanıcı onaylar/reddeder
 *   → /api/payment/callback?…&sig=HMAC → verifyCallback imzayı doğrular.
 *
 * Durumsuzdur (HMR / çok instance güvenli) ve dış servise istek atmaz.
 * Test senaryosu: tutarın kuruş kısmı 13 ise (ör. 100,13 TL) banka reddeder.
 */
export type MockPaymentResult = "success" | "failed";

function secret() {
  const value = process.env.MOCK_POS_SECRET || process.env.AUTH_SECRET;
  if (!value) throw new Error("Mock POS imzası için AUTH_SECRET tanımlı olmalı.");
  return value;
}

function payload(ref: string, orderId: string, amount: string, status: string) {
  return `${ref}|${orderId}|${amount}|${status}`;
}

export function signMockResult(
  ref: string,
  orderId: string,
  amount: number,
  status: MockPaymentResult,
) {
  return createHmac("sha256", secret())
    .update(payload(ref, orderId, String(amount), status))
    .digest("base64url");
}

function verifySignature(body: Record<string, string>) {
  const { ref = "", orderId = "", amount = "", status = "", sig = "" } = body;
  const expected = createHmac("sha256", secret())
    .update(payload(ref, orderId, amount, status))
    .digest();
  const received = Buffer.from(sig, "base64url");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export class MockPaymentService implements PaymentService {
  readonly provider = "mock" as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const providerReference = `mock_${input.idempotencyKey}`;

    const url = new URL("/mock-pos", input.callbackUrl);
    url.searchParams.set("ref", providerReference);
    url.searchParams.set("orderId", input.orderId);
    url.searchParams.set("orderNumber", input.orderNumber);
    url.searchParams.set("amount", String(input.amountMinor));
    url.searchParams.set("currency", input.currency);

    return { kind: "redirect", providerReference, redirectUrl: url.toString() };
  }

  async verifyCallback({ body }: PaymentCallback): Promise<PaymentVerification> {
    const { ref, orderId, amount, status } = body;
    const amountMinor = Number(amount);

    if (!ref?.startsWith("mock_") || !orderId || !Number.isInteger(amountMinor)) {
      return { ok: false, orderId, reason: "Geçersiz POS yanıtı.", code: "INVALID" };
    }
    if (!verifySignature(body)) {
      return { ok: false, orderId, reason: "POS imzası doğrulanamadı.", code: "INVALID" };
    }
    if (status !== "success") {
      return {
        ok: false,
        orderId,
        reason: "Banka işlemi reddetti (mock 3D Secure).",
        code: "DECLINED",
      };
    }
    return { ok: true, orderId, providerReference: ref, amountMinor, status: "CAPTURED" };
  }

  async refund({ providerReference }: RefundInput): Promise<RefundResult> {
    return { ok: true, refundReference: `${providerReference}_refund_${Date.now().toString(36)}` };
  }
}
