/**
 * Pura arıtma sahnesinin varsayılan katmanları (sunucu bileşeni).
 * Her slot 1:2 dikey bir tuvaldir: kartuş tuvalin ortasında, ayakta durur.
 */
const svg = {
  viewBox: "0 0 100 200",
  className: "h-full w-full",
  "aria-hidden": true,
  focusable: false,
} as const;

function Cartridge({
  id,
  body,
  band,
  pattern,
}: {
  id: string;
  body: [string, string];
  band: string;
  pattern: "dots" | "grain" | "rings" | "lines";
}) {
  return (
    <svg {...svg}>
      <defs>
        <linearGradient id={`tws-cart-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={body[1]} />
          <stop offset="0.45" stopColor={body[0]} />
          <stop offset="1" stopColor={body[1]} />
        </linearGradient>
        <clipPath id={`tws-cart-clip-${id}`}>
          <rect x="22" y="26" width="56" height="150" rx="10" />
        </clipPath>
      </defs>
      <rect x="22" y="26" width="56" height="150" rx="10" fill={`url(#tws-cart-${id})`} />
      <g clipPath={`url(#tws-cart-clip-${id})`} opacity="0.35">
        {pattern === "dots"
          ? Array.from({ length: 40 }, (_, i) => (
              <circle
                key={i}
                cx={26 + ((i * 17) % 52)}
                cy={32 + ((i * 29) % 140)}
                r="1.6"
                fill="#3b2a12"
              />
            ))
          : pattern === "grain"
            ? Array.from({ length: 16 }, (_, i) => (
                <rect key={i} x="22" y={30 + i * 9} width="56" height="3" fill="#111" />
              ))
            : pattern === "rings"
              ? Array.from({ length: 6 }, (_, i) => (
                  <rect key={i} x={26 + i * 8} y="26" width="2" height="150" fill="#fff" />
                ))
              : Array.from({ length: 12 }, (_, i) => (
                  <circle key={i} cx="50" cy={36 + i * 12} r="3" fill="#fff" />
                ))}
      </g>
      <rect x="22" y="18" width="56" height="14" rx="5" fill={band} />
      <rect x="22" y="170" width="56" height="14" rx="5" fill={band} />
      <rect x="44" y="8" width="12" height="12" rx="3" fill="#8b8f93" />
    </svg>
  );
}

export const SedimentLayer = () => (
  <Cartridge id="sediment" body={["#efe6d5", "#c9b996"]} band="#7c6a4d" pattern="dots" />
);
export const CarbonLayer = () => (
  <Cartridge id="carbon" body={["#4a4a4c", "#242426"]} band="#8b8f93" pattern="grain" />
);
export const MembraneLayer = () => (
  <Cartridge id="membrane" body={["#e9eef0", "#b9c8cb"]} band="#5aa9c9" pattern="rings" />
);
export const MineralLayer = () => (
  <Cartridge id="mineral" body={["#d6ecf3", "#8cc3d6"]} band="#3d7f99" pattern="lines" />
);

export function HousingLayer() {
  return (
    <svg {...svg}>
      <defs>
        <linearGradient id="tws-housing" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect
        x="14"
        y="16"
        width="72"
        height="176"
        rx="16"
        fill="url(#tws-housing)"
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      <rect x="10" y="6" width="80" height="18" rx="6" fill="#d9dde0" />
      <rect x="30" y="0" width="40" height="8" rx="3" fill="#a9aeb3" />
      <text
        x="50"
        y="112"
        textAnchor="middle"
        fontSize="11"
        letterSpacing="3"
        fill="#ffffff"
        opacity="0.8"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        PURA
      </text>
    </svg>
  );
}
