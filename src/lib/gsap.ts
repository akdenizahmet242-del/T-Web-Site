"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * GSAP eklentilerini tek yerde, bir kez kaydeder. Bileşenler GSAP'i her zaman
 * buradan import eder → eklenti kaydı sırası ve config tutarlı kalır.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

  // Mobil adres çubuğu açılıp kapanırken (yalnızca yükseklik değişir) tüm
  // tetikleyicileri yeniden hesaplama → takılmayı önler.
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: "power3.out" });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
