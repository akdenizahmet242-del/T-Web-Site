import { describe, expect, it } from "vitest";

import { createAccessToken, createOrderNumber } from "@/lib/ids";

describe("sipariş numarası ve erişim anahtarı", () => {
  it("okunabilir Crockford biçimi (0/O, 1/I/L yok)", () => {
    for (let i = 0; i < 500; i += 1) {
      expect(createOrderNumber()).toMatch(/^TWS-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    }
  });

  it("çakışmasız ve tahmin edilemez", () => {
    const numbers = new Set(Array.from({ length: 5000 }, createOrderNumber));
    expect(numbers.size).toBe(5000);
    expect(createAccessToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});
