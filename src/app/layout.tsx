import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { siteConfig } from "@/config/site";
import { AnalyticsScripts } from "@/services/analytics/analytics-scripts";

import "./globals.css";

// next/font fontları build sırasında indirip kendi domainimizden servis eder
// (harici istek yok, CLS yok). "latin-ext" Türkçe karakterler (ğ, ş, İ) için şart.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#100f0d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-svh font-sans antialiased">
        {children}
        <AnalyticsScripts />
        <noscript>
          <style>{`.split-reveal{visibility:visible!important}`}</style>
        </noscript>
      </body>
    </html>
  );
}
