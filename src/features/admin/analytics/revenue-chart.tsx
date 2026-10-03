"use client";

import { useState } from "react";

import { formatMoney } from "@/lib/money";

import { compactMoney, niceCeiling, shortDate } from "./chart-utils";
import type { DailyPoint } from "./queries";

/**
 * Günlük tahsilat — tek seri sütun grafiği (lejant yok; başlık seriyi adlandırır).
 * Seri rengi --series-1: pirincin koyu yüzeyde doğrulanmış adımı (#bf8532,
 * L 0,66 · C 0,12 · kontrast ≥ 3:1). Her sütunun isabet alanı tam yüksekliktir;
 * tooltip fare ve klavye odağında aynı bilgiyi gösterir, tablo görünümü yedektir.
 */
export function RevenueChart({ data }: { data: DailyPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceCeiling(Math.max(...data.map((point) => point.revenueMinor), 0));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max * ratio));
  const point = active === null ? null : data[active];
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <figure className="[--series-1:#bf8532]">
      <div className="relative h-64 pl-14">
        {ticks.map((tick) => (
          <div
            key={tick}
            aria-hidden
            className="absolute right-0 left-14 border-t border-border"
            style={{ bottom: `${(tick / max) * 100}%` }}
          >
            <span className="absolute -top-2 -left-14 w-12 text-right text-[11px] text-muted-foreground tabular-nums">
              {compactMoney(tick)}
            </span>
          </div>
        ))}

        <div
          className="absolute inset-0 left-14 flex items-end gap-[2px]"
          onPointerLeave={() => setActive(null)}
        >
          {data.map((day, index) => (
            <button
              key={day.day}
              type="button"
              aria-label={`${shortDate(day.day)}: ${formatMoney(day.revenueMinor)}, ${day.orders} sipariş`}
              className="group relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
              onPointerEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
            >
              <span
                className="w-full max-w-6 rounded-t-[4px] bg-(--series-1) transition-[filter] group-hover:brightness-125 group-focus-visible:brightness-125"
                style={{ height: `${(day.revenueMinor / max) * 100}%` }}
              />
            </button>
          ))}
        </div>

        {point && active !== null ? (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-xs shadow-lg"
            style={{ left: `calc(3.5rem + (100% - 3.5rem) * ${(active + 0.5) / data.length})` }}
          >
            <p className="text-sm font-semibold text-foreground">
              {formatMoney(point.revenueMinor)}
            </p>
            <p className="text-muted-foreground">
              {shortDate(point.day)} · {point.orders} sipariş
            </p>
          </div>
        ) : null}
      </div>

      <div aria-hidden className="mt-2 flex pl-14 text-[11px] text-muted-foreground">
        {data.map((day, index) => (
          <span key={day.day} className="min-w-0 flex-1 text-center whitespace-nowrap">
            {index % labelEvery === 0 ? shortDate(day.day) : ""}
          </span>
        ))}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Tablo görünümü
        </summary>
        <table className="mt-3 w-full max-w-md text-left text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 font-normal">Gün</th>
              <th className="py-1 text-right font-normal">Sipariş</th>
              <th className="py-1 text-right font-normal">Tahsilat</th>
            </tr>
          </thead>
          <tbody>
            {data.map((day) => (
              <tr key={day.day} className="border-t">
                <td className="py-1">{shortDate(day.day)}</td>
                <td className="py-1 text-right tabular-nums">{day.orders}</td>
                <td className="py-1 text-right tabular-nums">{formatMoney(day.revenueMinor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
