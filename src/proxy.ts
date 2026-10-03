import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

/**
 * Next.js 16 "proxy" (eski adıyla middleware).
 * Yalnızca korunan yollarda çalışır; storefront istekleri proxy'ye hiç uğramaz
 * ve CDN'den statik servis edilmeye devam eder.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/hesap/:path*"],
};
