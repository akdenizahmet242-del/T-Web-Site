import "server-only";

import { MockPaymentService } from "./providers/mock";
import { PendingPaymentService } from "./providers/pending";
import type { PaymentProviderId, PaymentService } from "./types";

export type * from "./types";

const providers: PaymentProviderId[] = ["mock", "iyzico", "paytr", "stripe"];

function readProvider(): PaymentProviderId {
  const value = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  if (!providers.includes(value as PaymentProviderId)) {
    throw new Error(`PAYMENT_PROVIDER "${value}" geçersiz. Seçenekler: ${providers.join(", ")}`);
  }
  return value as PaymentProviderId;
}

let instance: PaymentService | undefined;

/** Uygulamanın tek ödeme giriş noktası. */
export function getPaymentService(): PaymentService {
  if (!instance) {
    const provider = readProvider();
    instance = provider === "mock" ? new MockPaymentService() : new PendingPaymentService(provider);
  }
  return instance;
}
