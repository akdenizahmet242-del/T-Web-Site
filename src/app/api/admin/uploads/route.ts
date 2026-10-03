import { NextResponse } from "next/server";
import { z } from "zod";

import { getStaffSession } from "@/features/auth/guards";
import { rateLimits } from "@/lib/rate-limit";
import { getStorage } from "@/services/storage";
import { ImageValidationError, MAX_UPLOAD_BYTES, processImage } from "@/services/storage/image";

const scopeSchema = z.enum(["products", "showcase"]);

/**
 * Panel görsel yükleme ucu. Server Action yerine Route Handler: Server Action
 * gövdeleri varsayılan 1 MB ile sınırlı; burada boyutu kendimiz denetliyoruz.
 *
 * Yanıt: { url, width, height, blurDataUrl } → form state'ine eklenir,
 * kayıt sırasında ProductImage / ShowcaseBanner.layers'a yazılır.
 */
export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const limited = await rateLimits.upload.limit(session.user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla yükleme. Biraz bekleyin." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Dosya 10 MB sınırını aşıyor." }, { status: 413 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const scope = scopeSchema.safeParse(form?.get("scope"));
  if (!(file instanceof File) || !scope.success) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  try {
    const image = await processImage(Buffer.from(await file.arrayBuffer()));
    const month = new Date().toISOString().slice(0, 7).replace("-", "/");
    const stored = await getStorage().put({
      key: `${scope.data}/${month}/${image.hash}.webp`,
      body: image.body,
      contentType: image.contentType,
    });

    return NextResponse.json({
      url: stored.url,
      width: image.width,
      height: image.height,
      blurDataUrl: image.blurDataUrl,
    });
  } catch (error) {
    if (error instanceof ImageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
