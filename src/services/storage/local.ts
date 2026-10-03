import "server-only";

import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StorageService, StoredObject } from "./types";

/** Yüklemeler `public/` dışında tutulur: Next.js yalnızca build anında var olan public dosyalarını servis eder. */
export const LOCAL_STORAGE_ROOT = path.resolve(process.env.STORAGE_LOCAL_DIR ?? "storage");

const SAFE_KEY = /^[a-z0-9][a-z0-9/_.-]*$/i;

export function resolveLocalPath(key: string): string | null {
  if (!SAFE_KEY.test(key) || key.includes("..")) return null;
  const resolved = path.resolve(LOCAL_STORAGE_ROOT, key);
  // Dizin dışına taşma (path traversal) koruması
  return resolved.startsWith(LOCAL_STORAGE_ROOT + path.sep) ? resolved : null;
}

export class LocalStorageService implements StorageService {
  readonly driver = "local" as const;

  async put({
    key,
    body,
  }: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredObject> {
    const target = resolveLocalPath(key);
    if (!target) throw new Error(`Geçersiz depolama anahtarı: ${key}`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    return { key, url: `/media/${key}` };
  }

  async delete(key: string) {
    const target = resolveLocalPath(key);
    if (target) await rm(target, { force: true });
  }
}

export async function readLocalObject(key: string) {
  const target = resolveLocalPath(key);
  if (!target) return null;
  try {
    const info = await stat(target);
    if (!info.isFile()) return null;
    return { body: await readFile(target), size: info.size, mtime: info.mtime };
  } catch {
    return null;
  }
}
