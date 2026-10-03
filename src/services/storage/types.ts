export type StoredObject = { key: string; url: string };

/**
 * Dosya deposu sözleşmesi. Yerel disk (geliştirme) ve S3 uyumlu depolar
 * (AWS S3, Cloudflare R2, MinIO) aynı arayüzü uygular.
 */
export interface StorageService {
  readonly driver: "local" | "s3";
  put(input: { key: string; body: Buffer; contentType: string }): Promise<StoredObject>;
  delete(key: string): Promise<void>;
}
