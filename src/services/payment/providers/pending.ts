import {
  PaymentProviderNotConfiguredError,
  type PaymentProviderId,
  type PaymentService,
} from "../types";

/**
 * Canlı POS entegrasyonları son aşamaya bırakıldı. Bu sınıf, seçilen sağlayıcı
 * henüz uygulanmamışken uygulamanın açık bir hata mesajıyla durmasını sağlar.
 *
 * Gerçek uygulama eklerken (ör. `iyzico.ts`):
 *   - createPayment  → Checkout Form initialize / PayTR get-token / Stripe Checkout Session
 *   - verifyCallback → HMAC imza + tutar + sipariş eşleşmesi doğrulaması
 *   - refund         → iade API'si
 * ve `index.ts` içindeki fabrikada bu sınıfın yerine geçirin.
 */
export class PendingPaymentService implements PaymentService {
  constructor(readonly provider: Exclude<PaymentProviderId, "mock">) {}

  createPayment(): never {
    throw new PaymentProviderNotConfiguredError(this.provider);
  }

  verifyCallback(): never {
    throw new PaymentProviderNotConfiguredError(this.provider);
  }

  refund(): never {
    throw new PaymentProviderNotConfiguredError(this.provider);
  }
}
