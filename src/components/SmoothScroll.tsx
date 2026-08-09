"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenis, scrollToElement } from "@/lib/lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Wires Lenis smooth scrolling into GSAP's ticker and keeps ScrollTrigger
 * in sync. Respects prefers-reduced-motion by skipping Lenis entirely.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Anchor links — Lenis-aware when available, native fallback otherwise.
    // Category deep links (#shop-cookies, #shop-boxes, …) land on the shop
    // category bar; plain #shop goes to the shop section heading.
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;

      if (id.startsWith("#shop")) {
        e.preventDefault();
        if (window.location.hash !== id) {
          window.location.hash = id;
        }
        const bar = document.getElementById("shop-categories");
        const shop = document.getElementById("shop");
        const el = id === "#shop" ? shop : bar ?? shop;
        if (el) scrollToElement(el);
        return;
      }

      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      scrollToElement(el as HTMLElement);
    };
    document.addEventListener("click", handleAnchorClick);

    if (prefersReduced) {
      setLenis(null);
      ScrollTrigger.refresh();
      return () => {
        document.removeEventListener("click", handleAnchorClick);
      };
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    setLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      // GSAP ticker runs in seconds; Lenis expects milliseconds.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      gsap.ticker.remove(onTick);
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
