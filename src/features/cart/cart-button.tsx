"use client";

import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

import { selectItemCount, useCartStore } from "./cart-store";

export function CartButton() {
  const count = useCartStore(selectItemCount);
  const setOpen = useCartStore((state) => state.setOpen);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => setOpen(true)}
      aria-label={count > 0 ? `Sepet, ${count} ürün` : "Sepet"}
    >
      <ShoppingBag className="size-5" />
      <span
        aria-hidden
        className={`absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-brass px-1 text-[10px] leading-4 font-semibold text-primary-foreground tabular-nums transition-transform duration-300 ease-out-expo ${count > 0 ? "scale-100" : "scale-0"}`}
      >
        {count}
      </span>
    </Button>
  );
}
