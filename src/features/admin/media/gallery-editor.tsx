"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductImageInput } from "@/features/admin/products/schema";
import { cn } from "@/lib/utils";

import { ACCEPTED_IMAGE_TYPES, uploadImage } from "./upload";

type Pending = { id: string; name: string; progress: number; error?: string };

const MAX_IMAGES = 12;

export function GalleryEditor({
  value,
  onChange,
}: {
  value: ProductImageInput[];
  onChange: (next: ProductImageInput[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  // Eşzamanlı yüklemeler biterken en güncel listeye eklensin.
  const latest = useRef(value);
  latest.current = value;

  async function handleFiles(files: FileList | File[]) {
    const room = MAX_IMAGES - latest.current.length - pending.length;
    const selected = [...files].slice(0, Math.max(0, room));

    await Promise.all(
      selected.map(async (file) => {
        const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
        setPending((items) => [...items, { id, name: file.name, progress: 0 }]);
        try {
          const uploaded = await uploadImage(file, "products", (progress) =>
            setPending((items) =>
              items.map((item) => (item.id === id ? { ...item, progress } : item)),
            ),
          );
          onChange([...latest.current, { ...uploaded, alt: "" }]);
          setPending((items) => items.filter((item) => item.id !== id));
        } catch (error) {
          setPending((items) =>
            items.map((item) =>
              item.id === id
                ? { ...item, error: error instanceof Error ? error.message : "Hata" }
                : item,
            ),
          );
        }
      }),
    );
  }

  function move(index: number, delta: number) {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) void handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "grid place-items-center rounded-xl border border-dashed p-8 text-center transition-colors",
          dragging ? "border-brass bg-brass/5" : "border-border",
        )}
      >
        <ImagePlus className="size-8 text-muted-foreground" />
        <p className="mt-3 text-sm">Görselleri sürükleyip bırakın</p>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP veya AVIF · en fazla 10 MB · {value.length}/{MAX_IMAGES}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          disabled={value.length + pending.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
        >
          Dosya seç
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {value.length + pending.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {value.map((image, index) => (
            <li key={image.url} className="overflow-hidden rounded-xl border bg-card">
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.alt || "Ürün görseli"}
                  fill
                  sizes="240px"
                  className="object-cover"
                  placeholder={image.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={image.blurDataUrl ?? undefined}
                />
                {index === 0 ? <Badge className="absolute top-2 left-2">Kapak</Badge> : null}
              </div>
              <div className="space-y-2 p-3">
                <Input
                  value={image.alt}
                  placeholder="Alternatif metin (erişilebilirlik)"
                  aria-label="Alternatif metin"
                  onChange={(event) =>
                    onChange(
                      value.map((item, i) =>
                        i === index ? { ...item, alt: event.target.value } : item,
                      ),
                    )
                  }
                  className="h-8 text-xs"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {image.width}×{image.height}
                  </span>
                  <span className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Sola taşı"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowLeft />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Sağa taşı"
                      disabled={index === value.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowRight />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Görseli kaldır"
                      onClick={() => onChange(value.filter((_, i) => i !== index))}
                    >
                      <Trash2 />
                    </Button>
                  </span>
                </div>
              </div>
            </li>
          ))}
          {pending.map((item) => (
            <li
              key={item.id}
              className="grid aspect-square place-items-center rounded-xl border bg-card p-4 text-center"
            >
              {item.error ? (
                <div>
                  <p className="text-xs text-destructive">{item.error}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setPending((items) => items.filter((p) => p.id !== item.id))}
                  >
                    Kapat
                  </Button>
                </div>
              ) : (
                <div className="w-full">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                  <p className="mt-2 truncate text-xs text-muted-foreground">{item.name}</p>
                  <span className="mt-3 block h-1 overflow-hidden rounded-full bg-border">
                    <span
                      className="block h-full origin-left bg-brass transition-transform"
                      style={{ transform: `scaleX(${item.progress})` }}
                    />
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
