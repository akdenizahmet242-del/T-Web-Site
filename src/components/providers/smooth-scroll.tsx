"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { gsap, ScrollTrigger } from "@/lib/gsap";

import "lenis/dist/lenis.css";

let lenis: Lenis | null = null;

/** Modal/sheet açıkken arka plan kaydırmasını durdurmak için. */
export function setSmoothScrollLocked(locked: boolean) {
  if (locked) lenis?.stop();
  else lenis?.start();
}

/**
 * Lenis + GSAP tek saat (ticker) üzerinde çalışır:
 *   - Lenis'in kendi requestAnimationFrame döngüsü kapalı (autoRaf: false),
 *   - GSAP ticker her karede lenis.raf() çağırır,
 *   - her Lenis scroll olayında ScrollTrigger.update().
 * Böylece pin/scrub hesapları ile yumuşatılmış scroll aynı karede biter;
 * "titreme" (jitter) oluşmaz.
 *
 * DOM sarmalayıcısı üretmez: native scroll korunur (position: sticky, anchor,
 * erişilebilirlik ve tarayıcı bulma özelliği bozulmaz).
 */
export function SmoothScroll() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    lenis = new Lenis({ autoRaf: false, lerp: 0.12, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  return null;
}
