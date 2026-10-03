"use client";

import type { ReactNode } from "react";

import { ScrollScene, type SceneBuildContext } from "../scroll-scene";

export type FilterSlot = "housing" | "sediment" | "carbon" | "membrane" | "mineral";

const cartridges: { slot: Exclude<FilterSlot, "housing">; label: string }[] = [
  { slot: "sediment", label: "Sediment" },
  { slot: "carbon", label: "Karbon" },
  { slot: "membrane", label: "Membran" },
  { slot: "mineral", label: "Mineral" },
];

// Kartuş kutusu: sahne genişliğinin %14'ü, yüksekliği 2 katı (1:2 slot sözleşmesi).
const BOX_WIDTH = 14;
const SPREAD = 19; // dağılımda kartuşlar arası mesafe (% sahne genişliği)

function build({ tl, layer, q, stage }: SceneBuildContext) {
  const drop = q("[data-drop]")[0];
  const labels = q("[data-filter-label]");

  // Faz 1 · dış gövde yukarı kalkar ve saydamlaşır
  tl.to(
    layer("housing"),
    { yPercent: -72, scale: 0.92, autoAlpha: 0.12, duration: 2.4, ease: "power2.inOut" },
    0.2,
  );

  // Faz 2 · kartuşlar soldan sağa sıraya dizilir (filtrasyon sırası)
  cartridges.forEach(({ slot }, index) => {
    const offset = (index - (cartridges.length - 1) / 2) * SPREAD;
    tl.to(
      layer(slot),
      { xPercent: (offset / BOX_WIDTH) * 100, rotationY: -12, duration: 2.4, ease: "power3.inOut" },
      2.4 + index * 0.08,
    );
  });
  tl.fromTo(
    labels,
    { autoAlpha: 0, y: 8 },
    { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 },
    4.2,
  );

  // Damla filtreleri sırayla geçer, rengi bulanıktan berraka döner (yalnızca transform + renk)
  tl.fromTo(drop, { autoAlpha: 0, x: 0 }, { autoAlpha: 1, duration: 0.3 }, 4.6)
    .to(drop, { x: () => stage.offsetWidth * 0.84, duration: 2.6, ease: "none" }, 4.9)
    .to(
      drop,
      {
        keyframes: { backgroundColor: ["#8a6a3a", "#7d7a6a", "#7fb2c4", "#5aa9c9"] },
        duration: 2.6,
        ease: "none",
      },
      4.9,
    )
    .to(drop, { autoAlpha: 0, duration: 0.3 }, 7.5);

  // Faz 3 · yeniden birleşir
  tl.to(labels, { autoAlpha: 0, duration: 0.4 }, 7.4);
  tl.to(
    cartridges.map(({ slot }) => layer(slot)),
    { xPercent: 0, rotationY: 0, duration: 2, ease: "power3.inOut", stagger: 0.05 },
    7.6,
  ).to(
    layer("housing"),
    { yPercent: 0, scale: 1, autoAlpha: 1, duration: 2, ease: "power3.inOut" },
    8,
  );
}

export function FilterSceneClient({
  layers,
  ...copy
}: {
  layers: Record<FilterSlot, ReactNode>;
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  steps: { title: string; body: string }[];
}) {
  const box = { width: `${BOX_WIDTH}%`, height: `${BOX_WIDTH * 2 * (16 / 9)}%` };

  return (
    <ScrollScene
      {...copy}
      aspect="16 / 9"
      stageLabel="Pura arıtma: gövde açılır, sediment, karbon, membran ve mineral filtreleri sıralanır"
      stageClassName="w-[min(92vw,62svh)] sm:w-[min(88vw,80svh)] lg:w-[min(56vw,110svh)]"
      build={build}
    >
      <div className="absolute inset-0 transform-3d">
        {cartridges.map(({ slot, label }) => (
          <div
            key={slot}
            data-layer={slot}
            className="absolute will-change-transform"
            style={{ ...box, left: `${50 - BOX_WIDTH / 2}%`, top: "16%" }}
          >
            {layers[slot]}
            <span
              data-filter-label
              className="invisible absolute inset-x-0 -bottom-6 text-center font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase opacity-0 motion-reduce:visible motion-reduce:opacity-100"
            >
              {label}
            </span>
          </div>
        ))}
        <div
          data-layer="housing"
          className="absolute will-change-transform"
          style={{
            width: `${BOX_WIDTH * 1.4}%`,
            height: `${BOX_WIDTH * 2.8 * (16 / 9)}%`,
            left: `${50 - BOX_WIDTH * 0.7}%`,
            top: "6%",
          }}
        >
          {layers.housing}
        </div>
        {/* Su hattı (statik) ve üzerinde ilerleyen damla */}
        <span
          aria-hidden
          className="absolute h-px bg-border"
          style={{ top: "86%", left: "8%", width: "84%" }}
        />
        <span
          data-drop
          aria-hidden
          className="invisible absolute size-3 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] opacity-0"
          style={{ top: "calc(86% - 0.75rem)", left: "8%", backgroundColor: "#8a6a3a" }}
        />
      </div>
    </ScrollScene>
  );
}
