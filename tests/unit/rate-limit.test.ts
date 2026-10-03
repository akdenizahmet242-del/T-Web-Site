import { afterEach, describe, expect, it, vi } from "vitest";

import { createRateLimiter } from "@/lib/rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("createRateLimiter (kayan pencere)", () => {
  it("limiti aşan isteği reddeder, anahtarlar birbirinden bağımsızdır", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-03T10:00:00Z"));
    const limiter = createRateLimiter({ id: "t1", limit: 3, windowSeconds: 60 });

    for (let i = 0; i < 3; i += 1) expect((await limiter.limit("ip-a")).ok).toBe(true);
    const blocked = await limiter.limit("ip-a");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect((await limiter.limit("ip-b")).ok).toBe(true);
  });

  it("iki pencere sonra tamamen sıfırlanır", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-03T10:00:00Z"));
    const limiter = createRateLimiter({ id: "t2", limit: 2, windowSeconds: 60 });
    await limiter.limit("k");
    await limiter.limit("k");
    expect((await limiter.limit("k")).ok).toBe(false);

    vi.setSystemTime(new Date("2026-10-03T10:02:30Z"));
    expect((await limiter.limit("k")).ok).toBe(true);
  });
});
