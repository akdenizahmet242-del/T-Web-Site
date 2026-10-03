import { readLocalObject } from "@/services/storage/local";

const contentTypes: Record<string, string> = {
  webp: "image/webp",
  avif: "image/avif",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

/**
 * Yerel depodaki dosyaları servis eder (STORAGE_DRIVER=local).
 * Anahtarlar içerik hash'i taşıdığından dosyalar değişmez → 1 yıl immutable önbellek.
 * Production'da bu rota yerine S3/R2 + CDN kullanılır.
 */
export async function GET(_request: Request, { params }: RouteContext<"/media/[...path]">) {
  const { path } = await params;
  const key = path.join("/");
  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  const contentType = contentTypes[extension];
  if (!contentType) return new Response("Not found", { status: 404 });

  const object = await readLocalObject(key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(object.body), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(object.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
