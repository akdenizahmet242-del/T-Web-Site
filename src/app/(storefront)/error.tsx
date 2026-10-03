"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/** Vitrin hata sınırı: header/footer ayakta kalır, yalnızca içerik bölgesi yeniden denenir. */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto grid min-h-[70svh] max-w-xl place-items-center px-5 pt-24 text-center">
      <div>
        <p className="font-mono text-xs tracking-[0.3em] text-brass">HATA</p>
        <h1 className="mt-4 font-display text-5xl">Bir şeyler ters gitti.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sayfa yüklenirken beklenmeyen bir sorun oluştu. Tekrar deneyebilirsiniz.
          {error.digest ? (
            <span className="mt-2 block font-mono text-xs">Kod: {error.digest}</span>
          ) : null}
        </p>
        <Button className="mt-8" onClick={reset}>
          <RotateCcw /> Tekrar dene
        </Button>
      </div>
    </section>
  );
}
