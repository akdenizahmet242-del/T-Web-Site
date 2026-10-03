import type { Metadata } from "next";

import { CheckoutForm } from "@/features/checkout/checkout-form";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-32 pb-28 sm:px-8">
      <p className="font-mono text-[11px] tracking-[0.25em] text-brass uppercase">Güvenli ödeme</p>
      <h1 className="mt-3 font-display text-6xl">Ödeme</h1>
      <CheckoutForm />
    </section>
  );
}
