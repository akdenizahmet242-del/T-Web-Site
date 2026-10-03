"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mergeCartAfterSignIn } from "@/features/cart/cart-sync";

import { registerAction, type RegisterState } from "./actions";

const fields = [
  { name: "name", label: "Ad soyad", type: "text", autoComplete: "name" },
  { name: "email", label: "E-posta", type: "email", autoComplete: "email" },
  { name: "password", label: "Şifre", type: "password", autoComplete: "new-password" },
  { name: "confirm", label: "Şifre (tekrar)", type: "password", autoComplete: "new-password" },
] as const;

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(registerAction, {});

  useEffect(() => {
    const target = state.redirectTo;
    if (!target) return;
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
      {fields.map((field) => {
        const error = state.fieldErrors?.[field.name];
        return (
          <div key={field.name} className="grid gap-2">
            <Label htmlFor={`register-${field.name}`}>{field.label}</Label>
            <Input
              id={`register-${field.name}`}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              defaultValue={
                field.name === "name"
                  ? state.name
                  : field.name === "email"
                    ? state.email
                    : undefined
              }
              aria-invalid={Boolean(error)}
              required
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        );
      })}
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending || Boolean(state.redirectTo)}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Hesap oluştur
      </Button>
    </form>
  );
}
