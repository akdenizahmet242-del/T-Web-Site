/** Ticari kurallar — tek yerden yönetilir (ileride panelden düzenlenebilir ayarlara taşınabilir). */
export const commerceConfig = {
  currency: "TRY",
  /** Bu tutar ve üzeri siparişlerde kargo ücretsiz (kuruş) */
  freeShippingThresholdMinor: 150_000,
  /** Standart kargo ücreti (kuruş, KDV dahil) */
  shippingFeeMinor: 14_990,
  shippingVatRate: 20,
  /** Ödenmemiş siparişin stok rezervasyonu bu süre sonunda bırakılır */
  paymentWindowMinutes: 30,
} as const;
