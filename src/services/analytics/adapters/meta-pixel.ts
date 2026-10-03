import { toMajorUnits } from "@/lib/money";

import type { AnalyticsAdapter, AnalyticsItem, TrackedEvent } from "../events";

type Fbq = (
  command: "track" | "consent",
  event: string,
  params?: Record<string, unknown>,
  options?: { eventID: string },
) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    /** Pixel script'i yüklenmeden önce üretilen olaylar; init sonrası boşaltılır. */
    __fbqQueue?: Parameters<Fbq>[];
  }
}

function send(...args: Parameters<Fbq>) {
  if (window.fbq) window.fbq(...args);
  else (window.__fbqQueue ??= []).push(args);
}

const metaEventNames = {
  page_view: "PageView",
  view_content: "ViewContent",
  add_to_cart: "AddToCart",
  initiate_checkout: "InitiateCheckout",
  purchase: "Purchase",
} as const;

function contents(items: AnalyticsItem[], quantity?: number) {
  return items.map((item) => ({
    id: item.sku ?? item.id,
    quantity: quantity ?? item.quantity ?? 1,
    item_price: toMajorUnits(item.priceMinor),
  }));
}

/**
 * Meta Pixel standart olayları. `eventID`, ileride eklenecek sunucu tarafı
 * Conversions API çağrısıyla aynı değeri taşıyarak çift sayımı önler.
 */
export const metaPixelAdapter: AnalyticsAdapter = {
  name: "meta-pixel",
  enabled: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
  send(event: TrackedEvent) {
    const metaName = metaEventNames[event.name as keyof typeof metaEventNames];
    if (!metaName) return;

    if (event.name === "page_view") {
      send("track", metaName, {}, { eventID: event.eventId });
      return;
    }

    const payload = event.payload as {
      currency: string;
      valueMinor: number;
      item?: AnalyticsItem;
      items?: AnalyticsItem[];
      quantity?: number;
    };
    const items = payload.items ?? (payload.item ? [payload.item] : []);

    send(
      "track",
      metaName,
      {
        content_type: "product",
        content_ids: items.map((item) => item.sku ?? item.id),
        content_name: items.length === 1 ? items[0].name : undefined,
        contents: contents(items, payload.item ? payload.quantity : undefined),
        num_items: items.reduce((sum, item) => sum + (item.quantity ?? payload.quantity ?? 1), 0),
        value: toMajorUnits(payload.valueMinor),
        currency: payload.currency,
      },
      { eventID: event.eventId },
    );
  },
};
