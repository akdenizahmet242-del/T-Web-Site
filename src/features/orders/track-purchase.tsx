"use client";

import { useEffect } from "react";

import { useCartStore } from "@/features/cart/cart-store";
import type { AnalyticsItem } from "@/services/analytics/events";
import { track } from "@/services/analytics/tracker";

/**
 * Ödemesi onaylanan sipariş için: Purchase olayı (bir kez) + sepeti temizle.
 * sessionStorage koruması sayfa yenilemelerinde çift dönüşüm sayılmasını engeller.
 */
export function TrackPurchase({
  orderNumber,
  currency,
  valueMinor,
  shippingMinor,
  taxMinor,
  items,
}: {
  orderNumber: string;
  currency: string;
  valueMinor: number;
  shippingMinor: number;
  taxMinor: number;
  items: AnalyticsItem[];
}) {
  useEffect(() => {
    const key = `tws:purchase:${orderNumber}`;
    let tracked = false;
    try {
      tracked = sessionStorage.getItem(key) === "1";
      sessionStorage.setItem(key, "1");
    } catch {
      // Gizli sekme vb. — en kötü ihtimalle olay tekrar gönderilir.
    }
    if (!tracked) {
      track("purchase", {
        currency,
        valueMinor,
        shippingMinor,
        taxMinor,
        transactionId: orderNumber,
        items,
      });
    }

    void (async () => {
      if (!useCartStore.persist.hasHydrated()) await useCartStore.persist.rehydrate();
      useCartStore.getState().clear();
    })();
    // Sipariş numarası değişmedikçe tek sefer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  return null;
}
