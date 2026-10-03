import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { siteConfig } from "@/config/site";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";
import { ProductMedia } from "@/features/catalog/product-media";
import { getPrerenderProductSlugs, getProductBySlug } from "@/features/catalog/queries";
import type { ProductDetailDTO, Spec } from "@/features/catalog/types";
import { discountPercent, formatMoney, toMajorUnits } from "@/lib/money";
import { TrackViewContent } from "@/services/analytics/track-view-content";

// ISR: en popüler ürünler build'de üretilir, kalanlar ilk istekte üretilip önbelleğe girer.
export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await getPrerenderProductSlugs(200);
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.tagline ?? product.description.slice(0, 155),
    alternates: { canonical: `/urun/${product.slug}` },
    openGraph: { title: product.name, images: product.image ? [product.image.url] : undefined },
  };
}

const mm = (value: number | null) => (value == null ? null : `${value.toLocaleString("tr-TR")} mm`);

function dimensionRows(product: ProductDetailDTO): Spec[] {
  const d = product.detail;
  if (!d) return [];
  const rows: [string, string | null][] = [
    ["En", mm(d.widthMm)],
    ["Boy", mm(d.heightMm)],
    ["Derinlik", mm(d.depthMm)],
    [
      "Ağırlık",
      d.weightGrams == null ? null : `${(d.weightGrams / 1000).toLocaleString("tr-TR")} kg`,
    ],
    ["Malzeme", d.material],
    ["Renk", d.color],
    ["Yüzey", d.finish],
    ["Menşei", d.origin],
    ["Garanti", d.warrantyMonths ? `${d.warrantyMonths} ay` : null],
  ];
  return rows
    .filter((row): row is [string, string] => row[1] != null)
    .map(([label, value]) => ({ group: "Boyutlar & Malzeme", label, value }));
}

function groupSpecs(specs: Spec[]) {
  const groups = new Map<string, Spec[]>();
  for (const spec of specs) groups.set(spec.group, [...(groups.get(spec.group) ?? []), spec]);
  return [...groups.entries()];
}

export default async function ProductPage({ params }: PageProps<"/urun/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const discount = discountPercent(product.priceMinor, product.compareAtPriceMinor);
  const specGroups = groupSpecs([...dimensionRows(product), ...(product.detail?.specs ?? [])]);
  const lowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    description: product.description,
    image: product.gallery.map((image) => image.url),
    offers: {
      "@type": "Offer",
      url: `${siteConfig.url}/urun/${product.slug}`,
      priceCurrency: product.currency,
      price: toMajorUnits(product.priceMinor),
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <article className="mx-auto max-w-7xl px-5 pt-28 pb-24 sm:px-8">
      <script
        type="application/ld+json"
        // JSON.stringify çıktısındaki "<" kaçışlanır → XSS'e kapalı
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <TrackViewContent
        currency={product.currency}
        item={{
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category.name,
          brand: product.brand,
          priceMinor: product.priceMinor,
        }}
      />

      <nav aria-label="Konum" className="text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Ana sayfa
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/kategori/${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="grid gap-4">
          <ProductMedia
            image={product.image}
            name={product.name}
            categorySlug={product.category.slug}
            accent={product.category.accentColor}
            seed={product.slug}
            sizes="(min-width: 1024px) 58vw, 100vw"
            preload
            className="rounded-3xl border"
          />
          {product.gallery.length > 1 ? (
            <div className="grid grid-cols-4 gap-4">
              {product.gallery.slice(1, 5).map((image) => (
                <ProductMedia
                  key={image.url}
                  image={image}
                  name={product.name}
                  categorySlug={product.category.slug}
                  accent={product.category.accentColor}
                  seed={image.url}
                  sizes="15vw"
                  className="rounded-xl border"
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-[11px] tracking-[0.25em] text-brass uppercase">
            {product.brand ?? product.category.name}
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl">{product.name}</h1>
          {product.tagline ? <p className="mt-4 text-muted-foreground">{product.tagline}</p> : null}

          <div className="mt-8 flex items-baseline gap-3">
            <p className="text-3xl tabular-nums">
              {formatMoney(product.priceMinor, product.currency)}
            </p>
            {discount ? (
              <>
                <p className="text-muted-foreground tabular-nums line-through">
                  {formatMoney(product.compareAtPriceMinor!, product.currency)}
                </p>
                <Badge>%{discount}</Badge>
              </>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">KDV (%{product.vatRate}) dahil</p>

          <div className="mt-8">
            <AddToCartButton
              product={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                category: product.category.name,
                priceMinor: product.priceMinor,
                currency: product.currency,
                imageUrl: product.image?.url ?? null,
                sku: product.sku,
                brand: product.brand,
                stock: product.stock,
              }}
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {product.stock <= 0
                ? "Şu an stokta yok"
                : lowStock
                  ? `Stokta son ${product.stock} adet`
                  : "Stokta · 1–3 iş gününde kargoda"}
            </p>
          </div>

          <Separator className="my-10" />

          <p className="leading-relaxed text-pretty text-muted-foreground">{product.description}</p>

          {product.detail?.inTheBox.length ? (
            <div className="mt-8">
              <h2 className="text-sm font-medium">Kutu içeriği</h2>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {product.detail.inTheBox.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {specGroups.length > 0 ? (
        <section aria-labelledby="specs-title" className="mt-24">
          <h2 id="specs-title" className="font-display text-4xl">
            Teknik özellikler
          </h2>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            {specGroups.map(([group, specs]) => (
              <div key={group}>
                <h3 className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">
                  {group}
                </h3>
                <Table className="mt-3">
                  <TableBody>
                    {specs.map((spec) => (
                      <TableRow
                        key={`${spec.group}-${spec.label}`}
                        className="hover:bg-transparent"
                      >
                        <TableHead scope="row" className="w-1/2 font-normal text-muted-foreground">
                          {spec.label}
                        </TableHead>
                        <TableCell className="whitespace-normal">
                          {spec.value}
                          {spec.unit ? ` ${spec.unit}` : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
          {product.detail?.careInstructions ? (
            <p className="mt-10 max-w-2xl text-sm text-muted-foreground">
              <span className="text-foreground">Bakım: </span>
              {product.detail.careInstructions}
            </p>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
