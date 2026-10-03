import "server-only";

import { createHash } from "node:crypto";

import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);

export type ProcessedImage = {
  body: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  blurDataUrl: string;
  hash: string;
};

export class ImageValidationError extends Error {}

/**
 * Yüklenen görseli normalize eder:
 *  - EXIF yönüne göre döndürür, metadata'yı (GPS vb.) atar,
 *  - en fazla 2400 px genişliğe indirir, WebP'ye çevirir (alfa korunur → katman PNG'leri için),
 *  - next/image `placeholder="blur"` için 16 px'lik LQIP üretir.
 * Asıl AVIF/WebP varyantlarını teslim anında next/image üretir.
 */
export async function processImage(input: Buffer, maxWidth = 2400): Promise<ProcessedImage> {
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError("Dosya 10 MB sınırını aşıyor.");
  }

  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    throw new ImageValidationError("Dosya okunamadı; geçerli bir görsel değil.");
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) {
    // SVG bilinçli olarak kabul edilmez (içine script gömülebilir).
    throw new ImageValidationError("Yalnızca JPEG, PNG, WebP veya AVIF yükleyebilirsiniz.");
  }

  const { data, info } = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  const blur = await sharp(data).resize(16).webp({ quality: 45 }).toBuffer();

  return {
    body: data,
    contentType: "image/webp",
    width: info.width,
    height: info.height,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
    hash: createHash("sha256").update(data).digest("hex").slice(0, 20),
  };
}
