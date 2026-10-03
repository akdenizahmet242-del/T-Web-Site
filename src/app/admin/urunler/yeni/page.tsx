import Link from "next/link";

import { getCategoryOptions } from "@/features/admin/products/queries";
import { ProductForm } from "@/features/admin/products/product-form";
import { requireStaff } from "@/features/auth/guards";

export const metadata = { title: "Yeni ürün" };

export default async function NewProductPage() {
  await requireStaff();
  const categories = await getCategoryOptions();

  return (
    <div>
      <Link href="/admin/urunler" className="text-sm text-muted-foreground hover:text-foreground">
        ← Ürünler
      </Link>
      <h1 className="mt-4 font-display text-5xl">Yeni ürün</h1>
      <ProductForm initial={null} categories={categories} />
    </div>
  );
}
