import Image from "next/image";
import type { ReactNode } from "react";

import type { LayerAsset } from "./templates";

/**
 * Bir animasyon slotunun *içeriği*. Panelden geçerli bir görsel gelmişse onu
 * next/image ile (AVIF/WebP, responsive) çizer; yoksa varsayılan SVG katmana
 * döner. Dış katman (transform'ların uygulandığı DOM düğümü) her iki durumda da
 * aynıdır → timeline bundan etkilenmez.
 */
export function LayerSlot({
  asset,
  fallback,
  sizes,
  priority = false,
}: {
  asset?: LayerAsset;
  fallback: ReactNode;
  sizes: string;
  priority?: boolean;
}) {
  if (!asset) return fallback;

  return (
    <Image
      src={asset.url}
      alt={asset.alt}
      fill
      sizes={sizes}
      priority={priority}
      draggable={false}
      className="object-contain select-none"
      placeholder={asset.blurDataUrl ? "blur" : "empty"}
      blurDataURL={asset.blurDataUrl}
    />
  );
}
