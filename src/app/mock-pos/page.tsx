import { CreditCard, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { signMockResult, type MockPaymentResult } from "@/services/payment/providers/mock";

export const metadata: Metadata = { title: "Test POS · 3D Secure", robots: { index: false } };

/**
 * Sahte banka 3D Secure sayfası (yalnızca PAYMENT_PROVIDER=mock).
 * Gerçek akışta kullanıcı bu noktada bankanın sayfasındadır; bu sayfa,
 * imzalı callback üretimini ve başarılı/başarısız senaryoları test etmeyi sağlar.
 */
export default async function MockPosPage({ searchParams }: PageProps<"/mock-pos">) {
  if ((process.env.PAYMENT_PROVIDER ?? "mock") !== "mock") notFound();

  const params = await searchParams;
  const read = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const ref = read("ref");
  const orderId = read("orderId");
  const orderNumber = read("orderNumber");
  const currency = read("currency") || "TRY";
  const amount = Number(read("amount"));
  if (!ref.startsWith("mock_") || !orderId || !Number.isInteger(amount)) notFound();

  const link = (status: MockPaymentResult) => {
    const url = new URLSearchParams({ ref, orderId, amount: String(amount), status });
    url.set("sig", signMockResult(ref, orderId, amount, status));
    return `/api/payment/callback?${url.toString()}`;
  };
  // Test senaryosu: kuruş kısmı 13 olan tutarlarda banka "onay"ı da reddeder.
  const bankDeclines = amount % 100 === 13;

  return (
    <main className="grid min-h-svh place-items-center bg-[#f4f4f5] px-5 text-zinc-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-5 text-emerald-600" /> 3D Secure Doğrulama
          </p>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            TEST POS
          </span>
        </div>
        <dl className="mt-8 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">İşyeri</dt>
            <dd>T Atelier</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Sipariş</dt>
            <dd className="font-mono">{orderNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Kart</dt>
            <dd className="flex items-center gap-1.5">
              <CreditCard className="size-4" /> **** **** **** 4242
            </dd>
          </div>
          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <dt>Tutar</dt>
            <dd className="tabular-nums">{formatMoney(amount, currency)}</dd>
          </div>
        </dl>
        <p className="mt-6 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500">
          Bu sayfa gerçek bir banka değildir; kart bilgisi istemez. Kuruş kısmı 13 olan tutarlar
          (ör. 100,13 TL) banka tarafından reddedilir.
        </p>
        <div className="mt-6 grid gap-3">
          <a
            href={link(bankDeclines ? "failed" : "success")}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-emerald-600 text-white hover:bg-emerald-700",
            )}
          >
            Ödemeyi onayla
          </a>
          <a
            href={link("failed")}
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "bg-white text-zinc-900 hover:bg-zinc-100",
            )}
          >
            Reddet
          </a>
        </div>
      </div>
    </main>
  );
}
