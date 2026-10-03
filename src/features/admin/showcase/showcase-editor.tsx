"use client";

import { Check, ImageUp, Loader2, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ACCEPTED_IMAGE_TYPES, uploadImage } from "@/features/admin/media/upload";
import type { LayerAsset, SlotDefinition } from "@/features/showcase/templates";
import { cn } from "@/lib/utils";

import { saveShowcaseAction } from "./actions";
import type { ShowcaseFormInput } from "./schema";

const ASPECT_TOLERANCE = 0.02;

/** ISO → <input type="datetime-local"> değeri (tarayıcının yerel saatinde) */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function ratioLabel(ratio: number) {
  const known: [number, string][] = [
    [1, "1:1"],
    [4 / 3, "4:3"],
    [2 / 3, "2:3"],
    [1 / 2, "1:2"],
    [4, "4:1"],
    [3 / 2, "3:2"],
    [1 / 4, "1:4"],
    [16 / 9, "16:9"],
  ];
  return known.find(([value]) => Math.abs(value - ratio) < 0.001)?.[1] ?? ratio.toFixed(2);
}

function SlotCard({
  slotKey,
  slot,
  asset,
  error,
  onChange,
}: {
  slotKey: string;
  slot: SlotDefinition;
  asset?: LayerAsset;
  error?: string;
  onChange: (asset: LayerAsset | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handle(file: File) {
    setLocalError(null);
    setProgress(0);
    try {
      const uploaded = await uploadImage(file, "showcase", setProgress);
      const ratio = uploaded.width / uploaded.height;
      // Sunucu da aynı kontrolü yapar; burada kullanıcıya anında geri bildirim.
      if (Math.abs(ratio - slot.aspectRatio) / slot.aspectRatio > ASPECT_TOLERANCE) {
        setLocalError(
          `Bu slot ${ratioLabel(slot.aspectRatio)} oranında görsel bekliyor; yüklenen ${uploaded.width}×${uploaded.height}.`,
        );
        return;
      }
      onChange({ ...uploaded, alt: asset?.alt ?? slot.label });
    } catch (uploadError) {
      setLocalError(uploadError instanceof Error ? uploadError.message : "Yükleme başarısız.");
    } finally {
      setProgress(null);
    }
  }

  const message = localError ?? error;

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        message && "border-destructive/60",
      )}
    >
      <div
        className="relative grid place-items-center bg-[linear-gradient(45deg,#ffffff0a_25%,transparent_25%,transparent_75%,#ffffff0a_75%),linear-gradient(45deg,#ffffff0a_25%,transparent_25%,transparent_75%,#ffffff0a_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]"
        style={{ aspectRatio: String(Math.max(0.5, Math.min(2, slot.aspectRatio))) }}
      >
        {asset ? (
          <Image src={asset.url} alt={asset.alt} fill sizes="280px" className="object-contain" />
        ) : (
          <span className="px-4 text-center text-xs text-muted-foreground">
            Varsayılan SVG katmanı kullanılıyor
          </span>
        )}
        {progress !== null ? (
          <span className="absolute inset-x-4 bottom-4 h-1 overflow-hidden rounded-full bg-border">
            <span
              className="block h-full origin-left bg-brass transition-transform"
              style={{ transform: `scaleX(${progress})` }}
            />
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{slot.label}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {slotKey} · {ratioLabel(slot.aspectRatio)}
            </p>
          </div>
          <span className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={`${slot.label} görseli yükle`}
              disabled={progress !== null}
              onClick={() => inputRef.current?.click()}
            >
              {progress !== null ? <Loader2 className="animate-spin" /> : <ImageUp />}
            </Button>
            {asset ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Varsayılana dön"
                onClick={() => onChange(null)}
              >
                <RotateCcw />
              </Button>
            ) : null}
          </span>
        </div>
        {slot.hint ? <p className="text-xs text-muted-foreground">{slot.hint}</p> : null}
        {asset ? (
          <Input
            value={asset.alt}
            onChange={(event) => onChange({ ...asset, alt: event.target.value })}
            aria-label="Alternatif metin"
            className="h-8 text-xs"
          />
        ) : null}
        {message ? <p className="text-xs text-destructive">{message}</p> : null}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handle(file);
            event.target.value = "";
          }}
        />
      </div>
    </li>
  );
}

