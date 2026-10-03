import "server-only";

/**
 * Kayan pencere (sliding window) oran sınırlayıcı.
 *
 * Bu sürüm process belleğinde çalışır: tek instance ve geliştirme için yeterli.
 * Çok instance'lı kurulumda aynı arayüzü Redis/Upstash ile uygulayın
 * (ör. `@upstash/ratelimit` slidingWindow) ve `createRateLimiter`'ı değiştirin.
 */
export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

export interface RateLimiter {
  limit(key: string): Promise<RateLimitResult>;
}

type Window = { start: number; current: number; previous: number };

export function createRateLimiter({
  id,
  limit,
  windowSeconds,
}: {
  id: string;
  limit: number;
  windowSeconds: number;
}): RateLimiter {
  const windowMs = windowSeconds * 1000;
  const store = new Map<string, Window>();

  return {
    async limit(key) {
      const now = Date.now();
      const bucketStart = now - (now % windowMs);
      const mapKey = `${id}:${key}`;
      let window = store.get(mapKey);

      if (!window || bucketStart - window.start >= windowMs * 2) {
        window = { start: bucketStart, current: 0, previous: 0 };
      } else if (bucketStart !== window.start) {
        window = { start: bucketStart, current: 0, previous: window.current };
      }

      // Önceki pencerenin, şimdiki pencereyle örtüşen oranı kadar ağırlığı
      const elapsed = (now - bucketStart) / windowMs;
      const weighted = window.previous * (1 - elapsed) + window.current;

      if (weighted >= limit) {
        store.set(mapKey, window);
        return {
          ok: false,
          remaining: 0,
          retryAfterSeconds: Math.ceil((bucketStart + windowMs - now) / 1000),
        };
      }

      window.current += 1;
      store.set(mapKey, window);

      // Bellek sızıntısına karşı ara sıra eski anahtarları temizle
      if (store.size > 10_000) {
        for (const [k, w] of store) if (now - w.start > windowMs * 2) store.delete(k);
      }

      return {
        ok: true,
        remaining: Math.max(0, Math.floor(limit - weighted - 1)),
        retryAfterSeconds: 0,
      };
    },
  };
}

/** Uygulama genelindeki sınırlar — tek yerden ayarlanır. */
export const rateLimits = {
  login: createRateLimiter({ id: "login", limit: 8, windowSeconds: 60 * 5 }),
  register: createRateLimiter({ id: "register", limit: 5, windowSeconds: 60 * 60 }),
  checkout: createRateLimiter({ id: "checkout", limit: 10, windowSeconds: 60 * 10 }),
  cart: createRateLimiter({ id: "cart", limit: 120, windowSeconds: 60 }),
  upload: createRateLimiter({ id: "upload", limit: 60, windowSeconds: 60 }),
};
