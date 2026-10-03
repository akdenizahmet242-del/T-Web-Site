"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";

/** `email` geri döner: React 19 action sonrası formu sıfırlar, kullanıcı yeniden yazmasın. */
export type LoginState = { error?: string; redirectTo?: string; email?: string };

/**
 * Açık yönlendirme (open redirect) koruması: proxy callbackUrl'i mutlak URL
 * olarak verebilir; yalnızca yol kısmını alıp her zaman site içinde kalırız.
 */
function safeRedirect(value: FormDataEntryValue | null, fallback = "/") {
  if (typeof value !== "string" || value === "") return fallback;
  try {
    const { pathname, search, hash } = new URL(value, "http://site.invalid");
    const path = `${pathname}${search}${hash}`;
    return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
  } catch {
    return fallback;
  }
}

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "E-posta veya şifre hatalı.", email };
    throw error;
  }
  // Yönlendirmeyi istemci yapar: önce misafir sepeti sunucuyla birleştirilir.
  return { redirectTo: safeRedirect(formData.get("callbackUrl")) };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
