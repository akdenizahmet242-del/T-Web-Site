"use client";

import { useEffect } from "react";

import type { AnalyticsItem } from "./events";
import { track } from "./tracker";

/** Statik (ISR) ürün sayfasında ViewContent olayını istemcide tetikler. */
export function TrackViewContent({ item, currency }: { item: AnalyticsItem; currency: string }) {
  useEffect(() => {
    track("view_content", { currency, valueMinor: item.priceMinor, item });
    // Ürün değiştiğinde yeniden tetiklenir; obje kimliği değil id belirleyici.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  return null;
}
