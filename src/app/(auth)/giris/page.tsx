import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Giriş", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="grid min-h-svh place-items-center px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-3xl">
          {siteConfig.name}
        </Link>
        <h1 className="mt-10 font-display text-5xl">Giriş yap</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sepetiniz tüm cihazlarınızda senkron kalsın.
        </p>
        <LoginForm callbackUrl={typeof callbackUrl === "string" ? callbackUrl : "/"} />
      </div>
    </main>
  );
}
