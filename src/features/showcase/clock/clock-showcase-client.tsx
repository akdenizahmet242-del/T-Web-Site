"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/** Arkadan öne katman sırası — şablon sözleşmesindeki slot anahtarlarıyla aynı. */
export const CLOCK_SLOTS = [
  "case",
  "movement",
  "dial",
  "hourHand",
  "minuteHand",
  "secondHand",
  "glass",
  "bezel",
] as const;

export type ClockSlot = (typeof CLOCK_SLOTS)[number];

/** Patlatılmış görünümde z-derinliği (sahne genişliğine oran). */
const EXPLODED_DEPTH: Record<ClockSlot, number> = {
  case: -0.46,
  movement: -0.24,
  dial: 0,
  hourHand: 0.07,
  minuteHand: 0.12,
  secondHand: 0.17,
  glass: 0.29,
  bezel: 0.4,
};

/** Birleşik haldeki katman aralığı (px) — eş düzlemli katmanlarda z-fighting olmasın. */
const ASSEMBLED_GAP = 2;

/** Ürün fotoğraflarının klasik pozu: 10:10:35 */
const START = { hour: 305, minute: 60, second: 210 };

export type ClockCallout = { id: string; label: string; detail: string };

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: { title: string; body: string }[];
  ctaLabel: string;
  ctaHref: string;
  callouts: ClockCallout[];
  layers: Record<ClockSlot, ReactNode>;
};

const initialRotation: Partial<Record<ClockSlot, number>> = {
  hourHand: START.hour,
  minuteHand: START.minute,
  secondHand: START.second,
};

