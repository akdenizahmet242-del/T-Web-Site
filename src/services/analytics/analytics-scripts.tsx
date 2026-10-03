import Script from "next/script";

import { PageViewTracker } from "./page-view-tracker";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Üçüncü parti etiketler `afterInteractive` ile yüklenir: ilk boyamayı ve
 * hydration'ı bloklamaz. ID tanımlı değilse hiçbir script eklenmez.
 *
 * KVKK/GDPR: canlıya çıkmadan önce bir onay yöneticisi (Consent Mode v2)
 * bağlanmalı; varsayılan "denied" durumunu burada set edin.
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
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');(window.__fbqQueue||[]).splice(0).forEach(function(a){fbq.apply(null,a)});`}
        </Script>
      ) : null}

      <PageViewTracker />
    </>
  );
}
