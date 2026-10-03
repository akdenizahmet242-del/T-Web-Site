"use client";

import { Loader2, Lock, Truck } from "lucide-react";
import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { commerceConfig } from "@/config/commerce";
import { useCartHydrated, useCartStore } from "@/features/cart/cart-store";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { uuid } from "@/lib/uuid";

import { placeOrderAction, type CheckoutState } from "./actions";
import { shippingFor } from "./pricing";

function Field({
  name,
  label,
  error,
  className,
  ...props
}: ComponentProps<"input"> & { name: string; label: string; error?: string }) {
  const id = `checkout-${name.replace(".", "-")}`;
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CheckoutForm() {
  const hydrated = useCartHydrated();
  const lines = useCartStore((state) => state.lines);
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    placeOrderAction,
    {},
  );
  // Aynı form oturumunda yeniden gönderimler aynı anahtarı taşır → mükerrer sipariş yok.
  const idempotencyKey = useRef<string | null>(null);
  // Kullanıcı bir alanı düzelttiğinde o alanın eski hatasını hemen gizle.
  // Yeni sunucu yanıtı gelince liste sıfırlanır (render sırasında türetilmiş state).
  const [edited, setEdited] = useState({ for: state, names: new Set<string>() });
  if (edited.for !== state) setEdited({ for: state, names: new Set() });
  const errors = Object.fromEntries(
    Object.entries(state.fieldErrors ?? {}).filter(([name]) => !edited.names.has(name)),
  );
  const markEdited = (event: FormEvent<HTMLFormElement>) => {
    const name = (event.target as HTMLInputElement).name;
    if (state.fieldErrors?.[name] && !edited.names.has(name)) {
      setEdited((previous) => ({ ...previous, names: new Set(previous.names).add(name) }));
    }
  };

  useEffect(() => {
    // POS / 3D Secure sayfası harici bir adres olabilir → tam sayfa yönlendirme.
    if (state.redirectUrl) window.location.assign(state.redirectUrl);
  }, [state.redirectUrl]);

  if (!hydrated) {
    return <div className="mt-12 h-96 animate-pulse rounded-2xl bg-card" aria-busy />;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border bg-card p-10 text-center">
        <p className="text-muted-foreground">Sepetiniz boş.</p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
          Alışverişe dön
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((sum, line) => sum + line.priceMinor * line.quantity, 0);
  const shipping = shippingFor(subtotal);
  const currency = lines[0].currency;
  const remainingForFree = Math.max(0, commerceConfig.freeShippingThresholdMinor - subtotal);
  const freeProgress = Math.min(1, subtotal / commerceConfig.freeShippingThresholdMinor);

  // `action={…}` yerine onSubmit: React 19 action sonrası formu sıfırlar; doğrulama
  // hatasında kullanıcının yazdığı adres silinmesin.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    idempotencyKey.current ??= uuid();
    formData.set("idempotencyKey", idempotencyKey.current);
    formData.set(
      "items",
      JSON.stringify(lines.map(({ productId, quantity }) => ({ productId, quantity }))),
    );
    startTransition(() => formAction(formData));
  };

  const busy = pending || Boolean(state.redirectUrl);

  return (
    <form
      onSubmit={submit}
      onInput={markEdited}
      onChange={markEdited}
      noValidate
      className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
    >
      <div className="space-y-10">
        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-5 font-display text-3xl">İletişim</legend>
          <Field
            name="email"
            label="E-posta"
            type="email"
            autoComplete="email"
            required
            error={errors.email}
          />
          <Field
            name="phone"
            label="Cep telefonu"
            type="tel"
            autoComplete="tel"
            placeholder="05xx xxx xx xx"
            required
            error={errors.phone}
          />
        </fieldset>

        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-5 font-display text-3xl">Teslimat adresi</legend>
          <Field
            name="address.fullName"
            label="Ad soyad"
            autoComplete="name"
            required
            className="sm:col-span-2"
            error={errors["address.fullName"]}
          />
          <Field
            name="address.line1"
            label="Açık adres"
            autoComplete="street-address"
            placeholder="Mahalle, cadde, sokak, bina ve daire no"
            required
            className="sm:col-span-2"
            error={errors["address.line1"]}
          />
          <Field
            name="address.district"
            label="İlçe"
            autoComplete="address-level2"
            required
            error={errors["address.district"]}
          />
          <Field
            name="address.city"
            label="İl"
            autoComplete="address-level1"
            required
            error={errors["address.city"]}
          />
          <Field
            name="address.postalCode"
            label="Posta kodu (isteğe bağlı)"
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={5}
            error={errors["address.postalCode"]}
          />
        </fieldset>

        <div className="grid gap-2">
          <Label htmlFor="checkout-note">Sipariş notu (isteğe bağlı)</Label>
          <textarea
            id="checkout-note"
            name="note"
            rows={3}
            maxLength={500}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>

        <div className="grid gap-2">
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="acceptTerms"
              className="mt-0.5 size-4 accent-[var(--brass)]"
              aria-invalid={Boolean(errors.acceptTerms)}
            />
            <span>
              Ön bilgilendirme formunu ve mesafeli satış sözleşmesini okudum, onaylıyorum.
            </span>
          </label>
          {errors.acceptTerms ? (
            <p className="text-xs text-destructive">{errors.acceptTerms}</p>
          ) : null}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-3xl">Sipariş özeti</h2>
        <ul className="mt-6 divide-y text-sm">
          {lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-4 py-3">
              <span className="min-w-0">
                <span className="block truncate">{line.name}</span>
                <span className="text-xs text-muted-foreground">× {line.quantity}</span>
              </span>
              <span className="tabular-nums">
                {formatMoney(line.priceMinor * line.quantity, line.currency)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-lg bg-background/60 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <Truck className="size-4 text-brass" />
            {remainingForFree > 0
              ? `Ücretsiz kargo için ${formatMoney(remainingForFree, currency)} daha ekleyin.`
              : "Kargo bedava."}
          </p>
          <span className="mt-2 block h-1 overflow-hidden rounded-full bg-border">
            <span
              className="block h-full origin-left rounded-full bg-brass transition-transform duration-700 ease-out-expo"
              style={{ transform: `scaleX(${freeProgress})` }}
            />
          </span>
        </div>

        <dl className="mt-6 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Ara toplam</dt>
            <dd className="tabular-nums">{formatMoney(subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Kargo</dt>
            <dd className="tabular-nums">
              {shipping === 0 ? "Ücretsiz" : formatMoney(shipping, currency)}
            </dd>
          </div>
          <div className="flex justify-between border-t pt-3 text-base font-medium">
            <dt>Toplam</dt>
            <dd className="tabular-nums">{formatMoney(subtotal + shipping, currency)}</dd>
          </div>
          <p className="text-xs text-muted-foreground">
            KDV dahildir. Kesin tutar ödeme adımında sunucuda hesaplanır.
          </p>
        </dl>

        {state.error ? (
          <p
            role="alert"
            className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          >
            {state.error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Lock />}
          {busy ? "Güvenli ödemeye yönlendiriliyor…" : "Güvenli ödeme (3D Secure)"}
        </Button>
      </aside>
    </form>
  );
}
