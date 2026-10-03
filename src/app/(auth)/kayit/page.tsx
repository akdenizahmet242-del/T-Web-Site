import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Hesap oluştur", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/kayit">) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="grid min-h-svh place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-3xl">
          {siteConfig.name}
        </Link>
        <h1 className="mt-10 font-display text-5xl">Hesap oluştur</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Siparişlerinizi takip edin, sepetiniz cihazlar arasında senkron kalsın.
        </p>
        <RegisterForm callbackUrl={typeof callbackUrl === "string" ? callbackUrl : "/hesap"} />
        <p className="mt-6 text-sm text-muted-foreground">
          Hesabınız var mı?{" "}
          <Link href="/giris" className="text-foreground underline underline-offset-4">
            Giriş yapın
          </Link>
        </p>
      </div>
    </main>
  );
}
