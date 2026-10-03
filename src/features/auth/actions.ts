"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { rateLimits } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

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

  // Kaba kuvvet koruması: IP + e-posta başına 5 dakikada 8 deneme
  const limited = await rateLimits.login.limit(`${await getClientIp()}:${email.toLowerCase()}`);
  if (!limited.ok) {
    const minutes = Math.ceil(limited.retryAfterSeconds / 60);
    return { error: `Çok fazla deneme. ${minutes} dakika sonra tekrar deneyin.`, email };
  }

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

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Adınızı girin.").max(80),
    email: z.email("Geçerli bir e-posta girin.").transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalı.")
      .max(128)
      .regex(/[A-Za-zÇĞİÖŞÜçğıöşü]/, "Şifre en az bir harf içermeli.")
      .regex(/\d/, "Şifre en az bir rakam içermeli."),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Şifreler eşleşmiyor.",
  });

export type RegisterState = LoginState & {
  name?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "confirm", string>>;
};

export async function registerAction(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  };
  const echo = { name: values.name, email: values.email };

  if (!(await rateLimits.register.limit(await getClientIp())).ok) {
    return { ...echo, error: "Çok fazla kayıt denemesi. Daha sonra tekrar deneyin." };
  }

  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: RegisterState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<RegisterState["fieldErrors"]>;
      fieldErrors[key] ??= issue.message;
    }
    return { ...echo, fieldErrors };
  }

  const { name, email, password } = parsed.data;
  const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) {
    return {
      ...echo,
      fieldErrors: { email: "Bu e-posta ile kayıtlı bir hesap var. Giriş yapın." },
    };
  }

  await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
  });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError)
      return { ...echo, error: "Hesap oluşturuldu; lütfen giriş yapın." };
    throw error;
  }
  return { redirectTo: safeRedirect(formData.get("callbackUrl"), "/hesap") };
}
