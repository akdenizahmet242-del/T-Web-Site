import "server-only";

import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { STAFF_ROLES } from "@/auth.config";
import type { Role } from "@/generated/prisma/enums";

export type StaffSession = Session & { user: { id: string; email: string; role: Role } };

/** Oturum personel (ADMIN/EDITOR) değilse null — Route Handler'lar için. */
export async function getStaffSession(roles: readonly Role[] = STAFF_ROLES) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || !session.user.email || !role || !roles.includes(role)) return null;
  return session as StaffSession;
}

/**
 * Sayfa ve Server Action'lar için: yetkisizse yönlendirir.
 * Her action kendi içinde çağırmalı — arayüzün formu göstermemesi güvenlik sınırı değildir.
 */
export async function requireStaff(roles: readonly Role[] = STAFF_ROLES): Promise<StaffSession> {
  const session = await getStaffSession(roles);
  if (!session) {
    const signedIn = Boolean((await auth())?.user);
    redirect(signedIn ? "/admin?yetki=yok" : "/giris?callbackUrl=/admin");
  }
  return session;
}

/** Yalnızca ADMIN: siparişler, iadeler, kullanıcılar. */
export const requireAdmin = () => requireStaff(["ADMIN"]);

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris?callbackUrl=/hesap");
  return session as Session & { user: { id: string; email: string } };
}
