import type { NextAuthConfig } from "next-auth";

import type { Role } from "@/generated/prisma/enums";

/** Panele erişebilen roller. */
export const STAFF_ROLES: readonly Role[] = ["ADMIN", "EDITOR"];

export function isStaff(role: Role | undefined): boolean {
  return role !== undefined && STAFF_ROLES.includes(role);
}

/**
 * Proxy'de de çalışan, veritabanı/bcrypt içermeyen hafif yapılandırma.
 * Sağlayıcılar `auth.ts` içinde eklenir.
 */
export const authConfig = {
  pages: { signIn: "/giris" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [],
  callbacks: {
    /** Proxy'deki iyimser (optimistic) kontrol; asıl yetki kontrolü sunucu bileşenlerinde. */
    authorized({ auth, request: { nextUrl } }) {
      if (!nextUrl.pathname.startsWith("/admin")) return true;
      if (!auth?.user) return false; // → /giris?callbackUrl=…
      if (!isStaff(auth.user.role)) return Response.redirect(new URL("/", nextUrl));
      return true;
    },
    jwt({ token, user }) {
      if (user?.role) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
