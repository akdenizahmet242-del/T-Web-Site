/**
 * Yatay çubuk listesi (tek seri, büyüklük karşılaştırması). Etiket ve değer
 * metin token'larında; renk yalnızca işarette. Çubuk ≤ 24 px, 4 px yuvarlak uç.
 */
export function BarList({
  rows,
  format,
  emptyText = "Bu dönemde veri yok.",
}: {
  rows: { label: string; value: number; hint?: string }[];
  format: (value: number) => string;
  emptyText?: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="space-y-4 [--series-1:#bf8532]">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0 truncate text-foreground">{row.label}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {format(row.value)}
              {row.hint ? <span className="ml-2 text-xs">{row.hint}</span> : null}
            </span>
          </div>
          <span className="mt-1.5 block h-2.5 rounded-r-[4px] bg-border/40">
            <span
              className="block h-full rounded-r-[4px] bg-(--series-1)"
              style={{ width: `${Math.max(1, (row.value / max) * 100)}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
