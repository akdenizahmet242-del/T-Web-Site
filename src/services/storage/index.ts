import "server-only";

import { LocalStorageService } from "./local";
import type { StorageService } from "./types";

export type * from "./types";

let instance: StorageService | undefined;

/**
 * STORAGE_DRIVER=local (varsayılan) → ./storage dizini, /media/* üzerinden servis.
 * STORAGE_DRIVER=s3 → S3/R2 sürücüsü (Faz 3: @aws-sdk/client-s3 ile aynı arayüz).
 */
export function getStorage(): StorageService {
  if (!instance) {
    const driver = process.env.STORAGE_DRIVER ?? "local";
    if (driver !== "local") {
      throw new Error(
        `STORAGE_DRIVER="${driver}" henüz uygulanmadı. Şimdilik "local" kullanın (bkz. docs/ARCHITECTURE.md).`,
      );
    }
    instance = new LocalStorageService();
  }
  return instance;
}
