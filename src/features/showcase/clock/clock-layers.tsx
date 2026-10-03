import type { CSSProperties } from "react";

import { gearPath, gearTrain, type GearSpec } from "./gear";

/**
 * Meridyen saatinin varsayılan katmanları.
 *
 * Her katman 1000×1000'lik kare bir tuvaldir ve merkezi (500,500) pivot
 * noktasıdır. Panelden yüklenecek görseller de aynı sözleşmeye uymalıdır
 * (bkz. showcase/templates.ts → CLOCK_EXPLODED). Bu bileşenler sunucuda
 * render edilir; SVG işaretlemesi istemci JS paketine girmez.
 */

const C = 500;
const svgProps = {
  viewBox: "0 0 1000 1000",
  className: "h-full w-full",
  "aria-hidden": true,
  focusable: false,
} as const;

const displayFont: CSSProperties = { fontFamily: "var(--font-instrument-serif), serif" };
const monoFont: CSSProperties = { fontFamily: "var(--font-geist-mono), monospace" };

/** Ahşap damarı — kapalı yollar değil, hafif dalgalı çizgiler. */
function WoodGrain({ opacity = 0.18 }: { opacity?: number }) {
  const lines = Array.from({ length: 17 }, (_, i) => {
    const y = 70 + i * 54;
    const sway = i % 2 === 0 ? 22 : -16;
    return `M 0 ${y} Q 250 ${y - sway} 500 ${y + sway / 3} T 1000 ${y - sway / 2}`;
  });
  return (
    <g stroke="#1a0f07" strokeWidth="3" fill="none" opacity={opacity}>
      {lines.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

export function CaseLayer() {
  return (
    <svg {...svgProps}>
      <defs>
        <radialGradient id="tws-case-wood" cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#7a5030" />
          <stop offset="55%" stopColor="#4a2f1a" />
          <stop offset="100%" stopColor="#24160b" />
        </radialGradient>
        <clipPath id="tws-case-clip">
          <circle cx={C} cy={C} r="470" />
        </clipPath>
      </defs>
      <circle cx={C} cy={C} r="470" fill="url(#tws-case-wood)" />
      <g clipPath="url(#tws-case-clip)">
        <WoodGrain />
      </g>
      <circle cx={C} cy={C} r="340" fill="#000" opacity="0.28" />
      <circle
        cx={C}
        cy={C}
        r="340"
        fill="none"
        stroke="#c9a36a"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <rect x="462" y="120" width="76" height="34" rx="17" fill="#120a05" />
      <text
        x={C}
        y="805"
        textAnchor="middle"
        fontSize="26"
        letterSpacing="10"
        fill="#f3e7d3"
        opacity="0.22"
        style={monoFont}
      >
        T ATELIER · ISTANBUL
      </text>
    </svg>
  );
}

function Gear({ gear }: { gear: GearSpec }) {
  const size = gear.radius * 2 + 4;
  const mid = size / 2;
  const root = gear.radius - Math.max(9, gear.radius * 0.09);
  const gradientId = `tws-gear-${gear.id}`;
  const spokeInner = gear.radius * 0.24;
  const spokeOuter = root * 0.78;

  return (
    <div
      data-gear={gear.id}
      data-ratio={gear.ratio}
      className="absolute will-change-transform"
      style={{
        left: `${(gear.cx - mid) / 10}%`,
        top: `${(gear.cy - mid) / 10}%`,
        width: `${size / 10}%`,
        height: `${size / 10}%`,
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" aria-hidden focusable={false}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0d49a" />
            <stop offset="50%" stopColor="#c59a55" />
            <stop offset="100%" stopColor="#7d5c2c" />
          </linearGradient>
        </defs>
        <path d={gearPath(gear.teeth, gear.radius, root, mid)} fill={`url(#${gradientId})`} />
        {/* Kollar arasındaki boşluklar */}
        <g fill="#1d140b" opacity="0.72">
          {Array.from({ length: gear.spokes }, (_, i) => {
            const a0 = (i / gear.spokes) * Math.PI * 2 + 0.22;
            const a1 = ((i + 1) / gear.spokes) * Math.PI * 2 - 0.22;
            const p = (r: number, a: number) =>
              `${(mid + r * Math.cos(a)).toFixed(2)} ${(mid + r * Math.sin(a)).toFixed(2)}`;
            return (
              <path
                key={i}
                d={`M${p(spokeInner, a0)}L${p(spokeOuter, a0)}A${spokeOuter} ${spokeOuter} 0 0 1 ${p(spokeOuter, a1)}L${p(spokeInner, a1)}A${spokeInner} ${spokeInner} 0 0 0 ${p(spokeInner, a0)}Z`}
              />
            );
          })}
        </g>
        <circle cx={mid} cy={mid} r={gear.radius * 0.16} fill="#8a6a3a" />
        {/* Yakut taş yatağı */}
        <circle cx={mid} cy={mid} r={gear.radius * 0.08} fill="#a3243b" />
        <circle cx={mid - 2} cy={mid - 2} r={gear.radius * 0.03} fill="#f7b5c2" opacity="0.8" />
      </svg>
    </div>
  );
}

export function MovementLayer() {
  return (
    <div className="relative h-full w-full">
      <svg {...svgProps}>
        <defs>
          <linearGradient id="tws-plate" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5c4522" />
            <stop offset="45%" stopColor="#a8854a" />
            <stop offset="100%" stopColor="#5a4320" />
          </linearGradient>
        </defs>
        <circle cx={C} cy={C} r="330" fill="url(#tws-plate)" />
        {/* Cenevre dalgası benzeri dairesel yiv işçiliği */}
        <g fill="none" stroke="#fff3d6" strokeOpacity="0.07" strokeWidth="2">
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={i} cx={C} cy={C} r={40 + i * 21} />
          ))}
        </g>
        <circle cx={C} cy={C} r="330" fill="none" stroke="#2c1f0e" strokeWidth="6" />
        {[45, 135, 225, 315].map((deg) => {
          const a = (deg * Math.PI) / 180;
          const x = (C + 285 * Math.cos(a)).toFixed(2);
          const y = (C + 285 * Math.sin(a)).toFixed(2);
          return (
            <g key={deg} transform={`translate(${x} ${y}) rotate(${deg + 20})`}>
              <circle r="16" fill="#3a3a3c" />
              <circle r="16" fill="none" stroke="#9a9aa0" strokeWidth="2" />
              <rect x="-12" y="-2.5" width="24" height="5" fill="#141416" />
            </g>
          );
        })}
      </svg>
      {gearTrain.map((gear) => (
        <Gear key={gear.id} gear={gear} />
      ))}
    </div>
  );
}

export function DialLayer() {
  return (
    <svg {...svgProps}>
      <defs>
        <radialGradient id="tws-dial" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#f6f1e6" />
          <stop offset="80%" stopColor="#e7e0d1" />
          <stop offset="100%" stopColor="#d6cdbb" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r="430" fill="url(#tws-dial)" />
      <g fill="#24201b">
        {Array.from({ length: 60 }, (_, i) =>
          i % 5 === 0 ? null : (
            <rect
              key={i}
              x="498.5"
              y="88"
              width="3"
              height="16"
              transform={`rotate(${i * 6} ${C} ${C})`}
            />
          ),
        )}
        {Array.from({ length: 12 }, (_, i) =>
          i === 0 ? (
            <g key={i}>
              <rect x="476" y="84" width="16" height="96" rx="2" />
              <rect x="508" y="84" width="16" height="96" rx="2" />
            </g>
          ) : (
            <rect
              key={i}
              x="492"
              y="84"
              width="16"
              height={i % 3 === 0 ? 96 : 72}
              rx="2"
              transform={`rotate(${i * 30} ${C} ${C})`}
            />
          ),
        )}
      </g>
      <text
        x={C}
        y="335"
        textAnchor="middle"
        fontSize="30"
        letterSpacing="12"
        fill="#24201b"
        style={monoFont}
      >
        T ATELIER
      </text>
      <text x={C} y="680" textAnchor="middle" fontSize="58" fill="#24201b" style={displayFont}>
        Meridyen
      </text>
      <text
        x={C}
        y="722"
        textAnchor="middle"
        fontSize="18"
        letterSpacing="6"
        fill="#7d705f"
        style={monoFont}
      >
        SWEEP · QUARTZ
      </text>
    </svg>
  );
}

export function HourHandLayer() {
  return (
    <svg {...svgProps}>
      <path d="M500 565 L486 500 L491 292 L500 255 L509 292 L514 500 Z" fill="#211d19" />
      <path d="M500 500 L500 270" stroke="#6b6157" strokeWidth="2" />
    </svg>
  );
}

export function MinuteHandLayer() {
  return (
    <svg {...svgProps}>
      <path d="M500 580 L489 500 L494 150 L500 112 L506 150 L511 500 Z" fill="#211d19" />
      <path d="M500 500 L500 130" stroke="#6b6157" strokeWidth="2" />
      <circle cx={C} cy={C} r="26" fill="#211d19" />
    </svg>
  );
}

export function SecondHandLayer() {
  return (
    <svg {...svgProps}>
      <rect x="497" y="96" width="6" height="484" rx="3" fill="#b8893f" />
      <circle cx={C} cy="565" r="17" fill="#b8893f" />
      <circle cx={C} cy={C} r="15" fill="#c9a36a" />
      <circle cx={C} cy={C} r="5" fill="#3b2a12" />
    </svg>
  );
}

export function GlassLayer() {
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="tws-glass" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="38%" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="62%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <circle cx={C} cy={C} r="429" fill="url(#tws-glass)" />
      <path
        d="M205 330 A330 330 0 0 1 420 150 A360 360 0 0 0 240 400 Z"
        fill="#fff"
        opacity="0.16"
      />
      <circle
        cx={C}
        cy={C}
        r="428"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.18"
        strokeWidth="3"
      />
    </svg>
  );
}

export function BezelLayer() {
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="tws-bezel-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8a5a34" />
          <stop offset="50%" stopColor="#5b391f" />
          <stop offset="100%" stopColor="#2e1c0e" />
        </linearGradient>
        <mask id="tws-bezel-ring">
          <circle cx={C} cy={C} r="470" fill="#fff" />
          <circle cx={C} cy={C} r="428" fill="#000" />
        </mask>
      </defs>
      <g mask="url(#tws-bezel-ring)">
        <circle cx={C} cy={C} r="470" fill="url(#tws-bezel-wood)" />
        <WoodGrain opacity={0.22} />
      </g>
      <circle cx={C} cy={C} r="430" fill="none" stroke="#c9a36a" strokeWidth="4" />
      <circle cx={C} cy={C} r="468" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="3" />
    </svg>
  );
}
