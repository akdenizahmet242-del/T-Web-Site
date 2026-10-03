import { describe, expect, it } from "vitest";

import { commerceConfig } from "@/config/commerce";
import { computeTotals, includedVat, shippingFor } from "@/features/checkout/pricing";

describe("KDV", () => {
  it("KDV dahil tutarın içindeki KDV'yi bulur", () => {
    expect(includedVat(12000, 20)).toBe(2000);
    expect(includedVat(11000, 10)).toBe(1000);
    expect(includedVat(0, 20)).toBe(0);
  });
});

describe("kargo", () => {
  it("eşik ve üzerinde ücretsiz, altında standart ücret, boş sepette 0", () => {
    expect(shippingFor(commerceConfig.freeShippingThresholdMinor)).toBe(0);
    expect(shippingFor(commerceConfig.freeShippingThresholdMinor - 1)).toBe(
      commerceConfig.shippingFeeMinor,
    );
    expect(shippingFor(0)).toBe(0);
  });
});

describe("computeTotals", () => {
  it("ücretsiz kargolu sepet (gerçek checkout senaryosu)", () => {
    const totals = computeTotals([
      { unitPriceMinor: 34_900, quantity: 1, vatRate: 20 },
      { unitPriceMinor: 219_000, quantity: 1, vatRate: 20 },
    ]);
    expect(totals).toEqual({
      subtotalMinor: 253_900,
      shippingMinor: 0,
      discountMinor: 0,
      taxMinor: 42_317,
      totalMinor: 253_900,
    });
  });

  it("kargo ücreti ve kargo KDV'si toplamlara eklenir", () => {
    const totals = computeTotals([{ unitPriceMinor: 34_900, quantity: 2, vatRate: 20 }]);
    expect(totals.shippingMinor).toBe(commerceConfig.shippingFeeMinor);
    expect(totals.totalMinor).toBe(69_800 + commerceConfig.shippingFeeMinor);
    expect(totals.taxMinor).toBe(
      includedVat(69_800, 20) + includedVat(commerceConfig.shippingFeeMinor, 20),
    );
  });

  it("indirim toplamı sıfırın altına düşüremez", () => {
    expect(
      computeTotals([{ unitPriceMinor: 100, quantity: 1, vatRate: 20 }], 10_000_000).totalMinor,
    ).toBe(0);
  });
});
