import { cn } from "@/lib/utils";

/**
 * Ürün fotoğrafı henüz yüklenmemişken kullanılan vektörel "stüdyo çekimi".
 * Kategoriye göre çizim seçer, ürün slug'ından türetilen tohumla küçük
 * varyasyonlar üretir (deterministik → SSR/hydration güvenli).
 */
function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const clockTones = {
  walnut: ["#6b4528", "#2c1a0d"],
  brass: ["#c9a36a", "#7d5c2c"],
  concrete: ["#5c5a57", "#2a2927"],
} as const;

/** Malzeme slug'dan okunur (ceviz/pirinç/beton); bilinmiyorsa tohumla seçilir. */
function clockTone(slug: string, seed: number) {
  if (slug.includes("ceviz")) return clockTones.walnut;
  if (slug.includes("pirinc")) return clockTones.brass;
  if (slug.includes("beton")) return clockTones.concrete;
  return Object.values(clockTones)[seed % 3];
}

function ClockArt({ seed, slug, accent }: { seed: number; slug: string; accent: string }) {
  const minute = (seed % 12) * 30;
  const hour = (seed % 360) + 15;
  const tones = clockTone(slug, seed);
  return (
    <g>
      <circle cx="200" cy="200" r="122" fill={tones[1]} />
      <circle cx="200" cy="200" r="114" fill={tones[0]} />
      <circle cx="200" cy="200" r="100" fill="#ece6da" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x="197"
          y="106"
          width="6"
          height={i % 3 === 0 ? 20 : 12}
          rx="1"
          fill="#24201b"
          transform={`rotate(${i * 30} 200 200)`}
        />
      ))}
      <rect
        x="196"
        y="140"
        width="8"
        height="64"
        rx="4"
        fill="#24201b"
        transform={`rotate(${hour} 200 200)`}
      />
      <rect
        x="197.5"
        y="118"
        width="5"
        height="86"
        rx="2.5"
        fill="#24201b"
        transform={`rotate(${minute} 200 200)`}
      />
      <circle cx="200" cy="200" r="7" fill={accent} />
    </g>
  );
}

function CabinetArt({ accent, mirrorId }: { accent: string; mirrorId: string }) {
  return (
    <g>
      <rect
        x="110"
        y="70"
        width="180"
        height="96"
        rx="6"
        fill="#1f1d1a"
        stroke={accent}
        strokeOpacity="0.5"
      />
      <rect x="120" y="80" width="160" height="76" rx="3" fill="#2d2a26" />
      <rect x="120" y="80" width="160" height="76" rx="3" fill={`url(#${mirrorId})`} />
      <rect x="96" y="196" width="208" height="12" rx="3" fill="#f0ece4" />
      <rect x="104" y="208" width="192" height="116" rx="6" fill="#ebe6dc" />
      <line x1="200" y1="214" x2="200" y2="318" stroke="#cfc8ba" strokeWidth="2" />
      <rect x="182" y="256" width="4" height="26" rx="2" fill={accent} />
      <rect x="214" y="256" width="4" height="26" rx="2" fill={accent} />
    </g>
  );
}

function WaterArt({ accent }: { accent: string }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={102 + i * 42}
          y="120"
          width="30"
          height="190"
          rx="15"
          fill={i % 2 ? "#e9eef0" : "#d9e3e7"}
          stroke={accent}
          strokeOpacity="0.45"
        />
      ))}
      <path
        d="M200 70 C 215 92 228 106 228 122 a28 28 0 0 1 -56 0 c0 -16 13 -30 28 -52z"
        fill={accent}
      />
      <rect x="92" y="300" width="216" height="18" rx="9" fill="#2a2d30" />
    </g>
  );
}

function BookmarkArt({ accent, seed }: { accent: string; seed: number }) {
  return (
    <g>
      <path d="M90 120 Q 200 100 200 130 L 200 320 Q 200 292 90 310 Z" fill="#efe8da" />
      <path d="M310 120 Q 200 100 200 130 L 200 320 Q 200 292 310 310 Z" fill="#e4dccb" />
      <path
        d="M226 80 h34 v170 l-17 -16 l-17 16 z"
        fill={seed % 2 ? accent : "#c9a36a"}
        transform="rotate(6 243 160)"
      />
      <path d="M243 248 q 6 40 -4 70" stroke="#7a2632" strokeWidth="3" fill="none" />
    </g>
  );
}

export function ProductArt({
  categorySlug,
  accent,
  seed,
  className,
}: {
  categorySlug: string;
  accent: string | null;
  seed: string;
  className?: string;
}) {
  const color = accent ?? "#c9a36a";
  const n = hash(seed);
  const gradientId = `art-bg-${n}`;

  return (
    <svg
      viewBox="0 0 400 400"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label="Ürün görseli (illüstrasyon)"
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="70%" stopColor={color} stopOpacity="0.04" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`art-mirror-${n}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#${gradientId})`} />
      <ellipse cx="200" cy="350" rx="120" ry="12" fill="#000" opacity="0.35" />
      {categorySlug === "duvar-saatleri" ? (
        <ClockArt seed={n} slug={seed} accent={color} />
      ) : categorySlug === "banyo-dolaplari" ? (
        <CabinetArt accent={color} mirrorId={`art-mirror-${n}`} />
      ) : categorySlug === "su-aritma-tesisat" ? (
        <WaterArt accent={color} />
      ) : (
        <BookmarkArt accent={color} seed={n} />
      )}
    </svg>
  );
}
