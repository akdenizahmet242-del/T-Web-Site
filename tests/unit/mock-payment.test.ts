import { beforeAll, describe, expect, it } from "vitest";

import { MockPaymentService, signMockResult } from "@/services/payment/providers/mock";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-test-secret-test-secret";
});

const service = new MockPaymentService();
const callback = (body: Record<string, string>) => service.verifyCallback({ body, headers: {} });

describe("MockPaymentService", () => {
  it("createPayment 3D Secure sayfasına yönlendirir", async () => {
    const result = await service.createPayment({
      orderId: "o1",
      orderNumber: "TWS-AAAA-BBBB",
      amountMinor: 12345,
      currency: "TRY",
      buyer: { email: "a@b.c", fullName: "A B", ip: "127.0.0.1" },
      shippingAddress: { fullName: "A B", line1: "x", city: "İstanbul", country: "TR" },
      items: [],
      callbackUrl: "http://localhost:3000/api/payment/callback",
      idempotencyKey: "k-1",
    });
    expect(result.kind).toBe("redirect");
    if (result.kind === "redirect") {
      expect(new URL(result.redirectUrl).pathname).toBe("/mock-pos");
      expect(result.providerReference).toBe("mock_k-1");
    }
  });

  it("geçerli imzalı başarılı dönüşü kabul eder", async () => {
    const sig = signMockResult("mock_k-1", "o1", 12345, "success");
    expect(
      await callback({ ref: "mock_k-1", orderId: "o1", amount: "12345", status: "success", sig }),
    ).toEqual({
      ok: true,
      orderId: "o1",
      providerReference: "mock_k-1",
      amountMinor: 12345,
      status: "CAPTURED",
    });
  });

  it("tutar ya da durum değiştirilmişse INVALID döner (imza kırılır)", async () => {
    const sig = signMockResult("mock_k-1", "o1", 12345, "failed");
    const tampered = await callback({
      ref: "mock_k-1",
      orderId: "o1",
      amount: "12345",
      status: "success",
      sig,
    });
    expect(tampered).toMatchObject({ ok: false, code: "INVALID" });
    const amount = await callback({
      ref: "mock_k-1",
      orderId: "o1",
      amount: "1",
      status: "failed",
      sig,
    });
    expect(amount).toMatchObject({ ok: false, code: "INVALID" });
  });

  it("banka reddi DECLINED döner", async () => {
    const sig = signMockResult("mock_k-1", "o1", 12345, "failed");
    expect(
      await callback({ ref: "mock_k-1", orderId: "o1", amount: "12345", status: "failed", sig }),
    ).toMatchObject({
      ok: false,
      code: "DECLINED",
    });
  });
});
