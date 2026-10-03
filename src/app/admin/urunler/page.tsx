import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination, readPage, readParam } from "@/features/admin/pagination";
import { getCategoryOptions, listProducts } from "@/features/admin/products/queries";
import { requireStaff } from "@/features/auth/guards";
import { ProductMedia } from "@/features/catalog/product-media";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Ürünler" };

const statusLabels = { DRAFT: "Taslak", ACTIVE: "Yayında", ARCHIVED: "Arşiv" } as const;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/urunler">) {
  await requireStaff();
  const params = await searchParams;
  const filters = {
    q: readParam(params.q),
    status: readParam(params.status),
    category: readParam(params.category),
  };
  const page = readPage(params.page);
  const [{ rows, total, pages }, categories] = await Promise.all([
    listProducts({ ...filters, page }),
    getCategoryOptions(),
  ]);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Ürünler</h1>
          <p className="mt-2 text-sm text-muted-foreground">{total} ürün</p>
        </div>
        <Link href="/admin/urunler/yeni" className={buttonVariants()}>
          <Plus /> Yeni ürün
        </Link>
      </header>

      {readParam(params.arsivlendi) ? (
        <p className="mt-6 rounded-md bg-accent p-3 text-sm">
          Ürünün siparişi olduğu için silinmedi, arşivlendi.
        </p>
      ) : readParam(params.silindi) ? (
        <p className="mt-6 rounded-md bg-accent p-3 text-sm">Ürün silindi.</p>
      ) : null}

      <form className="mt-8 grid gap-3 sm:grid-cols-[1fr_12rem_14rem_auto]" role="search">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={filters.q}
            placeholder="Ad, SKU veya slug"
            className="pl-9"
            aria-label="Ara"
          />
        </div>
        <NativeSelect name="status" defaultValue={filters.status ?? ""} aria-label="Durum">
          <option value="">Tüm durumlar</option>
          <option value="ACTIVE">Yayında</option>
          <option value="DRAFT">Taslak</option>
          <option value="ARCHIVED">Arşiv</option>
        </NativeSelect>
        <NativeSelect name="category" defaultValue={filters.category ?? ""} aria-label="Kategori">
          <option value="">Tüm kategoriler</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">
          Filtrele
        </Button>
      </form>

      <div className="mt-6 rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14" />
              <TableHead>Ürün</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Fiyat</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Ürün bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <ProductMedia
                      image={product.images[0] ?? null}
                      name={product.name}
                      categorySlug={product.category.slug}
                      accent={product.category.accentColor}
                      seed={product.slug}
                      sizes="48px"
                      className="size-11 rounded-md"
                    />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <Link
                      href={`/admin/urunler/${product.id}`}
                      className="font-medium hover:underline"
                    >
                      {product.name}
                    </Link>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {product.sku}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.category.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(product.priceMinor, product.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span
                      className={
                        product.stock <= product.lowStockThreshold ? "text-destructive" : undefined
                      }
                    >
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex gap-1.5">
                      <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
                        {statusLabels[product.status]}
                      </Badge>
                      {product.isFeatured ? <Badge variant="outline">Öne çıkan</Badge> : null}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} pages={pages} basePath="/admin/urunler" params={filters} />
    </div>
  );
}
