"use client";

import {
  BarChart3,
  GalleryHorizontalEnd,
  LayoutDashboard,
  Package,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const items: { href: string; label: string; icon: LucideIcon; roles: Role[] }[] = [
  { href: "/admin", label: "Genel bakış", icon: LayoutDashboard, roles: ["ADMIN", "EDITOR"] },
  { href: "/admin/urunler", label: "Ürünler", icon: Package, roles: ["ADMIN", "EDITOR"] },
  { href: "/admin/siparisler", label: "Siparişler", icon: ShoppingCart, roles: ["ADMIN"] },
  {
    href: "/admin/vitrin",
    label: "Vitrin & Banner",
    icon: GalleryHorizontalEnd,
    roles: ["ADMIN", "EDITOR"],
  },
  { href: "/admin/analitik", label: "Analitik", icon: BarChart3, roles: ["ADMIN"] },
];

export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 flex gap-1 overflow-x-auto lg:flex-col">
      {items
        .filter((item) => item.roles.includes(role))
        .map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4" /> {label}
            </Link>
          );
        })}
    </nav>
  );
}
