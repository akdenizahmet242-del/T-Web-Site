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

/**
 * Panel fiyat alanı → kuruş. "4.890,00", "4890,5", "4890.50", "₺ 4 890" kabul edilir.
 * Geçersizse null.
 */
export function parseMoneyInput(value: string): number | null {
  const cleaned = value.replace(/[₺\s]/g, "").replace(/TL$/i, "");
  if (cleaned === "") return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(cleaned)
      ? cleaned.replace(/\./g, "") // "4.890" → binlik ayırıcı
      : cleaned;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/** Kuruş → panel alanı: 489000 → "4890,00" */
export function formatMoneyInput(amountMinor: number | null | undefined) {
  if (amountMinor == null) return "";
  return (amountMinor / 100).toFixed(2).replace(".", ",");
}
