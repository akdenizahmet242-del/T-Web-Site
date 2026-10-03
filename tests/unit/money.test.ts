import { describe, expect, it } from "vitest";

import {
  discountPercent,
  formatMoney,
  formatMoneyInput,
  parseMoneyInput,
  toMajorUnits,
} from "@/lib/money";

describe("formatMoney", () => {
  it("kuruşu Türk lirası biçiminde yazar", () => {
    expect(formatMoney(124990)).toBe("₺1.249,90");
    expect(formatMoney(0)).toBe("₺0,00");
  });
});

describe("parseMoneyInput", () => {
  it.each([
    ["4.890,00", 489000],
    ["4890,5", 489050],
    ["4890.50", 489050],
    ["4.890", 489000],
    ["₺ 1 249,90", 124990],
    ["129", 12900],
    ["0,13", 13],
  ])("%s → %i", (input, expected) => {
    expect(parseMoneyInput(input)).toBe(expected);
  });

  it.each(["", "abc", "12,345", "-5", "1.2.3,4,5"])("geçersiz: %s", (input) => {
    expect(parseMoneyInput(input)).toBeNull();
  });

  it("formatMoneyInput ile tersine çevrilebilir", () => {
    expect(parseMoneyInput(formatMoneyInput(489050))).toBe(489050);
    expect(formatMoneyInput(null)).toBe("");
  });
});

describe("yardımcılar", () => {
  it("indirim yüzdesi", () => {
    expect(discountPercent(489000, 549000)).toBe(11);
    expect(discountPercent(100, 100)).toBeNull();
    expect(discountPercent(100, null)).toBeNull();
  });

  it("major unit (analitik / POS)", () => {
    expect(toMajorUnits(124990)).toBe(1249.9);
  });
});
