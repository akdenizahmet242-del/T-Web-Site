/**
 * Dişli silüeti üretir (SVG path). Sunucu ve istemci aynı string'i üretsin diye
 * koordinatlar 2 haneye yuvarlanır (hydration uyumsuzluğu olmaz).
 */
export function gearPath(teeth: number, outerRadius: number, rootRadius: number, center: number) {
  const step = (Math.PI * 2) / teeth;
  const point = (radius: number, angle: number) =>
    `${(center + radius * Math.cos(angle)).toFixed(2)} ${(center + radius * Math.sin(angle)).toFixed(2)}`;

  const segments: string[] = [];
  for (let i = 0; i < teeth; i += 1) {
    const a = i * step;
    segments.push(
      point(rootRadius, a),
      point(outerRadius, a + step * 0.18),
      point(outerRadius, a + step * 0.42),
      point(rootRadius, a + step * 0.6),
    );
  }
  return `M${segments.join("L")}Z`;
}

export type GearSpec = {
  id: string;
  /** 1000×1000 tuval üzerindeki merkez */
  cx: number;
  cy: number;
  radius: number;
  teeth: number;
  spokes: number;
  /** Merkez çarka göre açısal hız oranı (diş sayısı oranı, yön dahil) */
  ratio: number;
};

const CENTER_TEETH = 40;

/** Birbirine kenetlenen dişli takımı — oranlar diş sayılarından türetilir. */
export const gearTrain: GearSpec[] = [
  { id: "center", cx: 500, cy: 500, radius: 150, teeth: CENTER_TEETH, spokes: 5, ratio: 1 },
  { id: "third", cx: 690, cy: 365, radius: 95, teeth: 24, spokes: 4, ratio: -CENTER_TEETH / 24 },
  { id: "fourth", cx: 365, cy: 662, radius: 70, teeth: 18, spokes: 3, ratio: -CENTER_TEETH / 18 },
  { id: "escape", cx: 740, cy: 490, radius: 55, teeth: 14, spokes: 3, ratio: CENTER_TEETH / 14 },
];
