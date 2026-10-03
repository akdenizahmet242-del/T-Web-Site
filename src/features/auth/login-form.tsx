"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mergeCartAfterSignIn } from "@/features/cart/cart-sync";

import { loginAction, type LoginState } from "./actions";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  useEffect(() => {
    const target = state.redirectTo;
    if (!target) return;
    // Misafir sepetini hesaba taşı, sonra hedefe git. Senkron hatası girişi engellemez.
    mergeCartAfterSignIn()
      .catch((error) => console.error(error))
      .finally(() => {
        router.replace(target);
        router.refresh();
      });
  }, [state.redirectTo, router]);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="grid gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending || Boolean(state.redirectTo)}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Giriş yap
      </Button>
    </form>
  );
}
