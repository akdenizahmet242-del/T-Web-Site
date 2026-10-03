"use client";

import { ArrowDown, ArrowUp, Check, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { GalleryEditor } from "@/features/admin/media/gallery-editor";
import { showcaseTemplates } from "@/features/showcase/templates";
import { ProductStatus, ShowcaseTemplate } from "@/generated/prisma/enums";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

import { deleteProductAction, saveProductAction } from "./actions";
import type { ProductFormInput, ProductImageInput } from "./schema";

type Spec = ProductFormInput["detail"]["specs"][number];
type DetailNumberKey =
  | "widthMm"
  | "heightMm"
  | "depthMm"
  | "weightGrams"
  | "packageWidthMm"
  | "packageHeightMm"
  | "packageDepthMm"
  | "packageWeightGrams"
  | "warrantyMonths";
type DetailTextKey = "material" | "color" | "finish" | "origin" | "careInstructions";

/** Form alanları metin olarak tutulur; kayıt anında sayıya çevrilir. */
type FormValues = {
  id?: string;
  name: string;
  slug: string;
  slugTouched: boolean;
  sku: string;
  brand: string;
  categoryId: string;
  status: ProductStatus;
  isFeatured: boolean;
  showcaseTemplate: ShowcaseTemplate | "";
  tagline: string;
  description: string;
  price: string;
  compareAtPrice: string;
  vatRate: string;
  stock: string;
  lowStockThreshold: string;
  detail: Record<DetailNumberKey | DetailTextKey, string>;
  inTheBox: string[];
  specs: Spec[];
  images: ProductImageInput[];
  seoTitle: string;
  seoDescription: string;
};

const numberKeys: DetailNumberKey[] = [
  "widthMm",
  "heightMm",
  "depthMm",
  "weightGrams",
  "packageWidthMm",
  "packageHeightMm",
  "packageDepthMm",
  "packageWeightGrams",
  "warrantyMonths",
];
const textKeys: DetailTextKey[] = ["material", "color", "finish", "origin", "careInstructions"];

function toValues(input: ProductFormInput | null, defaultCategory: string): FormValues {
  const str = (value: number | string | null | undefined) => (value == null ? "" : String(value));
  return {
    id: input?.id,
    name: input?.name ?? "",
    slug: input?.slug ?? "",
    slugTouched: Boolean(input),
    sku: input?.sku ?? "",
    brand: input?.brand ?? "",
    categoryId: input?.categoryId ?? defaultCategory,
    status: input?.status ?? ProductStatus.DRAFT,
    isFeatured: input?.isFeatured ?? false,
    showcaseTemplate: input?.showcaseTemplate ?? "",
    tagline: input?.tagline ?? "",
    description: input?.description ?? "",
    price: formatMoneyInput(input?.priceMinor),
    compareAtPrice: formatMoneyInput(input?.compareAtPriceMinor),
    vatRate: str(input?.vatRate ?? 20),
    stock: str(input?.stock ?? 0),
    lowStockThreshold: str(input?.lowStockThreshold ?? 5),
    detail: Object.fromEntries([
      ...numberKeys.map((key) => [key, str(input?.detail[key])]),
      ...textKeys.map((key) => [key, input?.detail[key] ?? ""]),
    ]) as FormValues["detail"],
    inTheBox: input?.detail.inTheBox ?? [],
    specs: input?.detail.specs ?? [],
    images: input?.images ?? [],
    seoTitle: input?.seoTitle ?? "",
    seoDescription: input?.seoDescription ?? "",
  };
}

function toInput(values: FormValues): { input: ProductFormInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const int = (value: string, key: string) => {
    if (value.trim() === "") return null;
    const parsed = Number(value.replace(/\s/g, "").replace(",", "."));
    if (!Number.isInteger(parsed) || parsed < 0) {
      errors[key] = "Tam sayı girin.";
      return null;
    }
    return parsed;
  };
  const text = (value: string) => (value.trim() === "" ? null : value.trim());

  const priceMinor = parseMoneyInput(values.price);
  if (priceMinor == null) errors.priceMinor = "Geçerli bir fiyat girin (ör. 4890,00).";
  const compareAtPriceMinor = values.compareAtPrice.trim()
    ? parseMoneyInput(values.compareAtPrice)
    : null;
  if (values.compareAtPrice.trim() && compareAtPriceMinor == null) {
    errors.compareAtPriceMinor = "Geçerli bir fiyat girin.";
  }

  const input: ProductFormInput = {
    id: values.id,
    name: values.name,
    slug: values.slug,
    sku: values.sku,
    brand: text(values.brand),
    categoryId: values.categoryId,
    status: values.status,
    isFeatured: values.isFeatured,
    showcaseTemplate: values.showcaseTemplate || null,
    tagline: text(values.tagline),
    description: values.description,
    priceMinor: priceMinor ?? 0,
    compareAtPriceMinor,
    vatRate: int(values.vatRate, "vatRate") ?? 20,
    stock: int(values.stock, "stock") ?? 0,
    lowStockThreshold: int(values.lowStockThreshold, "lowStockThreshold") ?? 0,
    detail: {
      ...(Object.fromEntries(
        numberKeys.map((key) => [key, int(values.detail[key], `detail.${key}`)]),
      ) as Record<DetailNumberKey, number | null>),
      ...(Object.fromEntries(textKeys.map((key) => [key, text(values.detail[key])])) as Record<
        DetailTextKey,
        string | null
      >),
      inTheBox: values.inTheBox.map((item) => item.trim()).filter(Boolean),
      specs: values.specs
        .map((spec) => ({ ...spec, unit: spec.unit?.trim() || undefined }))
        .filter((spec) => spec.label.trim() || spec.value.trim()),
    },
    images: values.images,
    seoTitle: text(values.seoTitle),
    seoDescription: text(values.seoDescription),
  };
  return { input, errors };
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 border-b py-10 lg:grid-cols-[16rem_1fr]">
      <div>
        <h2 className="font-medium">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormInput | null;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState(() => toValues(initial, categories[0]?.id ?? ""));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));
  const setDetail = (key: DetailNumberKey | DetailTextKey, value: string) =>
    setValues((previous) => ({ ...previous, detail: { ...previous.detail, [key]: value } }));

  const field = (key: string) => ({ "aria-invalid": Boolean(errors[key]) || undefined });

  function save() {
    const { input, errors: clientErrors } = toInput(values);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      setMessage({ kind: "error", text: "Formda düzeltilmesi gereken alanlar var." });
      return;
    }
    startTransition(async () => {
      const result = await saveProductAction(input);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setErrors({});
      setMessage({ kind: "ok", text: "Kaydedildi. Vitrin sayfaları arka planda güncelleniyor." });
      if (!values.id) router.replace(`/admin/urunler/${result.id}`);
      else router.refresh();
    });
  }

  function remove() {
    if (!values.id || !window.confirm("Ürün silinsin mi? Siparişi olan ürünler arşivlenir."))
      return;
    startTransition(async () => {
      const result = await deleteProductAction(values.id!);
      if (result.ok)
        router.replace(`/admin/urunler?${result.archived ? "arsivlendi" : "silindi"}=1`);
    });
  }

  const updateSpec = (index: number, patch: Partial<Spec>) =>
    set(
      "specs",
      values.specs.map((spec, i) => (i === index ? { ...spec, ...patch } : spec)),
    );
  const moveSpec = (index: number, delta: number) => {
    const next = [...values.specs];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    set("specs", next);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      noValidate
    >
      <Section title="Genel bilgiler" description="Ad değiştikçe adres (slug) otomatik üretilir.">
        <div className="grid gap-2">
          <Label htmlFor="name">Ürün adı</Label>
          <Input
            id="name"
            value={values.name}
            {...field("name")}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                name: event.target.value,
                slug: previous.slugTouched ? previous.slug : slugify(event.target.value),
              }))
            }
          />
          <FieldError message={errors.name} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="slug">Adres (slug)</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">/urun/</span>
              <Input
                id="slug"
                value={values.slug}
                {...field("slug")}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    slug: slugify(event.target.value),
                    slugTouched: true,
                  }))
                }
              />
            </div>
            <FieldError message={errors.slug} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={values.sku}
              {...field("sku")}
              onChange={(event) => set("sku", event.target.value.toUpperCase())}
            />
            <FieldError message={errors.sku} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="categoryId">Kategori</Label>
            <NativeSelect
              id="categoryId"
              value={values.categoryId}
              {...field("categoryId")}
              onChange={(event) => set("categoryId", event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </NativeSelect>
            <FieldError message={errors.categoryId} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="brand">Marka</Label>
            <Input
              id="brand"
              value={values.brand}
              onChange={(event) => set("brand", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Durum</Label>
            <NativeSelect
              id="status"
              value={values.status}
              onChange={(event) => set("status", event.target.value as ProductStatus)}
            >
              <option value="DRAFT">Taslak (yayında değil)</option>
              <option value="ACTIVE">Yayında</option>
              <option value="ARCHIVED">Arşiv</option>
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="showcaseTemplate">Ürün sayfası sahnesi</Label>
            <NativeSelect
              id="showcaseTemplate"
              value={values.showcaseTemplate}
              onChange={(event) =>
                set("showcaseTemplate", event.target.value as ShowcaseTemplate | "")
              }
            >
              <option value="">Yok</option>
              {Object.entries(showcaseTemplates)
                .filter(([key]) => key !== "STATIC_HERO")
                .map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.label}
                  </option>
                ))}
            </NativeSelect>
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[var(--brass)]"
            checked={values.isFeatured}
            onChange={(event) => set("isFeatured", event.target.checked)}
          />
          Ana sayfada &quot;Öne çıkanlar&quot;da göster
        </label>
        <div className="grid gap-2">
          <Label htmlFor="tagline">Kısa slogan</Label>
          <Input
            id="tagline"
            value={values.tagline}
            maxLength={140}
            onChange={(event) => set("tagline", event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            rows={6}
            value={values.description}
            {...field("description")}
            onChange={(event) => set("description", event.target.value)}
          />
          <FieldError message={errors.description} />
        </div>
      </Section>

      <Section title="Fiyat ve stok" description="Fiyatlar KDV dahil girilir.">
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="price">Satış fiyatı (₺)</Label>
            <Input
              id="price"
              inputMode="decimal"
              placeholder="4890,00"
              value={values.price}
              {...field("priceMinor")}
              onChange={(event) => set("price", event.target.value)}
            />
            <FieldError message={errors.priceMinor} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="compareAtPrice">Eski fiyat (₺, isteğe bağlı)</Label>
            <Input
              id="compareAtPrice"
              inputMode="decimal"
              value={values.compareAtPrice}
              {...field("compareAtPriceMinor")}
              onChange={(event) => set("compareAtPrice", event.target.value)}
            />
            <FieldError message={errors.compareAtPriceMinor} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vatRate">KDV oranı</Label>
            <NativeSelect
              id="vatRate"
              value={values.vatRate}
              onChange={(event) => set("vatRate", event.target.value)}
            >
              {["1", "10", "20"].map((rate) => (
                <option key={rate} value={rate}>
                  %{rate}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stock">Stok adedi</Label>
            <Input
              id="stock"
              inputMode="numeric"
              value={values.stock}
              {...field("stock")}
              onChange={(event) => set("stock", event.target.value)}
            />
            <FieldError message={errors.stock} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lowStockThreshold">Kritik stok eşiği</Label>
            <Input
              id="lowStockThreshold"
              inputMode="numeric"
              value={values.lowStockThreshold}
              {...field("lowStockThreshold")}
              onChange={(event) => set("lowStockThreshold", event.target.value)}
            />
            <FieldError message={errors.lowStockThreshold} />
          </div>
        </div>
      </Section>

      <Section
        title="Boyut ve ağırlık"
        description="Ölçüler milimetre, ağırlık gram. Paket ölçüleri kargo (desi) hesabı içindir."
      >
        <div className="grid gap-5 sm:grid-cols-4">
          {(
            [
              ["widthMm", "En (mm)"],
              ["heightMm", "Boy (mm)"],
              ["depthMm", "Derinlik (mm)"],
              ["weightGrams", "Ağırlık (g)"],
              ["packageWidthMm", "Paket en (mm)"],
              ["packageHeightMm", "Paket boy (mm)"],
              ["packageDepthMm", "Paket derinlik (mm)"],
              ["packageWeightGrams", "Paket ağırlık (g)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="grid gap-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                inputMode="numeric"
                value={values.detail[key]}
                {...field(`detail.${key}`)}
                onChange={(event) => setDetail(key, event.target.value)}
              />
              <FieldError message={errors[`detail.${key}`]} />
            </div>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {(
            [
              ["material", "Malzeme"],
              ["color", "Renk"],
              ["finish", "Yüzey"],
              ["origin", "Menşei"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="grid gap-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={values.detail[key]}
                onChange={(event) => setDetail(key, event.target.value)}
              />
            </div>
          ))}
          <div className="grid gap-2">
            <Label htmlFor="warrantyMonths">Garanti (ay)</Label>
            <Input
              id="warrantyMonths"
              inputMode="numeric"
              value={values.detail.warrantyMonths}
              {...field("detail.warrantyMonths")}
              onChange={(event) => setDetail("warrantyMonths", event.target.value)}
            />
          </div>
        </div>
      </Section>

      <Section
        title="Teknik özellik tablosu"
        description="Ürün sayfasında gruplara ayrılmış tablo olarak gösterilir."
      >
        {values.specs.length > 0 ? (
          <div className="grid gap-3">
            <div className="hidden grid-cols-[1fr_1fr_1.4fr_0.6fr_auto] gap-2 text-xs text-muted-foreground sm:grid">
              <span>Grup</span>
              <span>Özellik</span>
              <span>Değer</span>
              <span>Birim</span>
              <span className="w-24" />
            </div>
            {values.specs.map((spec, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_0.6fr_auto]">
                <Input
                  aria-label="Grup"
                  placeholder="Mekanizma"
                  value={spec.group}
                  {...field(`detail.specs.${index}.group`)}
                  onChange={(event) => updateSpec(index, { group: event.target.value })}
                />
                <Input
                  aria-label="Özellik"
                  placeholder="Tip"
                  value={spec.label}
                  {...field(`detail.specs.${index}.label`)}
                  onChange={(event) => updateSpec(index, { label: event.target.value })}
                />
                <Input
                  aria-label="Değer"
                  placeholder="Sessiz süpürme"
                  value={spec.value}
                  {...field(`detail.specs.${index}.value`)}
                  onChange={(event) => updateSpec(index, { value: event.target.value })}
                />
                <Input
                  aria-label="Birim"
                  placeholder="mm"
                  value={spec.unit ?? ""}
                  onChange={(event) => updateSpec(index, { unit: event.target.value })}
                />
                <span className="flex w-24 justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Yukarı"
                    disabled={index === 0}
                    onClick={() => moveSpec(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Aşağı"
                    disabled={index === values.specs.length - 1}
                    onClick={() => moveSpec(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Satırı sil"
                    onClick={() =>
                      set(
                        "specs",
                        values.specs.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() =>
            set("specs", [
              ...values.specs,
              { group: values.specs.at(-1)?.group ?? "", label: "", value: "", unit: "" },
            ])
          }
        >
          <Plus /> Satır ekle
        </Button>
      </Section>

      <Section title="Kutu içeriği ve bakım">
        <div className="grid gap-2">
          {values.inTheBox.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                aria-label={`Kutu içeriği ${index + 1}`}
                value={item}
                onChange={(event) =>
                  set(
                    "inTheBox",
                    values.inTheBox.map((v, i) => (i === index ? event.target.value : v)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Kaldır"
                onClick={() =>
                  set(
                    "inTheBox",
                    values.inTheBox.filter((_, i) => i !== index),
                  )
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => set("inTheBox", [...values.inTheBox, ""])}
          >
            <Plus /> Kutu içeriği ekle
          </Button>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="careInstructions">Bakım talimatı</Label>
          <Textarea
            id="careInstructions"
            rows={3}
            value={values.detail.careInstructions}
            onChange={(event) => setDetail("careInstructions", event.target.value)}
          />
        </div>
      </Section>

      <Section
        title="Galeri"
        description="İlk görsel kapak olur. Görseller WebP'ye çevrilir; teslimde AVIF/WebP üretilir."
      >
        <GalleryEditor value={values.images} onChange={(images) => set("images", images)} />
        <FieldError message={errors.images} />
      </Section>

      <Section
        title="Arama motoru (SEO)"
        description="Boş bırakılırsa ürün adı ve slogan kullanılır."
      >
        <div className="grid gap-2">
          <Label htmlFor="seoTitle">Başlık ({values.seoTitle.length}/70)</Label>
          <Input
            id="seoTitle"
            maxLength={70}
            value={values.seoTitle}
            onChange={(event) => set("seoTitle", event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="seoDescription">Açıklama ({values.seoDescription.length}/160)</Label>
          <Textarea
            id="seoDescription"
            maxLength={160}
            rows={2}
            value={values.seoDescription}
            onChange={(event) => set("seoDescription", event.target.value)}
          />
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-6 flex flex-wrap items-center justify-between gap-4 border-t bg-background/95 px-6 py-4 lg:-mx-10 lg:px-10">
        <p
          role="status"
          className={cn(
            "text-sm",
            message?.kind === "error" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {message?.kind === "ok" ? <Check className="mr-1 inline size-4 text-brass" /> : null}
          {message?.text}
        </p>
        <div className="flex gap-2">
          {values.id ? (
            <>
              {initial?.status === "ACTIVE" ? (
                <Link
                  href={`/urun/${initial.slug}`}
                  target="_blank"
                  className={buttonVariants({ variant: "ghost" })}
                >
                  Sayfayı gör
                </Link>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                disabled={pending}
                onClick={remove}
              >
                Sil
              </Button>
            </>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {values.id ? "Kaydet" : "Ürünü oluştur"}
          </Button>
        </div>
      </div>
    </form>
  );
}
