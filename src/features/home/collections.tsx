import { ArrowUpRight, Bath, BookMarked, Clock, Droplets, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import type { CategoryDTO } from "@/features/catalog/types";

const icons: Record<string, LucideIcon> = {
  "duvar-saatleri": Clock,
  "banyo-dolaplari": Bath,
  "su-aritma-tesisat": Droplets,
  "kitap-ayraclari": BookMarked,
};

export function Collections({ categories }: { categories: CategoryDTO[] }) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="collections-title" className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <div className="flex items-end justify-between gap-6">
        <h2 id="collections-title" className="reveal font-display text-5xl sm:text-6xl">
          Koleksiyonlar
        </h2>
        <p className="hidden max-w-xs reveal text-sm text-muted-foreground md:block">
          Dört farklı disiplin, tek bir tasarım dili: dürüst malzeme, sessiz detay.
        </p>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category, index) => {
          const Icon = icons[category.slug] ?? Clock;
          const accent = category.accentColor ?? "#c9a36a";
          return (
            <li key={category.id} className="reveal">
              <Link
                href={`/kategori/${category.slug}`}
                className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 transition-colors duration-500 hover:border-transparent"
                style={{ "--accent-color": accent } as CSSProperties}
              >
                {/* Hover ışığı: yalnızca opacity + transform → GPU katmanında kalır */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-1/4 translate-y-1/3 scale-75 rounded-full bg-[radial-gradient(closest-side,var(--accent-color),transparent)] opacity-0 transition-[opacity,transform] duration-700 ease-out-expo group-hover:translate-y-1/4 group-hover:scale-100 group-hover:opacity-25"
                />
                <div className="relative flex items-start justify-between">
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <ArrowUpRight className="size-5 text-muted-foreground transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-foreground" />
                </div>
                <Icon
                  className="relative size-16 stroke-[1.1] transition-transform duration-700 ease-out-expo group-hover:scale-110 group-hover:-rotate-6"
                  style={{ color: accent }}
                />
                <div className="relative">
                  <h3 className="font-display text-3xl leading-tight">{category.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                  <p className="mt-4 font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                    {category.productCount} ürün
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
