"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { track } from "@/services/analytics/tracker";

import { useCartStore, type CartLine } from "./cart-store";

type Props = {
  product: Omit<CartLine, "quantity" | "maxQuantity"> & {
    sku: string;
    brand: string | null;
    stock: number;
  };
};

export function AddToCartButton({ product }: Props) {
  const add = useCartStore((state) => state.add);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [added]);

  if (product.stock <= 0) {
    return (
      <Button size="lg" disabled className="w-full">
        Tükendi
      </Button>
    );
  }

  const { sku, brand, stock, ...line } = product;

  return (
    <Button
      size="lg"
      className="group relative w-full overflow-hidden"
      onClick={() => {
        add({ ...line, maxQuantity: Math.min(stock, 99) });
        setAdded(true);
        track("add_to_cart", {
          currency: line.currency,
          valueMinor: line.priceMinor,
          quantity: 1,
          item: {
            id: line.productId,
            sku,
            name: line.name,
            category: line.category,
            brand,
            priceMinor: line.priceMinor,
          },
        });
      }}
    >
      {/* İki etiket üst üste; yalnızca transform/opacity animasyonu (layout yok). */}
      <span
        className={`flex items-center gap-2 transition-all duration-500 ease-out-expo ${added ? "-translate-y-8 opacity-0" : ""}`}
      >
        <ShoppingBag /> Sepete ekle
      </span>
      <span
        aria-live="polite"
        className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-500 ease-out-expo ${added ? "" : "translate-y-8 opacity-0"}`}
      >
        {added ? (
          <>
            <Check /> Sepete eklendi
          </>
        ) : null}
      </span>
    </Button>
  );
}
