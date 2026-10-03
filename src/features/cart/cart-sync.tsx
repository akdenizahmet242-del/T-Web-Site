"use client";

import { useEffect } from "react";

import type { CartSyncRequest } from "./schema";
import { useCartStore, type CartLine } from "./cart-store";

const SYNC_DEBOUNCE_MS = 600;

async function pushCart(mode: CartSyncRequest["mode"], lines: CartLine[]) {
  const body: CartSyncRequest = {
    mode,
    items: lines.map(({ productId, quantity }) => ({ productId, quantity })),
  };
  const response = await fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Sepet senkronu başarısız (${response.status})`);
  return ((await response.json()) as { lines: CartLine[] }).lines;
}

/**
 * Girişten hemen sonra çağrılır: misafir sepetini sunucudakiyle birleştirir,
 * sunucunun döndürdüğü (canlı fiyat + stok) sepeti esas alır.
 */
export async function mergeCartAfterSignIn() {
  // Giriş sayfası CartSync'in bulunduğu layout'un dışında: önce yerel sepeti
  // yükle, yoksa boş sepet gönderip misafir sepetinin üzerine yazarız.
  if (!useCartStore.persist.hasHydrated()) await useCartStore.persist.rehydrate();
  const store = useCartStore.getState();
  const lines = await pushCart("merge", store.lines);
  if (lines) {
    store.replaceLines(lines);
    store.setServerSync(true);
  }
}

/** Storefront layout'una bir kez eklenir; DOM üretmez. */
export function CartSync() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();

    let timer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = useCartStore.subscribe((state, previous) => {
      if (!state.serverSync || state.lines === previous.lines) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const lines = await pushCart("replace", useCartStore.getState().lines);
          // Oturum düşmüşse senkronu kapat, misafir moduna dön.
          if (lines === null) useCartStore.getState().setServerSync(false);
        } catch (error) {
          console.error(error);
        }
      }, SYNC_DEBOUNCE_MS);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return null;
}
