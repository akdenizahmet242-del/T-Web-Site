import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true, // "@/…" alias'ları tsconfig.json'dan
    alias: {
      // Next.js dışında "server-only" import'u hata fırlatmasın
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    // Entegrasyon testleri aynı veritabanını paylaşır → sırayla
    fileParallelism: false,
  },
});
