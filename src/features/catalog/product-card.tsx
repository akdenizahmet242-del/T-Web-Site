import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { discountPercent, formatMoney } from "@/lib/money";

import { ProductMedia } from "./product-media";
import type { ProductCardDTO } from "./types";

export function ProductCard({ product }: { product: ProductCardDTO }) {
  const discount = discountPercent(product.priceMinor, product.compareAtPriceMinor);

  return (
    <Link
      href={`/urun/${product.slug}`}
      className="group block reveal rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <ProductMedia
          image={product.image}
          name={product.name}
          categorySlug={product.category.slug}
          accent={product.category.accentColor}
          seed={product.slug}
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {discount ? <Badge>%{discount} indirim</Badge> : null}
          {product.stock > 0 && product.stock <= 5 ? (
            <Badge variant="secondary">Son {product.stock} adet</Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            {product.category.name}
          </p>
          <h3 className="mt-1 line-clamp-2 font-display text-2xl leading-tight">{product.name}</h3>
          {product.tagline ? (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{product.tagline}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium tabular-nums">
            {formatMoney(product.priceMinor, product.currency)}
          </p>
          {discount ? (
            <p className="text-xs text-muted-foreground tabular-nums line-through">
              {formatMoney(product.compareAtPriceMinor!, product.currency)}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
