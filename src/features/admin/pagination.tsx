import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** URL tabanlı sayfalama — mevcut filtreleri korur. */
export function Pagination({
  page,
  pages,
  basePath,
  params,
}: {
  page: number;
  pages: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;
  const href = (target: number) => {
    const search = new URLSearchParams(
      Object.entries({ ...params, page: String(target) }).filter(([, v]) => v) as [
        string,
        string,
      ][],
    );
    return `${basePath}?${search.toString()}`;
  };
  return (
    <nav aria-label="Sayfalama" className="mt-6 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Sayfa {page} / {pages}
      </span>
      <span className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          href={href(Math.max(1, page - 1))}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page <= 1 && "pointer-events-none opacity-50",
          )}
        >
          Önceki
        </Link>
        <Link
          aria-disabled={page >= pages}
          href={href(Math.min(pages, page + 1))}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page >= pages && "pointer-events-none opacity-50",
          )}
        >
          Sonraki
        </Link>
      </span>
    </nav>
  );
}

export function readParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function readPage(value: string | string[] | undefined) {
  const page = Number(readParam(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
}
