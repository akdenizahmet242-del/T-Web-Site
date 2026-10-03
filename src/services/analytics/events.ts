/**
 * Merkezi e-ticaret olay sözlüğü.
 *
 * Uygulama yalnızca bu tipli olayları üretir; her adaptör (GTM/GA4, Meta Pixel,
 * ileride TikTok, Criteo, sunucu tarafı CAPI…) kendi formatına çevirir.
 *
 *   view_content      → GA4 view_item        · Meta ViewContent
 *   add_to_cart       → GA4 add_to_cart      · Meta AddToCart
 *   remove_from_cart  → GA4 remove_from_cart · —
 *   initiate_checkout → GA4 begin_checkout   · Meta InitiateCheckout
 *   purchase          → GA4 purchase         · Meta Purchase
 */

export type AnalyticsItem = {
  id: string;
  sku?: string;
  name: string;
  category?: string;
  brand?: string | null;
  priceMinor: number;
  quantity?: number;
};

type Money = { currency: string; valueMinor: number };

export type AnalyticsEventMap = {
  page_view: { path: string; title?: string };
  view_content: Money & { item: AnalyticsItem };
  add_to_cart: Money & { item: AnalyticsItem; quantity: number };
  remove_from_cart: Money & { item: AnalyticsItem; quantity: number };
  initiate_checkout: Money & { items: AnalyticsItem[] };
  purchase: Money & {
    transactionId: string;
    items: AnalyticsItem[];
    shippingMinor?: number;
    taxMinor?: number;
  };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

export type TrackedEvent<E extends AnalyticsEventName = AnalyticsEventName> = {
  name: E;
  payload: AnalyticsEventMap[E];
  /** Pixel ↔ Conversions API tekilleştirmesi için ortak kimlik */
  eventId: string;
  timestamp: number;
};

export interface AnalyticsAdapter {
  readonly name: string;
  readonly enabled: boolean;
  send(event: TrackedEvent): void;
}
