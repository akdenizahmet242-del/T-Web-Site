import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Tek PrismaClient örneği (process başına bir bağlantı havuzu).
 *
 * - Geliştirmede HMR her kaydetmede modülü yeniden yükler; örneği globalThis'e
 *   asarak havuzların birikmesini engelliyoruz.
 * - İstemci *ilk kullanımda* oluşturulur. Böylece DATABASE_URL olmadan da
 *   modül import edilebilir (ör. CI'da veritabanısız `next build`).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL tanımlı değil. `.env.example` dosyasını `.env` olarak kopyalayın.",
    );
  }

  const adapter = new PrismaPg({
    connectionString,
    // Serverless/çok replikalı kurulumlarda düşük tutun; ölçek PgBouncer'dan gelir.
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
