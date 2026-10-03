import { commerceConfig } from "@/config/commerce";

export type PricedLine = { unitPriceMinor: number; quantity: number; vatRate: number };

export type OrderTotals = {
  subtotalMinor: number;
  shippingMinor: number;
  discountMinor: number;
  /** Fiyatların içindeki KDV (bilgi amaçlı, toplam'a eklenmez) */
  taxMinor: number;
  totalMinor: number;
};

/** KDV dahil tutarın içindeki KDV: 120 TL @ %20 → 20 TL */
export function includedVat(amountMinor: number, vatRate: number) {
  return Math.round((amountMinor * vatRate) / (100 + vatRate));
}

export function shippingFor(subtotalMinor: number) {
  if (subtotalMinor === 0) return 0;
  return subtotalMinor >= commerceConfig.freeShippingThresholdMinor
    ? 0
    : commerceConfig.shippingFeeMinor;
}

/**
 * Sipariş toplamları. Saf fonksiyon: hem sunucuda (yetkili hesap) hem
 * istemcide (önizleme) aynı sonucu üretir. Fiyatlar KDV dahildir.
 */
export function computeTotals(lines: PricedLine[], discountMinor = 0): OrderTotals {
  const subtotalMinor = lines.reduce((sum, line) => sum + line.unitPriceMinor * line.quantity, 0);
  const shippingMinor = shippingFor(subtotalMinor);
  const productVat = lines.reduce(
    (sum, line) => sum + includedVat(line.unitPriceMinor * line.quantity, line.vatRate),
    0,
  );
  const taxMinor = productVat + includedVat(shippingMinor, commerceConfig.shippingVatRate);
  const totalMinor = Math.max(0, subtotalMinor + shippingMinor - discountMinor);
  return { subtotalMinor, shippingMinor, discountMinor, taxMinor, totalMinor };
}
