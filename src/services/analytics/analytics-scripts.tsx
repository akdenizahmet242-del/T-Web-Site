import Script from "next/script";

import { PageViewTracker } from "./page-view-tracker";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Root layout'ta `beforeInteractive` ile çalıştırılır (bkz. app/layout.tsx). */
export const CONSENT_DEFAULTS_SCRIPT = GTM_ID
  ? `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});try{var c=JSON.parse(localStorage.getItem('tws-consent'));if(c){var g=function(v){return v?'granted':'denied'};gtag('consent','update',{analytics_storage:g(c.analytics),ad_storage:g(c.marketing),ad_user_data:g(c.marketing),ad_personalization:g(c.marketing)});}}catch(e){}`
  : null;

/**
 * Üçüncü parti etiketler `afterInteractive` ile yüklenir: ilk boyamayı ve
 * hydration'ı bloklamaz. ID tanımlı değilse hiçbir script eklenmez.
 *
 * KVKK/GDPR: Consent Mode v2 varsayılanı "denied"; kullanıcı çerez bildiriminde
 * seçim yapınca features/consent → `consent update` / `fbq('consent','grant')`.
 */
export function AnalyticsScripts() {
  return (
    <>
      {GTM_ID ? (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      ) : null}

      {META_PIXEL_ID ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');var c=null;try{c=JSON.parse(localStorage.getItem('tws-consent'))}catch(e){}fbq('consent',c&&c.marketing?'grant':'revoke');fbq('init','${META_PIXEL_ID}');(window.__fbqQueue||[]).splice(0).forEach(function(a){fbq.apply(null,a)});`}
        </Script>
      ) : null}

      <PageViewTracker />
    </>
  );
}
