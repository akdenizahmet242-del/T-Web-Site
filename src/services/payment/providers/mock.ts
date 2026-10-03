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
 * Geliştirme / test sağlayıcısı. Gerçek POS akışını (yönlendirme → callback)
 * taklit eder; hiçbir dış servise istek atmaz ve durum tutmaz (HMR/çoklu
 * instance güvenli). Gerçek sağlayıcılarda callback mutlaka imzayla doğrulanır.
 *
 * Test senaryosu: tutarın kuruş kısmı 13 ise (ör. 100,13 TL) ödeme reddedilir.
 */
export class MockPaymentService implements PaymentService {
  readonly provider = "mock" as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const providerReference = `mock_${input.idempotencyKey}`;

    const url = new URL(input.callbackUrl);
    url.searchParams.set("ref", providerReference);
    url.searchParams.set("orderId", input.orderId);
    url.searchParams.set("amount", String(input.amountMinor));
    url.searchParams.set("status", input.amountMinor % 100 === 13 ? "failed" : "success");

    return { kind: "redirect", providerReference, redirectUrl: url.toString() };
  }

  async verifyCallback({ body }: PaymentCallback): Promise<PaymentVerification> {
    const { ref, orderId, amount, status } = body;
    const amountMinor = Number(amount);

    if (!ref?.startsWith("mock_") || !orderId || !Number.isInteger(amountMinor)) {
      return { ok: false, orderId, reason: "Geçersiz mock callback." };
    }
    if (status !== "success") {
      return { ok: false, orderId, reason: "Banka işlemi reddetti (mock)." };
    }
    return { ok: true, orderId, providerReference: ref, amountMinor, status: "CAPTURED" };
  }

  async refund({ providerReference }: RefundInput): Promise<RefundResult> {
    return { ok: true, refundReference: `${providerReference}_refund` };
  }
}
