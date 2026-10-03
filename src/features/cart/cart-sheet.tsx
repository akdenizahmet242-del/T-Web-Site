"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { setSmoothScrollLocked } from "@/components/providers/smooth-scroll";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/money";
import { track } from "@/services/analytics/tracker";

import { selectSubtotalMinor, useCartStore } from "./cart-store";

export function CartSheet() {
  const router = useRouter();
  const { lines, isOpen, setOpen, setQuantity, remove } = useCartStore();
  const subtotal = useCartStore(selectSubtotalMinor);
  const currency = lines[0]?.currency ?? "TRY";

  useEffect(() => {
    setSmoothScrollLocked(isOpen);
  }, [isOpen]);

  const checkout = () => {
    track("initiate_checkout", {
      currency,
      valueMinor: subtotal,
      items: lines.map((line) => ({
        id: line.productId,
        name: line.name,
        category: line.category,
        priceMinor: line.priceMinor,
        quantity: line.quantity,
      })),
    });
    setOpen(false);
    router.push("/odeme");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b p-6">
          <SheetTitle className="font-display text-3xl font-normal">Sepetiniz</SheetTitle>
          <SheetDescription>
            {lines.length === 0 ? "Sepetiniz şu an boş." : `${lines.length} farklı ürün`}
          </SheetDescription>
        </SheetHeader>

        <ul data-lenis-prevent className="flex-1 divide-y overflow-y-auto overscroll-contain px-6">
          {lines.map((line) => (
            <li key={line.productId} className="flex gap-4 py-5">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/urun/${line.slug}`}
                  onClick={() => setOpen(false)}
                  className="font-medium hover:underline"
                >
                  {line.name}
                </Link>
                <p className="text-xs text-muted-foreground">{line.category}</p>
                <div className="mt-3 flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Azalt"
                    disabled={line.quantity <= 1}
                    onClick={() => setQuantity(line.productId, line.quantity - 1)}
                  >
                    <Minus />
                  </Button>
                  <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Artır"
                    disabled={line.quantity >= line.maxQuantity}
                    onClick={() => setQuantity(line.productId, line.quantity + 1)}
                  >
                    <Plus />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="ml-auto text-muted-foreground"
                    aria-label={`${line.name} ürününü kaldır`}
                    onClick={() => remove(line.productId)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <p className="text-sm tabular-nums">
                {formatMoney(line.priceMinor * line.quantity, line.currency)}
              </p>
            </li>
          ))}
        </ul>

        <SheetFooter className="border-t p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ara toplam</span>
            <span className="font-medium tabular-nums">{formatMoney(subtotal, currency)}</span>
          </div>
          <Separator className="my-2" />
          <Button size="lg" disabled={lines.length === 0} onClick={checkout}>
            Ödemeye geç
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
