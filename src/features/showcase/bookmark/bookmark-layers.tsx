/** Folio ayraç sahnesinin varsayılan katmanları (sunucu bileşeni). */
const svg = { className: "h-full w-full", "aria-hidden": true, focusable: false } as const;

export function BookLayer() {
  return (
    <svg viewBox="0 0 300 200" {...svg}>
      <defs>
        <linearGradient id="tws-page-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#efe8da" />
          <stop offset="1" stopColor="#d9d0bd" />
        </linearGradient>
        <linearGradient id="tws-page-r" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#f3ede1" />
          <stop offset="1" stopColor="#ddd4c2" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="188" rx="130" ry="8" fill="#000" opacity="0.35" />
      <path d="M18 36 Q85 22 150 34 L150 182 Q85 170 18 184 Z" fill="#6b2f2a" />
      <path d="M282 36 Q215 22 150 34 L150 182 Q215 170 282 184 Z" fill="#6b2f2a" />
      <path d="M24 30 Q88 18 150 30 L150 176 Q88 164 24 178 Z" fill="url(#tws-page-l)" />
      <path d="M276 30 Q212 18 150 30 L150 176 Q212 164 276 178 Z" fill="url(#tws-page-r)" />
      <g stroke="#b5ab97" strokeWidth="1.5" opacity="0.7">
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <path d={`M40 ${52 + i * 13} Q90 ${44 + i * 13} 138 ${52 + i * 13}`} fill="none" />
            <path d={`M162 ${52 + i * 13} Q212 ${44 + i * 13} 260 ${52 + i * 13}`} fill="none" />
          </g>
        ))}
      </g>
      <path d="M150 30 L150 176" stroke="#b5ab97" strokeWidth="2" />
    </svg>
  );
}

export function BookmarkLayer() {
  return (
    <svg viewBox="0 0 50 200" {...svg}>
      <defs>
        <linearGradient id="tws-brass-strip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a6a3a" />
          <stop offset="0.5" stopColor="#e3c58e" />
          <stop offset="1" stopColor="#9b7843" />
        </linearGradient>
      </defs>
      <path d="M6 4 H44 V188 L25 172 L6 188 Z" fill="url(#tws-brass-strip)" />
      <circle cx="25" cy="18" r="5" fill="#2a1f12" />
      <path d="M25 40 v110" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
    </svg>
  );
}

export function TasselLayer() {
  return (
    <svg viewBox="0 0 50 100" {...svg}>
      <path d="M25 0 V30" stroke="#7a2632" strokeWidth="2" />
      <rect x="19" y="28" width="12" height="10" rx="3" fill="#c9a36a" />
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={`M${20 + i * 1.6} 38 Q${18 + i * 2.2} 70 ${14 + i * 3.6} 96`}
          stroke="#8f2d3b"
          strokeWidth="2"
          fill="none"
        />
      ))}
    </svg>
  );
}
