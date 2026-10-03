import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isStaff } from "@/auth.config";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { AdminNav } from "@/features/admin/admin-nav";
import { logoutAction } from "@/features/auth/actions";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: `%s · Yönetim · ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Proxy iyimser kontrol yapar; asıl yetki kontrolü burada ve her Server Action'da.
  const session = await auth();
  if (!session?.user) redirect("/giris?callbackUrl=/admin");
  if (!isStaff(session.user.role) || !session.user.role) redirect("/");

  return (
    <div className="grid min-h-svh lg:grid-cols-[16rem_1fr]">
      <aside className="border-b bg-card/40 p-5 lg:sticky lg:top-0 lg:h-svh lg:border-r lg:border-b-0">
        <Link href="/" className="font-display text-2xl">
          {siteConfig.name}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          Yönetim paneli · {session.user.role === "ADMIN" ? "Yönetici" : "Editör"}
        </p>
        <AdminNav role={session.user.role} />
        <form action={logoutAction} className="mt-8">
          <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
            <LogOut /> Çıkış ({session.user.email})
          </Button>
        </form>
      </aside>
      <main className="min-w-0 p-6 lg:p-10">{children}</main>
    </div>
  );
}
