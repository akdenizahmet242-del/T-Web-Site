/** 1-2-5 dizisinde "güzel" eksen tavanı: 7340 → 10000, 2300 → 2500 */
export function niceCeiling(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => normalized <= s) ?? 10;
  return step * magnitude;
}

const compact = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });

/** Kuruş → kısa TL: 1284500 → "₺12,8 B" */
export function compactMoney(amountMinor: number) {
  return `₺${compact.format(amountMinor / 100)}`;
}

export function shortDate(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
