import Link from "next/link";
import { notFound } from "next/navigation";

import { getCategoryOptions, getProductFormValues } from "@/features/admin/products/queries";
import { ProductForm } from "@/features/admin/products/product-form";
import { requireStaff } from "@/features/auth/guards";

export const metadata = { title: "Ürün düzenle" };

export default async function EditProductPage({ params }: PageProps<"/admin/urunler/[id]">) {
  await requireStaff();
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductFormValues(id), getCategoryOptions()]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/urunler" className="text-sm text-muted-foreground hover:text-foreground">
        ← Ürünler
      </Link>
      <h1 className="mt-4 font-display text-5xl">{product.name}</h1>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{product.sku}</p>
      <ProductForm initial={product} categories={categories} />
    </div>
  );
}
