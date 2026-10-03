import { describe, expect, it } from "vitest";

import { resolveLayers, showcaseTemplates } from "@/features/showcase/templates";

const asset = (width: number, height: number) => ({
  url: "/media/x.webp",
  alt: "x",
  width,
  height,
});

describe("resolveLayers — slot sözleşmesi", () => {
  it("uyumlu görseli kabul eder", () => {
    const { layers, issues } = resolveLayers("CLOCK_EXPLODED", { dial: asset(1000, 1000) });
    expect(issues).toEqual([]);
    expect(layers.dial?.width).toBe(1000);
  });

  it("%2 tolerans içinde kalan oranı kabul eder", () => {
    expect(resolveLayers("CLOCK_EXPLODED", { dial: asset(1000, 1015) }).issues).toEqual([]);
  });

  it("yanlış oranı, bilinmeyen slotu ve eksik veriyi eler", () => {
    const { layers, issues } = resolveLayers("CLOCK_EXPLODED", {
      dial: asset(1200, 800),
      cabinetDoor: asset(100, 100),
      glass: { url: "/x.webp" },
    });
    expect(layers).toEqual({});
    expect(issues.map((issue) => issue.slot).sort()).toEqual(["cabinetDoor", "dial", "glass"]);
  });

  it("JSON olmayan / dizi girdide boş döner", () => {
    expect(resolveLayers("CABINET_REVEAL", null).layers).toEqual({});
    expect(resolveLayers("CABINET_REVEAL", []).layers).toEqual({});
  });

  it("her şablonun en az bir slotu ve pozitif oranı var", () => {
    for (const template of Object.values(showcaseTemplates)) {
      const slots = Object.values(template.slots);
      expect(slots.length).toBeGreaterThan(0);
      for (const slot of slots) expect(slot.aspectRatio).toBeGreaterThan(0);
    }
  });
});
