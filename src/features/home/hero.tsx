"use client";

import { ArrowDown } from "lucide-react";
import { useRef } from "react";

import { gsap, SplitText, useGSAP } from "@/lib/gsap";

/**
 * Açılış sahnesi: başlık satır satır maskeden yükselir (SplitText),
 * scroll'da hafif parallax ile geri çekilir.
 */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const headline = rootRef.current?.querySelector<HTMLElement>("[data-headline]");
        if (!headline) return;

        const split = SplitText.create(headline, {
          type: "lines,words",
          mask: "lines",
          autoSplit: true, // font yüklenince / yeniden boyutta satırları yeniden böler
          onSplit(self) {
            gsap.set(headline, { visibility: "visible" });
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.2,
              stagger: 0.09,
              ease: "expo.out",
              delay: 0.15,
            });
          },
        });

        gsap.from("[data-hero-fade]", {
          autoAlpha: 0,
          y: 16,
          duration: 1,
          stagger: 0.1,
          delay: 0.7,
        });

        gsap.to("[data-hero-inner]", {
          yPercent: -18,
          autoAlpha: 0.2,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        return () => split.revert();
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="relative isolate flex min-h-svh items-end overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_80%_20%,color-mix(in_oklab,var(--brass)_18%,transparent),transparent_70%),radial-gradient(50%_50%_at_10%_90%,color-mix(in_oklab,var(--walnut)_30%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 grain opacity-[0.07]"
      />

      <div data-hero-inner className="mx-auto w-full max-w-7xl px-5 pt-32 pb-16 sm:px-8 lg:pb-24">
        <p data-hero-fade className="font-mono text-[11px] tracking-[0.3em] text-brass uppercase">
          Atölye koleksiyonu · 2026
        </p>
        <h1
          data-headline
          className="split-reveal mt-6 max-w-5xl font-display text-[clamp(3.2rem,9vw,8.5rem)] leading-[0.92] tracking-tight text-balance"
        >
          Biçim, işlev <em className="text-brass">ve zaman.</em>
        </h1>
        <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <p data-hero-fade className="max-w-md text-pretty text-muted-foreground">
            Duvar saatlerinden banyo dolaplarına, arıtma sistemlerinden kitap ayraçlarına — her
            nesne, kullanıldıkça değer kazanan malzemeler ve sessiz bir işçilikle üretildi.
          </p>
          <a
            data-hero-fade
            href="#anatomi"
            className="group inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <span className="grid size-11 place-items-center rounded-full border border-border transition-colors group-hover:border-brass">
              <ArrowDown className="size-4 transition-transform duration-500 ease-out-expo group-hover:translate-y-0.5" />
            </span>
            Kaydırarak keşfedin
          </a>
        </div>
      </div>
    </section>
  );
}
