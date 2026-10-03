import { gtmAdapter } from "./adapters/gtm";
import { metaPixelAdapter } from "./adapters/meta-pixel";
import type {
  AnalyticsAdapter,
  AnalyticsEventMap,
  AnalyticsEventName,
  TrackedEvent,
} from "./events";

export type * from "./events";

const consoleAdapter: AnalyticsAdapter = {
  name: "console",
  enabled: process.env.NODE_ENV === "development",
  send(event) {
    console.info(`%c[analytics] ${event.name}`, "color:#c9a36a", event.payload);
  },
};

const adapters = [gtmAdapter, metaPixelAdapter, consoleAdapter].filter(
  (adapter) => adapter.enabled,
);

function createEventId() {
  // randomUUID yalnızca güvenli bağlamda (https/localhost) var.
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Uygulamanın tek izleme giriş noktası (yalnızca tarayıcıda çalışır).
 *
 *   track("add_to_cart", { currency: "TRY", valueMinor: 489000, item, quantity: 1 })
 */
export function track<E extends AnalyticsEventName>(name: E, payload: AnalyticsEventMap[E]) {
  if (typeof window === "undefined") return;

  const event: TrackedEvent<E> = { name, payload, eventId: createEventId(), timestamp: Date.now() };
  for (const adapter of adapters) {
    try {
      adapter.send(event as TrackedEvent);
    } catch (error) {
      // Bir pazarlama etiketinin hatası asla satın alma akışını kırmamalı.
      console.error(`[analytics:${adapter.name}]`, error);
    }
  }
}
