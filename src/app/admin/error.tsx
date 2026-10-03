"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg rounded-xl border border-destructive/40 bg-destructive/5 p-6">
      <h1 className="text-lg font-medium">Bu ekran yüklenemedi</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Beklenmeyen bir hata oluştu."}
        {error.digest ? (
          <span className="mt-1 block font-mono text-xs">Kod: {error.digest}</span>
        ) : null}
      </p>
      <Button className="mt-4" size="sm" onClick={reset}>
        Tekrar dene
      </Button>
    </div>
  );
}
