"use client";

import { selectSubtotalMinor, useCartStore } from "@/features/cart/cart-store";
import { formatMoney } from "@/lib/money";

export function CheckoutSummary() {
  const lines = useCartStore((state) => state.lines);
  const subtotal = useCartStore(selectSubtotalMinor);

  if (lines.length === 0) {
    return <p className="mt-10 text-sm text-muted-foreground">Sepetiniz boş.</p>;
  }

  return (
    <div className="mt-10 rounded-2xl border bg-card p-6">
      <ul className="divide-y">
        {lines.map((line) => (
          <li key={line.productId} className="flex justify-between gap-4 py-3 text-sm">
            <span>
              {line.name} <span className="text-muted-foreground">× {line.quantity}</span>
            </span>
            <span className="tabular-nums">
              {formatMoney(line.priceMinor * line.quantity, line.currency)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between border-t pt-4 font-medium">
        <span>Ara toplam</span>
        <span className="tabular-nums">{formatMoney(subtotal, lines[0].currency)}</span>
      </div>
    </div>
  );
}
