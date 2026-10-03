/**
 * Hilton dolap sahnesinin varsayılan katmanları (sunucu bileşeni).
 * Sahne 4:3; kapak açıklığı yatayda %13–87, dikeyde %22–96 bölgesidir
 * (slot kutuları cabinet-scene-client.tsx içinde aynı oranlarla yerleşir).
 */
const svg = { className: "h-full w-full", "aria-hidden": true, focusable: false } as const;

export function CarcassLayer() {
  return (
    <svg viewBox="0 0 400 300" {...svg}>
      <defs>
        <linearGradient id="tws-cab-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f1ea" />
          <stop offset="1" stopColor="#d9d3c7" />
        </linearGradient>
        <linearGradient id="tws-cab-inside" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b554c" />
          <stop offset="1" stopColor="#38342f" />
        </linearGradient>
        <radialGradient id="tws-cab-basin" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d8d4cc" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="296" rx="150" ry="5" fill="#000" opacity="0.35" />
      {/* Gövde ve iç boşluk */}
      <rect x="46" y="62" width="308" height="230" rx="4" fill="url(#tws-cab-body)" />
      <rect x="52" y="66" width="296" height="222" rx="2" fill="url(#tws-cab-inside)" />
      <rect x="52" y="66" width="296" height="4" fill="#c9a36a" opacity="0.9" />
      {/* Tezgah + seramik lavabo */}
      <rect x="36" y="40" width="328" height="24" rx="5" fill="#f8f6f1" />
      <rect x="36" y="58" width="328" height="6" rx="3" fill="#e2ddd3" />
      <ellipse cx="200" cy="46" rx="74" ry="6" fill="url(#tws-cab-basin)" stroke="#cfc9bd" />
      <rect x="196" y="18" width="8" height="24" rx="3" fill="#b9b4ab" />
      <path
        d="M200 20 q22 -2 24 12"
        stroke="#b9b4ab"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Door({ handle }: { handle: "left" | "right" }) {
  const x = handle === "right" ? 176 : 16;
  return (
    <svg viewBox="0 0 200 300" preserveAspectRatio="none" {...svg}>
      <defs>
        <linearGradient id={`tws-door-${handle}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbfaf7" />
          <stop offset="0.6" stopColor="#ece8e0" />
          <stop offset="1" stopColor="#ddd7cc" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="196" height="296" rx="3" fill={`url(#tws-door-${handle})`} />
      <rect
        x="2"
        y="2"
        width="196"
        height="296"
        rx="3"
        fill="none"
        stroke="#cfc8bb"
        strokeWidth="2"
      />
      <rect x={x} y="110" width="8" height="80" rx="4" fill="#b98f4f" />
      <path d="M20 20 L180 280" stroke="#fff" strokeOpacity="0.35" strokeWidth="30" />
    </svg>
  );
}

export const DoorLeftLayer = () => <Door handle="right" />;
export const DoorRightLayer = () => <Door handle="left" />;

export function ShelfTopLayer() {
  return (
    <svg viewBox="0 0 400 100" {...svg}>
      <rect x="0" y="86" width="400" height="8" rx="2" fill="#cfe3e6" opacity="0.75" />
      {/* Şişeler */}
      <rect x="40" y="34" width="34" height="52" rx="8" fill="#e9e3d6" />
      <rect x="50" y="22" width="14" height="14" rx="3" fill="#2a2622" />
      <rect x="92" y="46" width="28" height="40" rx="6" fill="#b98f4f" />
      <rect x="100" y="36" width="12" height="12" rx="2" fill="#2a2622" />
      <rect x="250" y="40" width="60" height="46" rx="10" fill="#f4f1ea" />
      <circle cx="350" cy="70" r="16" fill="#9fb3b8" />
    </svg>
  );
}

export function ShelfBottomLayer() {
  return (
    <svg viewBox="0 0 400 100" {...svg}>
      <rect x="0" y="86" width="400" height="8" rx="2" fill="#cfe3e6" opacity="0.75" />
      {/* Katlanmış havlular */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={36 + i * 6}
          y={70 - i * 16}
          width="130"
          height="16"
          rx="6"
          fill={["#e8e1d4", "#d7cfc0", "#f2ede4"][i]}
        />
      ))}
      {[0, 1].map((i) => (
        <rect
          key={i}
          x={220 + i * 4}
          y={70 - i * 16}
          width="140"
          height="16"
          rx="6"
          fill={["#9fb3b8", "#b9c8cb"][i]}
        />
      ))}
    </svg>
  );
}
