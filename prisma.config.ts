// Prisma 7 yapılandırması — bağlantı adresi şemada değil burada tanımlanır.
// Prisma 7 `.env` dosyasını kendiliğinden okumaz; dotenv bunu üstlenir.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `env()` yerine process.env: DATABASE_URL olmadan da `prisma generate`
    // çalışabilsin (CI / Docker build aşaması).
    url: process.env["DATABASE_URL"],
  },
});
