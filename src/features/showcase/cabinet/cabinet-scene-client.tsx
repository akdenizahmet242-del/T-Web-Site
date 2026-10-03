"use client";

import type { ReactNode } from "react";

import { ScrollScene, type SceneBuildContext } from "../scroll-scene";

export type CabinetSlot = "carcass" | "shelfTop" | "shelfBottom" | "doorLeft" | "doorRight";

/** Slot kutuları (sahnenin yüzdesi) — şablon sözleşmesindeki en-boy oranlarıyla uyumlu. */
const boxes: Record<CabinetSlot, { left: string; top: string; width: string; height: string }> = {
  carcass: { left: "0%", top: "0%", width: "100%", height: "100%" },
  shelfTop: { left: "13%", top: "24%", width: "74%", height: "24.67%" },
  shelfBottom: { left: "13%", top: "60%", width: "74%", height: "24.67%" },
  doorLeft: { left: "13%", top: "22%", width: "37%", height: "74%" },
  doorRight: { left: "50%", top: "22%", width: "37%", height: "74%" },
};

const order: CabinetSlot[] = ["carcass", "shelfTop", "shelfBottom", "doorLeft", "doorRight"];

function build({ tl, layer, q, stage, desktop }: SceneBuildContext) {
  const rig = q("[data-rig]")[0];
  const glow = q("[data-glow]")[0];
  const depth = (ratio: number) => () => stage.offsetWidth * ratio;

  // Faz 1 · kapaklar menteşe ekseninde açılır, iç LED yanar
  tl.to(rig, { rotationY: desktop ? -14 : -8, rotationX: 4, duration: 3, ease: "power2.inOut" }, 0)
    .to(layer("doorLeft"), { rotationY: -112, duration: 2.6, ease: "power2.inOut" }, 0.3)
    .to(layer("doorRight"), { rotationY: 112, duration: 2.6, ease: "power2.inOut" }, 0.45)
    .fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 1.6 }, 1.2);

  // Faz 2 · raflar öne kayar (frenli tam açılım ray)
  tl.to(
    layer("shelfTop"),
    { z: depth(0.16), yPercent: -6, duration: 2.2, ease: "power2.out" },
    3.6,
  ).to(
    layer("shelfBottom"),
    { z: depth(0.28), yPercent: 8, duration: 2.4, ease: "power2.out" },
    3.9,
  );

  // Faz 3 · raflar geri, kapaklar "yavaşlatıcılı" kapanır: son bölümde belirgin yavaşlama
  tl.to(
    [layer("shelfTop"), layer("shelfBottom")],
    { z: 0, yPercent: 0, duration: 1.6, ease: "power2.inOut" },
    6.9,
  )
    .to(layer("doorLeft"), { rotationY: 0, duration: 2.2, ease: "expo.out" }, 7.6)
    .to(layer("doorRight"), { rotationY: 0, duration: 2.2, ease: "expo.out" }, 7.75)
    .to(glow, { opacity: 0, duration: 1 }, 8.6)
    .to(rig, { rotationY: 0, rotationX: 0, duration: 2, ease: "power2.inOut" }, 8);
}

export function CabinetSceneClient({
  layers,
  ...copy
}: {
  layers: Record<CabinetSlot, ReactNode>;
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  steps: { title: string; body: string }[];
}) {
  return (
    <ScrollScene
      {...copy}
      aspect="4 / 3"
      stageLabel="Hilton banyo dolabı: kapaklar açılır, raflar öne kayar"
      stageClassName="w-[min(86vw,48svh)] sm:w-[min(80vw,56svh)] lg:w-[min(46vw,78svh)]"
      build={build}
    >
      <div data-rig className="absolute inset-0 will-change-transform transform-3d">
        {order.map((slot) => (
          <div
            key={slot}
            data-layer={slot}
            className="absolute will-change-transform"
            style={{
              ...boxes[slot],
              transformOrigin:
                slot === "doorLeft" ? "0% 50%" : slot === "doorRight" ? "100% 50%" : "50% 50%",
            }}
          >
            {layers[slot]}
          </div>
        ))}
        {/* LED iç aydınlatma — slot değil, sahnenin kendi efekti (yalnızca opacity) */}
        <div
          data-glow
          aria-hidden
          className="pointer-events-none absolute opacity-0"
          style={{
            left: "13%",
            top: "22%",
            width: "74%",
            height: "40%",
            background:
              "radial-gradient(60% 80% at 50% 0%, rgba(255,228,180,0.45), transparent 70%)",
          }}
        />
      </div>
    </ScrollScene>
  );
}
