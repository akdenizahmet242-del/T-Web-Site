import type { Metadata } from "next";

import { CheckoutSummary } from "@/features/checkout/checkout-summary";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 pt-32 pb-28 sm:px-8">
      <h1 className="font-display text-6xl">Ödeme</h1>
      <p className="mt-4 text-muted-foreground">
        Adres, kargo ve ödeme adımları bir sonraki fazda <code>PaymentService</code> (şimdilik
        <code> mock</code> sağlayıcı) üzerinden bu sayfaya bağlanacak.
      </p>
      <CheckoutSummary />
    </section>
  );
}
