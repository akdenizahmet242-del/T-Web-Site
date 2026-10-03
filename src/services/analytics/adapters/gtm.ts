import { toMajorUnits } from "@/lib/money";

import type { AnalyticsAdapter, AnalyticsItem, TrackedEvent } from "../events";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const ga4EventNames = {
  page_view: "page_view",
  view_content: "view_item",
  add_to_cart: "add_to_cart",
  remove_from_cart: "remove_from_cart",
  initiate_checkout: "begin_checkout",
  purchase: "purchase",
} as const;

function toGa4Item(item: AnalyticsItem, quantity = item.quantity ?? 1) {
  return {
    item_id: item.sku ?? item.id,
    item_name: item.name,
    item_category: item.category,
    item_brand: item.brand ?? undefined,
    price: toMajorUnits(item.priceMinor),
    quantity,
  };
}

/** GA4 e-ticaret şemasında `window.dataLayer`'a yazar; GTM etiketleri buradan tetiklenir. */
export const gtmAdapter: AnalyticsAdapter = {
  name: "gtm",
  enabled: Boolean(process.env.NEXT_PUBLIC_GTM_ID),
  send(event: TrackedEvent) {
    const dataLayer = (window.dataLayer ??= []);
    const base = { event: ga4EventNames[event.name], event_id: event.eventId };

    if (event.name === "page_view") {
      const { path, title } = event.payload as { path: string; title?: string };
      dataLayer.push({ ...base, page_path: path, page_title: title });
      return;
    }

    const payload = event.payload as {
      currency: string;
      valueMinor: number;
      item?: AnalyticsItem;
      items?: AnalyticsItem[];
      quantity?: number;
      transactionId?: string;
      shippingMinor?: number;
      taxMinor?: number;
    };
    const items = payload.items
      ? payload.items.map((item) => toGa4Item(item))
      : payload.item
        ? [toGa4Item(payload.item, payload.quantity)]
        : [];

    // GA4 önerisi: önceki ecommerce nesnesini temizle.
    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      ...base,
      ecommerce: {
        currency: payload.currency,
        value: toMajorUnits(payload.valueMinor),
        transaction_id: payload.transactionId,
        shipping: payload.shippingMinor != null ? toMajorUnits(payload.shippingMinor) : undefined,
        tax: payload.taxMinor != null ? toMajorUnits(payload.taxMinor) : undefined,
        items,
      },
    });
  },
};
