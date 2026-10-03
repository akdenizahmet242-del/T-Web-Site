/**
 * Para birimi yardımcıları. Tüm tutarlar *minor unit* (kuruş) cinsinden Int'tir.
 */
const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string) {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    });
    formatters.set(currency, formatter);
  }
  return formatter;
}

/** 124990 → "₺1.249,90" */
export function formatMoney(amountMinor: number, currency = "TRY") {
  return getFormatter(currency).format(amountMinor / 100);
}

/** Analitik/POS entegrasyonları ondalıklı major unit bekler: 124990 → 1249.9 */
export function toMajorUnits(amountMinor: number) {
  return Math.round(amountMinor) / 100;
}

export function discountPercent(priceMinor: number, compareAtPriceMinor?: number | null) {
  if (!compareAtPriceMinor || compareAtPriceMinor <= priceMinor) return null;
  return Math.round((1 - priceMinor / compareAtPriceMinor) * 100);
}
