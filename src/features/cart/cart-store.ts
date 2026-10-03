"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  category: string;
  priceMinor: number;
  currency: string;
  imageUrl: string | null;
  quantity: number;
  /** Stok tavanı — sunucu senkronunda güncellenir. */
  maxQuantity: number;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  /** true → kullanıcı giriş yaptı, değişiklikler /api/cart'a yazılır. */
  serverSync: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  replaceLines: (lines: CartLine[]) => void;
  setServerSync: (enabled: boolean) => void;
  setOpen: (open: boolean) => void;
};

const clamp = (quantity: number, max: number) => Math.max(1, Math.min(Math.floor(quantity), max));

/**
 * Misafir sepeti tarayıcıda yaşar → ürün sayfaları CDN'den statik servis
 * edilirken sepet için sunucuya tek bir istek bile gitmez.
 *
 * `skipHydration`: localStorage verisi `CartSync` içinde, hydration bittikten
 * sonra yüklenir; sunucu HTML'i ile ilk istemci render'ı birebir aynı kalır.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      serverSync: false,

      add: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === line.productId);
          if (existing) {
            return {
              isOpen: true,
              lines: state.lines.map((l) =>
                l.productId === line.productId
                  ? { ...l, ...line, quantity: clamp(l.quantity + quantity, line.maxQuantity) }
                  : l,
              ),
            };
          }
          return {
            isOpen: true,
            lines: [...state.lines, { ...line, quantity: clamp(quantity, line.maxQuantity) }],
          };
        }),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.productId === productId ? { ...l, quantity: clamp(quantity, l.maxQuantity) } : l,
          ),
        })),

      remove: (productId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.productId !== productId) })),

      clear: () => set({ lines: [] }),
      replaceLines: (lines) => set({ lines }),
      setServerSync: (serverSync) => set({ serverSync }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "tws-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lines, serverSync }) => ({ lines, serverSync }),
      skipHydration: true,
    },
  ),
);

export const selectItemCount = (state: CartState) =>
  state.lines.reduce((sum, line) => sum + line.quantity, 0);

export const selectSubtotalMinor = (state: CartState) =>
  state.lines.reduce((sum, line) => sum + line.priceMinor * line.quantity, 0);

/** localStorage'dan sepet yüklendi mi? (SSR'da her zaman false → hydration güvenli) */
export function useCartHydrated() {
  return useSyncExternalStore(
    (onChange) => useCartStore.persist.onFinishHydration(onChange),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
}
