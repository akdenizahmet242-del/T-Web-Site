"use client";

import type { ReactNode } from "react";

import { ScrollScene, type SceneBuildContext } from "../scroll-scene";

export type BookmarkSlot = "book" | "bookmark" | "tassel";

function build({ tl, layer, q }: SceneBuildContext) {
  const page = q("[data-page]")[0];

  // Faz 1 · ayraç yukarıdan süzülür, cilt arasına yerleşir; püskül sarkaç gibi salınır
  tl.fromTo(
    layer("bookmark"),
    { yPercent: -70, rotation: -10 },
    { yPercent: 0, rotation: 0, duration: 3.2, ease: "power3.out" },
    0,
  )
    .fromTo(
      layer("tassel"),
      { yPercent: -150, rotation: 24 },
      { yPercent: 0, rotation: 0, duration: 3.2, ease: "power3.out" },
      0,
    )
    .to(
      layer("tassel"),
      { keyframes: { rotation: [0, -14, 10, -6, 3, 0] }, duration: 2.2, ease: "none" },
      3,
    );

  // Faz 2 · sayfa çevrilir (cilt ekseninde 3D), ayraç yerinde kalır
  tl.fromTo(page, { rotationY: 0, autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 5)
    .to(page, { rotationY: -178, duration: 3, ease: "power2.inOut" }, 5.2)
    .to(page, { autoAlpha: 0, duration: 0.3 }, 8.3)
    .to(
      layer("bookmark"),
      { yPercent: -6, duration: 1.2, ease: "power1.inOut", yoyo: true, repeat: 1 },
      7.2,
    );
}

export function BookmarkSceneClient({
  layers,
  ...copy
}: {
  layers: Record<BookmarkSlot, ReactNode>;
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  steps: { title: string; body: string }[];
}) {
  return (
    <ScrollScene
      {...copy}
      aspect="3 / 2"
      stageLabel="Folio pirinç ayraç açık kitabın sayfaları arasına yerleşir"
      stageClassName="w-[min(88vw,52svh)] sm:w-[min(84vw,64svh)] lg:w-[min(48vw,90svh)]"
      build={build}
    >
      <div className="absolute inset-0 transform-3d">
        {/* Ayraç kitabın ARKASINDA: sayfaların arasında kalır, yalnızca üstten taşan
            kısmı görünür — fiziksel olarak doğru katman sırası. */}
        <div
          data-layer="bookmark"
          className="absolute will-change-transform"
          style={{ left: "51%", top: "4%", width: "7%", height: "42%" }}
        >
          {layers.bookmark}
        </div>
        <div data-layer="book" className="absolute inset-0">
          {layers.book}
        </div>
        {/* Çevrilen sayfa: slot değil, sahnenin efekti — cilt (sol kenar) ekseninde döner */}
        <div
          data-page
          aria-hidden
          className="invisible absolute rounded-r-sm opacity-0 will-change-transform backface-hidden"
          style={{
            left: "50%",
            top: "15%",
            width: "42%",
            height: "73%",
            transformOrigin: "0% 50%",
            background: "linear-gradient(90deg,#d9d0bd,#f3ede1 40%,#ebe3d3)",
          }}
        />
        <div
          data-layer="tassel"
          className="absolute will-change-transform"
          style={{
            // Ayracın deliğinden sarkar, sayfanın üzerine düşer
            left: "51.25%",
            top: "6%",
            width: "6.5%",
            height: "19.5%",
            transformOrigin: "50% 0%",
          }}
        >
          {layers.tassel}
        </div>
      </div>
    </ScrollScene>
  );
}
