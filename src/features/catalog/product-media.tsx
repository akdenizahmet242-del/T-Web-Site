import Image from "next/image";

import { cn } from "@/lib/utils";

import { ProductArt } from "./product-art";
import type { ImageDTO } from "./types";

/**
 * Ürün görseli: yüklenmiş fotoğraf varsa next/image (AVIF/WebP, srcset, lazy),
 * yoksa vektörel illüstrasyon. Her iki durumda da kutu oranı sabit → CLS = 0.
 */
export function ProductMedia({
  image,
  name,
  categorySlug,
  accent,
  seed,
  sizes,
  priority = false,
  className,
}: {
  image: ImageDTO | null;
  name: string;
  categorySlug: string;
  accent: string | null;
  seed: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-square overflow-hidden bg-card", className)}>
      {image ? (
        <Image
          src={image.url}
          alt={image.alt || name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          placeholder={image.blurDataUrl ? "blur" : "empty"}
          blurDataURL={image.blurDataUrl ?? undefined}
        />
      ) : (
        <ProductArt categorySlug={categorySlug} accent={accent} seed={seed} />
      )}
    </div>
  );
}
