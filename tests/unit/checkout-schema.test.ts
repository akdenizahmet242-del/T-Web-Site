import { describe, expect, it } from "vitest";

import { checkoutSchema } from "@/features/checkout/schema";

const valid = {
  email: "Musteri@Example.com",
  phone: "0532 123 45 67",
  address: {
    fullName: "Ayşe Yılmaz",
    line1: "Moda Cad. No: 12 D:4",
    district: "Kadıköy",
    city: "İstanbul",
  },
  acceptTerms: "on",
  idempotencyKey: "4f9d2a8e-6c1b-4f3a-9e2d-1a2b3c4d5e6f",
  items: [{ productId: "p1", quantity: 2 }],
};

describe("checkoutSchema", () => {
  it("geçerli girdiyi normalize eder", () => {
    const parsed = checkoutSchema.parse(valid);
    expect(parsed.email).toBe("musteri@example.com");
    expect(parsed.phone).toBe("05321234567");
    expect(parsed.address.country).toBe("TR");
  });

  it.each(["+905321234567", "5321234567", "(0532) 123-45-67"])("telefon kabul: %s", (phone) => {
    expect(checkoutSchema.safeParse({ ...valid, phone }).success).toBe(true);
  });

  it.each(["0212 123 45 67", "05321234", "abc"])("telefon red: %s", (phone) => {
    expect(checkoutSchema.safeParse({ ...valid, phone }).success).toBe(false);
  });

  it("sözleşme onayı ve boş sepet zorunlu kontrolleri", () => {
    expect(checkoutSchema.safeParse({ ...valid, acceptTerms: undefined }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...valid, items: [{ productId: "p1", quantity: 0 }] }).success,
    ).toBe(false);
  });

  it("idempotency anahtarı UUID olmalı", () => {
    expect(checkoutSchema.safeParse({ ...valid, idempotencyKey: "123" }).success).toBe(false);
  });
});
