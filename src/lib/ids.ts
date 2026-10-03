import "server-only";

import { randomBytes } from "node:crypto";

// Crockford base32: 0/O, 1/I/L karışmaz → telefonda okunabilir sipariş numarası
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomCode(length: number) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % 32];
  return out;
}

/** "TWS-7K2M-Q9XA" — 32^8 ≈ 1,1 trilyon olasılık; çakışmada unique index + yeniden deneme. */
export function createOrderNumber() {
  const code = randomCode(8);
  return `TWS-${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Misafir sipariş sayfası erişim anahtarı (256 bit). */
export function createAccessToken() {
  return randomBytes(32).toString("base64url");
}
