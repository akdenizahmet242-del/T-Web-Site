"use client";

/**
 * KVKK / GDPR çerez onayı. Varsayılan: zorunlu dışındaki her şey KAPALI.
 *
 *  - Google Consent Mode v2: script yüklenmeden "denied" varsayılanı set edilir
 *    (analytics-scripts.tsx), kullanıcı seçince `consent update` gönderilir.
 *  - Meta Pixel: `fbq('consent','revoke')` ile başlar, pazarlama onayında `grant`.
 */
export type Consent = { analytics: boolean; marketing: boolean; decidedAt: string };

export const CONSENT_STORAGE_KEY = "tws-consent";
const EVENT = "tws:consent";

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
  }
}

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

/** Onayı kaydeder ve etiket yöneticilerine bildirir. */
export function saveConsent(choice: Omit<Consent, "decidedAt">) {
  const consent: Consent = { ...choice, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // Depolama kapalıysa yalnızca bu oturum için geçerli olur.
  }
  applyConsent(consent);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: consent }));
}

export function applyConsent({ analytics, marketing }: Pick<Consent, "analytics" | "marketing">) {
  const state = (granted: boolean) => (granted ? "granted" : "denied");
  window.gtag?.("consent", "update", {
    analytics_storage: state(analytics),
    ad_storage: state(marketing),
    ad_user_data: state(marketing),
    ad_personalization: state(marketing),
  });
  window.fbq?.("consent", marketing ? "grant" : "revoke");
}

export function subscribeConsent(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function openConsentPreferences() {
  window.dispatchEvent(new CustomEvent("tws:consent-open"));
}
