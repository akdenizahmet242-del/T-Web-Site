"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export type SceneBuildContext = {
  /** 0 → 10 birimlik, scroll'a bağlı (scrub) zaman çizelgesi */
  tl: gsap.core.Timeline;
  /** Sahne içindeki slot düğümü: data-layer="…" */
  layer: (slot: string) => HTMLElement;
  /** Sahne içi seçici */
  q: (selector: string) => HTMLElement[];
  stage: HTMLElement;
  desktop: boolean;
};

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  steps: { title: string; body: string }[];
  ctaLabel?: string | null;
  ctaHref?: string | null;
  /** Sahne kutusunun en-boy oranı (CSS aspect-ratio) */
  aspect: string;
  stageLabel: string;
  /** Sahnenin CSS sınıfları (genişlik vb.) */
  stageClassName?: string;
  children: ReactNode;
  build: (context: SceneBuildContext) => void;
};

/**
 * Tüm ürün sahnelerinin ortak kabuğu: pinlenmiş bölüm, fazlara eşlenmiş metin
 * adımları, ilerleme çizgisi ve hareket-azaltma desteği. Şablona özgü hareket
 * `build` içinde tanımlanır; katmanlar sunucuda render edilip `children` ile gelir.
 */
export function ScrollScene({
  eyebrow,
  title,
  subtitle,
  steps,
  ctaLabel,
  ctaHref,
  aspect,
  stageLabel,
  stageClassName,
  children,
  build,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const q = gsap.utils.selector(root) as (selector: string) => HTMLElement[];
      const stage = q("[data-stage]")[0];
      const stepEls = q("[data-step]");
      const progress = q("[data-progress]")[0];

      const mm = gsap.matchMedia();
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 1024px)" },
        (context) => {
          const { motion, desktop } = context.conditions as Record<"motion" | "desktop", boolean>;
          if (!motion) return;

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: desktop ? "+=300%" : "+=240%",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          build({ tl, q, stage, desktop, layer: (slot) => q(`[data-layer="${slot}"]`)[0] });

          // Adımlar zaman çizelgesine eşit aralıklarla yerleşir.
          const slice = 10 / Math.max(1, stepEls.length);
          stepEls.forEach((step, index) => {
            if (index > 0) {
              tl.fromTo(
                step,
                { autoAlpha: 0, y: 24 },
                { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
                index * slice + 0.15,
              );
            }
            if (index < stepEls.length - 1) {
              tl.to(
                step,
                { autoAlpha: 0, y: -24, duration: 0.45, ease: "power1.in" },
                (index + 1) * slice - 0.35,
              );
            }
          });
          tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 10 }, 0);
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      aria-label={title}
      className="relative isolate overflow-hidden bg-background motion-safe:h-svh"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_55%_at_65%_50%,color-mix(in_oklab,var(--brass)_12%,transparent),transparent_72%)]"
      />
      <div className="mx-auto grid h-full max-w-7xl content-center items-center gap-6 px-5 pt-20 pb-6 sm:gap-8 sm:px-8 sm:pt-24 sm:pb-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 lg:py-0">
        <div className="relative z-10 order-2 lg:order-1">
          <p className="font-mono text-[11px] tracking-[0.28em] text-brass uppercase">{eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl leading-[0.95] text-balance sm:mt-4 sm:text-6xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-5 hidden max-w-md text-pretty text-muted-foreground sm:block">
              {subtitle}
            </p>
          ) : null}

          <div className="relative mt-5 motion-safe:min-h-32 sm:mt-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                data-step
                className={cn(
                  "motion-safe:absolute motion-safe:inset-x-0 motion-safe:top-0 motion-reduce:mb-6",
                  index > 0 && "motion-safe:invisible motion-safe:opacity-0",
                )}
              >
                <p className="font-mono text-xs text-brass">
                  {String(index + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-2xl sm:text-3xl">{step.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <span className="mt-4 block h-px max-w-md overflow-hidden bg-border motion-reduce:hidden sm:mt-6">
            <span
              data-progress
              className="block h-full origin-left scale-x-0 bg-brass will-change-transform"
            />
          </span>

          {ctaLabel && ctaHref ? (
            <Link
              href={ctaHref}
              className="group mt-5 inline-flex items-center gap-2 rounded-full border border-brass/40 px-5 py-2.5 text-sm transition-colors hover:border-brass hover:bg-brass hover:text-primary-foreground sm:mt-8"
            >
              {ctaLabel}
              <ArrowUpRight className="size-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : null}
        </div>

        <div className="relative order-1 flex items-center justify-center lg:order-2 lg:justify-end">
          <div
            data-stage
            role="img"
            aria-label={stageLabel}
            className={cn("relative perspective-[1600px]", stageClassName)}
            style={{ aspectRatio: aspect }}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
