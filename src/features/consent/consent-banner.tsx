"use client";

import { Cookie } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { openConsentPreferences, readConsent, saveConsent, subscribeConsent } from "./consent";

function useConsentDecided() {
  return useSyncExternalStore(
    subscribeConsent,
    () => readConsent() !== null,
    () => true, // SSR: banner'ı çizme → hydration uyumlu, CLS yok
  );
}

/** Alttan kayan, yalnızca transform/opacity ile animasyonlu çerez bildirimi. */
export function ConsentBanner() {
  const decided = useConsentDecided();
  const [reopened, setReopened] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const open = () => {
      const current = readConsent();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setDetails(true);
      setReopened(true);
    };
    window.addEventListener("tws:consent-open", open);
    return () => window.removeEventListener("tws:consent-open", open);
  }, []);

  const visible = !decided || reopened;
  const decide = (choice: { analytics: boolean; marketing: boolean }) => {
    saveConsent(choice);
    setReopened(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        "fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border bg-popover/95 p-5 shadow-2xl transition-[transform,opacity] duration-500 ease-out-expo sm:inset-x-6 sm:bottom-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[120%] opacity-0",
      )}
    >
      <div className="flex gap-4">
        <Cookie className="mt-0.5 size-5 shrink-0 text-brass" aria-hidden />
        <div className="min-w-0 flex-1">
          <p id="consent-title" className="font-medium">
            Çerez tercihleri
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Siteyi çalıştırmak için zorunlu çerezleri kullanırız. Analiz ve pazarlama çerezleri
            yalnızca onayınızla etkinleşir (KVKK).
          </p>

          {details ? (
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex items-center justify-between gap-4 opacity-70">
                <span>Zorunlu (oturum, sepet)</span>
                <input type="checkbox" checked disabled className="size-4" />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span>Analiz (Google Analytics)</span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="size-4 accent-[var(--brass)]"
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span>Pazarlama (Meta, Google Ads)</span>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="size-4 accent-[var(--brass)]"
                />
              </label>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {details ? (
              <Button size="sm" onClick={() => decide({ analytics, marketing })}>
                Seçimi kaydet
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={() => decide({ analytics: true, marketing: true })}>
                  Tümünü kabul et
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => decide({ analytics: false, marketing: false })}
                >
                  Yalnızca zorunlu
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDetails(true)}>
                  Tercihler
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConsentPreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={openConsentPreferences}>
      Çerez tercihleri
    </button>
  );
}
