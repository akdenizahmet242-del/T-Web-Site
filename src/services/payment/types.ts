/**
 * Ödeme sağlayıcılarından bağımsız sözleşme.
 *
 * İyzico (Checkout Form / 3DS), PayTR (iFrame API) ve Stripe (Checkout/PaymentIntent)
 * akışlarının ortak paydası:
 *   1. createPayment → kullanıcıyı yönlendir / iframe/HTML içerik göster
 *   2. sağlayıcı callback/webhook → verifyCallback ile imza + tutar doğrula
 *   3. gerekirse refund
 *
 * Uygulama kodu yalnızca bu arayüzü bilir; sağlayıcı .env'den seçilir.
 */

export type PaymentProviderId = "mock" | "iyzico" | "paytr" | "stripe";

export type PaymentLineItem = {
  id: string;
  name: string;
  category: string;
  unitPriceMinor: number;
  quantity: number;
};

export type PaymentBuyer = {
  id?: string;
  email: string;
  fullName: string;
  phone?: string;
  /** İyzico ve PayTR zorunlu tutar. */
  ip: string;
  identityNumber?: string;
};

export type PaymentAddress = {
  fullName: string;
  line1: string;
  line2?: string;
  district?: string;
  city: string;
  postalCode?: string;
  country: string;
};

export type CreatePaymentInput = {
  orderId: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  /** Taksit (yalnızca TR POS'ları) */
  installment?: number;
  buyer: PaymentBuyer;
  shippingAddress: PaymentAddress;
  billingAddress?: PaymentAddress;
  items: PaymentLineItem[];
  /** Sağlayıcının kullanıcıyı geri göndereceği adres */
  callbackUrl: string;
  /** Mükerrer çekim koruması — Order.idempotencyKey ile aynı değer */
  idempotencyKey: string;
};

export type CreatePaymentResult =
  | { kind: "redirect"; providerReference: string; redirectUrl: string }
  | { kind: "embedded"; providerReference: string; html: string }
  | { kind: "completed"; providerReference: string; status: "AUTHORIZED" | "CAPTURED" };

export type PaymentCallback = {
  /** Sağlayıcının gönderdiği ham gövde (form-urlencoded veya JSON) */
  body: Record<string, string>;
  headers: Record<string, string>;
};

export type PaymentVerification =
  | {
      ok: true;
      orderId: string;
      providerReference: string;
      amountMinor: number;
      status: "AUTHORIZED" | "CAPTURED";
    }
  | {
      ok: false;
      orderId?: string;
      reason: string;
      /** DECLINED: banka reddetti (sipariş "ödeme başarısız" olur) · INVALID: imza/format hatası (sipariş değiştirilmez) */
      code: "DECLINED" | "INVALID";
    };

export type RefundInput = {
  providerReference: string;
  amountMinor: number;
  currency: string;
  reason?: string;
};

export type RefundResult = { ok: true; refundReference: string } | { ok: false; reason: string };

export interface PaymentService {
  readonly provider: PaymentProviderId;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyCallback(callback: PaymentCallback): Promise<PaymentVerification>;
  refund(input: RefundInput): Promise<RefundResult>;
}

export class PaymentProviderNotConfiguredError extends Error {
  constructor(provider: PaymentProviderId) {
    super(
      `"${provider}" ödeme sağlayıcısı henüz yapılandırılmadı. Geliştirmede PAYMENT_PROVIDER="mock" kullanın.`,
    );
    this.name = "PaymentProviderNotConfiguredError";
  }
}
