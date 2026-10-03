import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

/**
 * KPI kutucuğu: etiket · değer · önceki döneme göre işaretli değişim.
 * Değişim rengi yön × "artış iyi mi"; ok ikonu + işaret rengi tek başına bırakmaz.
 */
export function StatTile({
  label,
  value,
  current,
  previous,
  upIsGood = true,
  formatDelta = (delta) => `${delta > 0 ? "+" : ""}${Math.round(delta * 100)}%`,
}: {
  label: string;
  value: string;
  current: number | null;
  previous: number | null;
  upIsGood?: boolean;
  formatDelta?: (delta: number) => string;
}) {
  let delta: number | null = null;
  if (current != null && previous != null && previous !== 0)
    delta = (current - previous) / previous;

  const good = delta === null || delta === 0 ? null : delta > 0 === upIsGood;
  const Icon = delta === null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      <p
        className={`mt-2 flex items-center gap-1 text-xs ${good === null ? "text-muted-foreground" : good ? "text-[#0ca30c]" : "text-[#d03b3b]"}`}
      >
        <Icon className="size-3.5" aria-hidden />
        {delta === null ? "Önceki dönemle kıyas yok" : `${formatDelta(delta)} önceki döneme göre`}
      </p>
    </div>
  );
}
