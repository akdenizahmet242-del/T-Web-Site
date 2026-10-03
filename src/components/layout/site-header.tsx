import Link from "next/link";

import { siteConfig } from "@/config/site";
import { CartButton } from "@/features/cart/cart-button";
import type { CategoryDTO } from "@/features/catalog/types";

const shortNames: Record<string, string> = {
  "duvar-saatleri": "Saatler",
  "banyo-dolaplari": "Banyo",
  "su-aritma-tesisat": "Su & Tesisat",
  "kitap-ayraclari": "Ayraçlar",
};

/**
 * Sabit başlık. `backdrop-filter` yerine gradyan: bulanıklık her scroll karesinde
 * arka planı yeniden rasterize ettirir, gradyan ise bedavadır.
 */
export function SiteHeader({ categories }: { categories: CategoryDTO[] }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-linear-to-b from-background via-background/80 to-transparent">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="font-display text-2xl tracking-tight">
          {siteConfig.name}
        </Link>
        <nav aria-label="Kategoriler" className="hidden md:block">
          <ul className="flex items-center gap-7 text-sm text-muted-foreground">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/kategori/${category.slug}`}
                  className="transition-colors hover:text-foreground"
                >
                  {shortNames[category.slug] ?? category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <CartButton />
      </div>
    </header>
  );
}
