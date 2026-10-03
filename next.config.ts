import type { NextConfig } from "next";

const imageHosts = (process.env.IMAGE_REMOTE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Yerel depo rotaları dinamik dosya yolu kullandığından (path.resolve) dosya izleyici
// tüm projeyi imaja dahil etmeye çalışır; çalışma zamanında gerekmeyenleri dışla.
const notNeededAtRuntime = [
  "./storage/**/*",
  "./src/**/*",
  "./tests/**/*",
  "./docs/**/*",
  "./prisma/**/*",
  "./.github/**/*",
  "./*.md",
  "./Dockerfile",
  "./docker-compose.yml",
  "./components.json",
  "./*.config.{ts,mjs}",
  "./tsconfig.json",
  "./tsconfig.tsbuildinfo",
  "./package-lock.json",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Docker imajı için minimal çıktı (Dockerfile NEXT_OUTPUT=standalone ile derler).
  // Yerelde `npm start` ile çalışmaya devam etsin diye varsayılan kapalı.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  outputFileTracingExcludes: {
    "/media/**": notNeededAtRuntime,
    "/api/admin/uploads": notNeededAtRuntime,
  },
  images: {
    // Tarayıcı destekliyorsa AVIF, değilse WebP; orijinal format asla gönderilmez.
    formats: ["image/avif", "image/webp"],
    // Optimize edilmiş görseller CDN'de 31 gün önbellekte kalır.
    minimumCacheTTL: 2_678_400,
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