function formatClock(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function ClockShowcaseClient({
  eyebrow,
  title,
  subtitle,
  steps,
  ctaLabel,
  ctaHref,
  callouts,
  layers,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const q = gsap.utils.selector(root);
      const stage = q<HTMLElement>("[data-stage]")[0];
      const rig = q<HTMLElement>("[data-rig]")[0];
      const shadow = q<HTMLElement>("[data-shadow]")[0];
      const readout = q<HTMLElement>("[data-readout]")[0];
      const progress = q<HTMLElement>("[data-progress]")[0];
      const stepEls = q<HTMLElement>("[data-step]");
      const calloutEls = q<HTMLElement>("[data-callout]");
      const gears = q<HTMLElement>("[data-gear]");
      const layer = (slot: ClockSlot) => q<HTMLElement>(`[data-layer="${slot}"]`)[0];
      const layerEls = CLOCK_SLOTS.map(layer);

      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          desktop: "(min-width: 1024px)",
          wide: "(min-width: 1280px)", // etiketlerin göründüğü genişlik
        },
        (context) => {
          const { motion, desktop, wide } = context.conditions as Record<
            "motion" | "desktop" | "wide",
            boolean
          >;
          if (!motion) return; // Hareket azaltılmış: CSS'teki statik düzen geçerli.

          // Saniye ibresi scroll'dan bağımsız, gerçek zamanlı akar (süpürme mekanizma).
          // Sahne ekrandan çıkınca durur → boşa kare üretilmez.
          const sweep = gsap.fromTo(
            layer("secondHand"),
            { rotation: START.second },
            { rotation: START.second + 360, duration: 60, ease: "none", repeat: -1, paused: true },
          );
          const visibility = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) sweep.play();
            else sweep.pause();
          });
          visibility.observe(stage);

          gsap.set(layerEls, { z: (index: number) => index * ASSEMBLED_GAP, force3D: true });
          gsap.set(layer("hourHand"), { rotation: START.hour });
          gsap.set(layer("minuteHand"), { rotation: START.minute });

          const explodedZ = (slot: ClockSlot) => () => stage.offsetWidth * EXPLODED_DEPTH[slot];

          let lastMinute = -1;
          const minuteHand = layer("minuteHand");
          const updateReadout = () => {
            const rotation = Number(gsap.getProperty(minuteHand, "rotation"));
            const elapsed = Math.round((rotation - START.minute) / 6);
            if (elapsed === lastMinute) return; // DOM'a yalnızca dakika değişince yaz
            lastMinute = elapsed;
            readout.textContent = formatClock(10 * 60 + 10 + elapsed);
          };

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            onUpdate: updateReadout,
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: desktop ? "+=340%" : "+=260%",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          // ── Faz 1 · Zaman (0 → 3): yelkovan tam tur, akrep 30°, dişliler döner ──
          tl.to(minuteHand, { rotation: START.minute + 360, duration: 3, ease: "power1.inOut" }, 0)
            .to(
              layer("hourHand"),
              { rotation: START.hour + 30, duration: 3, ease: "power1.inOut" },
              0,
            )
            .to(rig, { scale: 1.04, duration: 3, ease: "power1.inOut" }, 0);

          gears.forEach((gear) => {
            const ratio = Number(gear.dataset.ratio ?? 1);
            tl.to(gear, { rotation: 300 * ratio, duration: 10 }, 0);
          });

          // ── Faz 2 · Anatomi (3 → 6): sahne eğilir, katmanlar z ekseninde ayrılır ──
          tl.to(
            rig,
            {
              rotationX: 58,
              rotationY: -22,
              rotation: 8,
              // Geniş ekranda sahne sola kayar → sağdaki etiketlere yer açılır.
              x: () => (wide ? -stage.offsetWidth * 0.2 : 0),
              scale: desktop ? 0.78 : 0.7,
              duration: 3,
              ease: "power2.inOut",
            },
            3,
          ).to(shadow, { opacity: 0.25, scale: 0.75, duration: 3, ease: "power2.inOut" }, 3);

          CLOCK_SLOTS.forEach((slot, index) => {
            tl.to(
              layer(slot),
              { z: explodedZ(slot), duration: 2.6, ease: "power2.inOut" },
              3.2 + index * 0.05,
            );
          });

          tl.fromTo(
            calloutEls,
            { autoAlpha: 0, x: 24 },
            { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.14, ease: "power2.out" },
            4.4,
          );

          // ── Faz 3 · Bütün (7 → 10): katmanlar yeniden birleşir ──
          tl.to(
            calloutEls,
            { autoAlpha: 0, x: -12, duration: 0.5, stagger: 0.05, ease: "power1.in" },
            7,
          );

          CLOCK_SLOTS.forEach((slot, index) => {
            tl.to(
              layer(slot),
              { z: index * ASSEMBLED_GAP, duration: 2.4, ease: "power3.inOut" },
              7.2 + (CLOCK_SLOTS.length - index) * 0.04,
            );
          });

          tl.to(
            rig,
            {
              rotationX: 0,
              rotationY: 0,
              rotation: 0,
              x: 0,
              scale: 1,
              duration: 2.6,
              ease: "power3.inOut",
            },
            7.2,
          ).to(shadow, { opacity: 1, scale: 1, duration: 2.6, ease: "power3.inOut" }, 7.2);

          // ── Metin adımları: fazlara eşlenmiş çapraz geçiş ──
          stepEls.forEach((step, index) => {
            if (index === 0) {
              if (stepEls.length > 1) {
                tl.to(step, { autoAlpha: 0, y: -24, duration: 0.5, ease: "power1.in" }, 2.7);
              }
              return;
            }
            const enterAt = index === 1 ? 3.2 : 7.4;
            tl.fromTo(
              step,
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" },
              enterAt,
            );
            if (index < stepEls.length - 1) {
              tl.to(step, { autoAlpha: 0, y: -24, duration: 0.5, ease: "power1.in" }, 6.9);
            }
          });

          tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 10 }, 0);

          return () => visibility.disconnect();
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      aria-labelledby="clock-showcase-title"
      className="relative isolate overflow-hidden bg-background motion-safe:h-svh"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_55%_at_68%_52%,color-mix(in_oklab,var(--brass)_16%,transparent),transparent_72%)]"
      />

      <div className="mx-auto grid h-full max-w-7xl content-center items-center gap-6 px-5 pt-20 pb-6 sm:gap-8 sm:px-8 sm:pt-24 sm:pb-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 lg:py-0">
        {/* ── Metin sütunu ── */}
        <div className="relative z-10 order-2 lg:order-1">
          <p className="font-mono text-[11px] tracking-[0.28em] text-brass uppercase">{eyebrow}</p>
          <h2
            id="clock-showcase-title"
            className="mt-3 font-display text-4xl leading-[0.95] text-balance sm:mt-4 sm:text-6xl xl:text-7xl"
          >
            {title}
          </h2>
          <p className="mt-5 hidden max-w-md text-pretty text-muted-foreground sm:block">
            {subtitle}
          </p>

          <div className="relative mt-5 motion-safe:min-h-32 sm:mt-8 sm:motion-safe:min-h-36">
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

          <div className="mt-4 flex items-center gap-4 motion-reduce:hidden sm:mt-6">
            <span
              data-readout
              aria-hidden
              className="w-[5ch] font-mono text-sm text-foreground tabular-nums"
            >
              10:10
            </span>
            <span className="relative h-px flex-1 overflow-hidden bg-border">
              <span
                data-progress
                className="absolute inset-0 origin-left scale-x-0 bg-brass will-change-transform"
              />
            </span>
          </div>

          <Link
            href={ctaHref}
            className="group mt-5 inline-flex items-center gap-2 rounded-full border border-brass/40 px-5 py-2.5 text-sm transition-colors hover:border-brass hover:bg-brass hover:text-primary-foreground sm:mt-8"
          >
            {ctaLabel}
            <ArrowUpRight className="size-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* ── Sahne ── */}
        <div className="relative order-1 flex items-center justify-center lg:order-2 lg:justify-end">
          <div
            data-stage
            role="img"
            aria-label="Meridyen ceviz duvar saati: kasa, mekanizma, kadran, ibreler, cam ve çerçeve katmanları"
            className="relative aspect-square w-[min(72vw,34svh)] perspective-[1800px] sm:w-[min(60vw,42svh)] lg:w-[min(36vw,70svh)]"
          >
            <div
              data-shadow
              aria-hidden
              className="absolute inset-[10%] translate-y-[9%] rounded-full bg-black/70 blur-2xl will-change-transform"
            />
            <div data-rig className="absolute inset-0 will-change-transform transform-3d">
              {CLOCK_SLOTS.map((slot) => (
                <div
                  key={slot}
                  data-layer={slot}
                  aria-hidden
                  className="absolute inset-0 will-change-transform backface-hidden"
                  style={
                    initialRotation[slot] !== undefined
                      ? { transform: `rotate(${initialRotation[slot]}deg)` }
                      : undefined
                  }
                >
                  {layers[slot]}
                </div>
              ))}
            </div>
          </div>

          <ol className="pointer-events-none absolute inset-y-0 right-0 hidden w-48 flex-col justify-center gap-5 xl:flex">
            {callouts.map((callout, index) => (
              <li
                key={callout.id}
                data-callout
                className="invisible flex items-start gap-3 opacity-0 motion-reduce:hidden"
              >
                <span className="mt-2 h-px w-8 shrink-0 bg-brass/60" />
                <span>
                  <span className="block font-mono text-[10px] tracking-[0.2em] text-brass">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="block text-sm text-foreground">{callout.label}</span>
                  <span className="block text-xs text-muted-foreground">{callout.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
