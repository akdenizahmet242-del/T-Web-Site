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

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
