"use client";

export type UploadedImage = {
  url: string;
  width: number;
  height: number;
  blurDataUrl: string;
};

export type UploadScope = "products" | "showcase";

/**
 * /api/admin/uploads'a yükler. fetch yükleme ilerlemesi vermediği için XHR:
 * kullanıcı büyük dosyalarda gerçek ilerlemeyi görür.
 */
export function uploadImage(
  file: File,
  scope: UploadScope,
  onProgress?: (ratio: number) => void,
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.set("file", file);
    body.set("scope", scope);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/uploads");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as UploadedImage);
      else
        reject(
          new Error(
            (xhr.response as { error?: string } | null)?.error ??
              `Yükleme başarısız (${xhr.status})`,
          ),
        );
    };
    xhr.onerror = () => reject(new Error("Ağ hatası: yükleme tamamlanamadı."));
    xhr.send(body);
  });
}

export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/avif";
