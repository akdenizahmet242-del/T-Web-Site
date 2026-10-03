import {
  BarChart3,
  GalleryHorizontalEnd,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isStaff } from "@/auth.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { logoutAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Yönetim", robots: { index: false, follow: false } };

const nav = [
  { href: "/admin", label: "Genel bakış", icon: LayoutDashboard, ready: true },
  { href: "/admin/urunler", label: "Ürünler", icon: Package, ready: false },
  { href: "/admin/siparisler", label: "Siparişler", icon: ShoppingCart, ready: false },
  { href: "/admin/vitrin", label: "Vitrin & Banner", icon: GalleryHorizontalEnd, ready: false },
  { href: "/admin/analitik", label: "Analitik", icon: BarChart3, ready: false },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Proxy iyimser kontrol yapar; asıl yetki kontrolü burada, sunucuda.
  const session = await auth();
  if (!session?.user) redirect("/giris?callbackUrl=/admin");
  if (!isStaff(session.user.role)) redirect("/");

  return (
    <div className="grid min-h-svh lg:grid-cols-[16rem_1fr]">
      <aside className="border-b bg-card/40 p-5 lg:border-r lg:border-b-0">
        <Link href="/" className="font-display text-2xl">
          {siteConfig.name}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">Yönetim paneli</p>
        <nav className="mt-8 flex gap-1 overflow-x-auto lg:flex-col">
          {nav.map(({ href, label, icon: Icon, ready }) =>
            ready ? (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-md bg-accent px-3 py-2 text-sm"
              >
                <Icon className="size-4" /> {label}
              </Link>
            ) : (
              <span
                key={href}
                aria-disabled
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted-foreground"
              >
                <Icon className="size-4" /> {label}
                <Badge variant="outline" className="ml-auto text-[10px]">
                  Faz 2
                </Badge>
              </span>
            ),
          )}
        </nav>
        <form action={logoutAction} className="mt-8">
          <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
            <LogOut /> Çıkış ({session.user.email})
          </Button>
        </form>
      </aside>
      <main className="p-6 lg:p-10">{children}</main>
    </div>
  );
}