export function ShowcaseEditor({
  initial,
  slots,
  stepCount,
}: {
  initial: ShowcaseFormInput;
  slots: Record<string, SlotDefinition>;
  stepCount: number;
}) {
  const router = useRouter();
  const [values, setValues] = useState(() => ({
    ...initial,
    steps: Array.from({ length: stepCount }, (_, i) => initial.steps[i] ?? { title: "", body: "" }),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ShowcaseFormInput>(key: K, value: ShowcaseFormInput[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));
  const text = (value: string) => (value.trim() ? value : null);

  function save() {
    startTransition(async () => {
      const result = await saveShowcaseAction({
        ...values,
        steps: values.steps.filter((step) => step.title.trim() && step.body.trim()),
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setErrors({});
      setMessage({ kind: "ok", text: "Kaydedildi. Vitrin arka planda güncelleniyor." });
      router.refresh();
    });
  }

  return (
    <form
      className="mt-8 space-y-10"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="eyebrow">Üst başlık</Label>
          <Input
            id="eyebrow"
            value={values.eyebrow ?? ""}
            onChange={(e) => set("eyebrow", text(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="title">Başlık</Label>
          <Input
            id="title"
            value={values.title}
            aria-invalid={Boolean(errors.title)}
            onChange={(e) => set("title", e.target.value)}
          />
          {errors.title ? <p className="text-xs text-destructive">{errors.title}</p> : null}
        </div>
        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="subtitle">Alt metin</Label>
          <Textarea
            id="subtitle"
            rows={2}
            value={values.subtitle ?? ""}
            onChange={(e) => set("subtitle", text(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ctaLabel">Buton metni</Label>
          <Input
            id="ctaLabel"
            value={values.ctaLabel ?? ""}
            onChange={(e) => set("ctaLabel", text(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ctaHref">Buton bağlantısı</Label>
          <Input
            id="ctaHref"
            placeholder="/urun/…"
            value={values.ctaHref ?? ""}
            aria-invalid={Boolean(errors.ctaHref)}
            onChange={(e) => set("ctaHref", text(e.target.value))}
          />
          {errors.ctaHref ? <p className="text-xs text-destructive">{errors.ctaHref}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="startsAt">Yayın başlangıcı</Label>
          <Input
            id="startsAt"
            type="datetime-local"
            value={toLocalInput(values.startsAt)}
            onChange={(e) => set("startsAt", fromLocalInput(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endsAt">Yayın bitişi</Label>
          <Input
            id="endsAt"
            type="datetime-local"
            value={toLocalInput(values.endsAt)}
            aria-invalid={Boolean(errors.endsAt)}
            onChange={(e) => set("endsAt", fromLocalInput(e.target.value))}
          />
          {errors.endsAt ? <p className="text-xs text-destructive">{errors.endsAt}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="accent">Vurgu rengi</Label>
          <div className="flex items-center gap-3">
            <input
              id="accent"
              type="color"
              value={values.accent ?? "#c9a36a"}
              onChange={(e) => set("accent", e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-md border bg-transparent"
            />
            <span className="font-mono text-xs text-muted-foreground">
              {values.accent ?? "varsayılan"}
            </span>
          </div>
        </div>
        <label className="flex items-center gap-3 self-end text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[var(--brass)]"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
          Yayında
        </label>
      </section>

      {stepCount > 0 ? (
        <section>
          <h2 className="font-medium">Scroll adımları</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Her adım animasyonun bir fazına eşlenir; sayısı şablonca sabittir.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {values.steps.map((step, index) => (
              <div key={index} className="space-y-2 rounded-xl border p-4">
                <p className="font-mono text-xs text-brass">
                  {String(index + 1).padStart(2, "0")} / {String(stepCount).padStart(2, "0")}
                </p>
                <Input
                  aria-label={`Adım ${index + 1} başlık`}
                  placeholder="Başlık"
                  value={step.title}
                  onChange={(e) =>
                    set(
                      "steps",
                      values.steps.map((s, i) =>
                        i === index ? { ...s, title: e.target.value } : s,
                      ),
                    )
                  }
                />
                <Textarea
                  aria-label={`Adım ${index + 1} metin`}
                  placeholder="Metin"
                  rows={3}
                  value={step.body}
                  onChange={(e) =>
                    set(
                      "steps",
                      values.steps.map((s, i) =>
                        i === index ? { ...s, body: e.target.value } : s,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="font-medium">Katman slotları</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Animasyon bu slotlara bağlıdır. Bir görsel atamak yalnızca slotun içeriğini değiştirir;
          pivot, derinlik ve zamanlamalar korunur. Oranı uymayan görseller kabul edilmez.
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(slots).map(([key, slot]) => (
            <SlotCard
              key={key}
              slotKey={key}
              slot={slot}
              asset={values.layers[key]}
              error={errors[`layers.${key}`]}
              onChange={(asset) => {
                const next = { ...values.layers };
                if (asset) next[key] = asset;
                else delete next[key];
                set("layers", next);
              }}
            />
          ))}
        </ul>
      </section>

      <div className="sticky bottom-0 z-10 -mx-6 flex items-center justify-between gap-4 border-t bg-background/95 px-6 py-4 lg:-mx-10 lg:px-10">
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
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Kaydet
        </Button>
      </div>
    </form>
  );
}
