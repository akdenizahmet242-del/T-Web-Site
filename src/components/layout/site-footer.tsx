import Link from "next/link";

import { siteConfig } from "@/config/site";
import type { CategoryDTO } from "@/features/catalog/types";
import { ConsentPreferencesButton } from "@/features/consent/consent-banner";

export function SiteFooter({ categories }: { categories: CategoryDTO[] }) {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-display text-4xl">{siteConfig.name}</p>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">
            Koleksiyonlar
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`/kategori/${category.slug}`} className="hover:text-foreground">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Hesap</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/giris" className="hover:text-foreground">
                Giriş yap
              </Link>
            </li>
            <li>
              <Link href="/kayit" className="hover:text-foreground">
                Hesap oluştur
              </Link>
            </li>
            <li>
              <Link href="/hesap" className="hover:text-foreground">
                Siparişlerim
              </Link>
            </li>
            <li>
              <ConsentPreferencesButton className="hover:text-foreground" />
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t px-5 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}. Tüm hakları saklıdır.
      </p>
    </footer>
  );
}
