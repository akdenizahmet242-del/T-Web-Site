import type { ReactNode } from "react";

import type { ShowcaseTemplate } from "@/generated/prisma/enums";

import { BookLayer, BookmarkLayer, TasselLayer } from "./bookmark/bookmark-layers";
import { BookmarkSceneClient } from "./bookmark/bookmark-scene-client";
import {
  CarcassLayer,
  DoorLeftLayer,
  DoorRightLayer,
  ShelfBottomLayer,
  ShelfTopLayer,
} from "./cabinet/cabinet-layers";
import { CabinetSceneClient } from "./cabinet/cabinet-scene-client";
import { ClockShowcase } from "./clock/clock-showcase";
import { LayerSlot } from "./layer-slot";
import {
  CarbonLayer,
  HousingLayer,
  MembraneLayer,
  MineralLayer,
  SedimentLayer,
} from "./layer-stack/filter-layers";
import { FilterSceneClient } from "./layer-stack/filter-scene-client";
import { getShowcase, type ShowcaseData } from "./queries";
import type { LayerAsset } from "./templates";

/** Slot → (panel görseli ya da varsayılan SVG) düğümü */
function resolveNodes<K extends string>(
  fallbacks: Record<K, ReactNode>,
  assets: Partial<Record<K, LayerAsset>> | undefined,
  sizes: string,
) {
  return Object.fromEntries(
    (Object.keys(fallbacks) as K[]).map((slot) => [
      slot,
      <LayerSlot key={slot} asset={assets?.[slot]} fallback={fallbacks[slot]} sizes={sizes} />,
    ]),
  ) as Record<K, ReactNode>;
}

function copyFrom<T extends ShowcaseTemplate>(
  data: ShowcaseData<T> | null,
  defaults: { eyebrow: string; title: string; steps: { title: string; body: string }[] },
) {
  return {
    eyebrow: data?.eyebrow ?? defaults.eyebrow,
    title: data?.title ?? defaults.title,
    subtitle: data?.subtitle,
    steps: data?.content.steps.length ? data.content.steps : defaults.steps,
  };
}

/**
 * Ürün sayfası sahnesi. İçerik ve slot görselleri `product:<slug>` anahtarlı
 * vitrin kaydından gelir (panelden düzenlenir); kayıt yoksa şablon varsayılanları.
 */
export async function ProductScene({
  template,
  slug,
  productName,
}: {
  template: ShowcaseTemplate;
  slug: string;
  productName: string;
}) {
  const key = `product:${slug}`;

  switch (template) {
    case "CLOCK_EXPLODED": {
      const data =
        (await getShowcase(key, "CLOCK_EXPLODED")) ??
        (await getShowcase("home-clock-showcase", "CLOCK_EXPLODED"));
      return <ClockShowcase data={data} />;
    }
    case "CABINET_REVEAL": {
      const data = await getShowcase(key, "CABINET_REVEAL");
      return (
        <CabinetSceneClient
          {...copyFrom(data, {
            eyebrow: productName,
            title: "Kapağın ardındaki düzen",
            steps: [
              {
                title: "Yavaşlatıcılı kapaklar",
                body: "Menteşeler son santimetrelerde kendiliğinden yavaşlar.",
              },
              {
                title: "Her şeyin bir yeri var",
                body: "Ayarlanabilir raflar ve frenli tam açılım çekmece.",
              },
              { title: "Sessizce kapanır", body: "Kapaklar çarpmadan, yumuşakça yerine oturur." },
            ],
          })}
          layers={resolveNodes(
            {
              carcass: <CarcassLayer />,
              shelfTop: <ShelfTopLayer />,
              shelfBottom: <ShelfBottomLayer />,
              doorLeft: <DoorLeftLayer />,
              doorRight: <DoorRightLayer />,
            },
            data?.layers,
            "(min-width: 1024px) 46vw, 86vw",
          )}
        />
      );
    }
    case "LAYER_STACK": {
      const data = await getShowcase(key, "LAYER_STACK");
      return (
        <FilterSceneClient
          {...copyFrom(data, {
            eyebrow: productName,
            title: "Katman katman saf su",
            steps: [
              {
                title: "Gövde açılır",
                body: "Gıdaya uygun şeffaf gövde, filtreleri tek hamlede değiştirmenizi sağlar.",
              },
              {
                title: "Dört aşama",
                body: "Sediment, karbon, membran ve mineral: su her birinden sırayla geçer.",
              },
              {
                title: "Yeniden bir arada",
                body: "Tezgah altında 38 cm genişlik, pompasız sessiz çalışma.",
              },
            ],
          })}
          layers={resolveNodes(
            {
              housing: <HousingLayer />,
              sediment: <SedimentLayer />,
              carbon: <CarbonLayer />,
              membrane: <MembraneLayer />,
              mineral: <MineralLayer />,
            },
            data?.layers,
            "(min-width: 1024px) 12vw, 25vw",
          )}
        />
      );
    }
    case "BOOKMARK_FLIP": {
      const data = await getShowcase(key, "BOOKMARK_FLIP");
      return (
        <BookmarkSceneClient
          {...copyFrom(data, {
            eyebrow: productName,
            title: "Kaldığınız sayfa",
            steps: [
              { title: "İnce ve sağlam", body: "Sayfaya iz bırakmayan yuvarlatılmış kenarlar." },
              {
                title: "Sayfalar döner, ayraç kalır",
                body: "İpek püskül kitabın dışından yerinizi gösterir.",
              },
            ],
          })}
          layers={resolveNodes(
            { book: <BookLayer />, bookmark: <BookmarkLayer />, tassel: <TasselLayer /> },
            data?.layers,
            "(min-width: 1024px) 48vw, 88vw",
          )}
        />
      );
    }
    default:
      return null;
  }
}
