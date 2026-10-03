import type { ReactNode } from "react";

import { LayerSlot } from "../layer-slot";
import type { ShowcaseData } from "../queries";

import {
  BezelLayer,
  CaseLayer,
  DialLayer,
  GlassLayer,
  HourHandLayer,
  MinuteHandLayer,
  MovementLayer,
  SecondHandLayer,
} from "./clock-layers";
import { ClockShowcaseClient, type ClockCallout, type ClockSlot } from "./clock-showcase-client";

const defaults = {
  eyebrow: "Meridyen · Ceviz Duvar Saati",
  title: "Zamanın anatomisi",
  subtitle: "Kaydırın; saat zamanı ileri sarsın, ardından katman katman açılsın.",
  ctaLabel: "Meridyen'i incele",
  ctaHref: "/urun/meridyen-ceviz-duvar-saati",
  steps: [
    {
      title: "Sessiz bir saat",
      body: "Süpürme mekanizma ibreleri tik-tak olmadan, kesintisiz hareket ettirir.",
    },
    {
      title: "Katman katman",
      body: "Masif ceviz kasa, quartz mekanizma, lake kadran, pirinç ibreler ve mineral cam.",
    },
    {
      title: "Yeniden bir bütün",
      body: "400 mm çap, 48 mm derinlik, 1,65 kg. Duvara iki vidayla, ömür boyu.",
    },
  ],
};

// Patlatılmış görünümde üstten alta (öndeki katmandan arkadakine) sıralı.
const callouts: ClockCallout[] = [
  { id: "bezel", label: "Masif ceviz çerçeve", detail: "Tek parça, doğal yağ bitiş" },
  { id: "glass", label: "Mineral cam", detail: "Yansıma önleyici kaplama" },
  { id: "hands", label: "Pirinç ibreler", detail: "El işçiliği, karartılmış" },
  { id: "dial", label: "Mat lake kadran", detail: "Ø 340 mm" },
  { id: "movement", label: "Süpürme mekanizma", detail: "Sessiz quartz · 1×AA" },
  { id: "case", label: "Arka kasa", detail: "Gizli askı yuvası" },
];

const fallbacks: Record<ClockSlot, ReactNode> = {
  case: <CaseLayer />,
  movement: <MovementLayer />,
  dial: <DialLayer />,
  hourHand: <HourHandLayer />,
  minuteHand: <MinuteHandLayer />,
  secondHand: <SecondHandLayer />,
  glass: <GlassLayer />,
  bezel: <BezelLayer />,
};

const LAYER_SIZES = "(min-width: 1024px) 36vw, 80vw";

/**
 * Sunucu bileşeni: vitrin verisini (panelden) şablon varsayılanlarıyla
 * birleştirir, katman içeriklerini sunucuda render eder ve animasyonu
 * yürüten istemci bileşenine yalnızca hazır düğümleri verir.
 */
export function ClockShowcase({ data }: { data: ShowcaseData<"CLOCK_EXPLODED"> | null }) {
  const layers = Object.fromEntries(
    (Object.keys(fallbacks) as ClockSlot[]).map((slot) => [
      slot,
      <LayerSlot
        key={slot}
        asset={data?.layers[slot]}
        fallback={fallbacks[slot]}
        sizes={LAYER_SIZES}
      />,
    ]),
  ) as Record<ClockSlot, ReactNode>;

  const steps = data?.content.steps.length ? data.content.steps : defaults.steps;

  return (
    <ClockShowcaseClient
      eyebrow={data?.eyebrow ?? defaults.eyebrow}
      title={data?.title ?? defaults.title}
      subtitle={data?.subtitle ?? defaults.subtitle}
      ctaLabel={data?.ctaLabel ?? defaults.ctaLabel}
      ctaHref={data?.ctaHref ?? defaults.ctaHref}
      steps={steps.slice(0, 3)}
      callouts={callouts}
      layers={layers}
    />
  );
}
