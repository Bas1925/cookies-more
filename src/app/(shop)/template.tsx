"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Page enter wrapper. Clears any leftover transform after the animation so
 * ScrollTrigger pins (position: fixed) are not trapped in a containing block.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const clearTransform = () => {
      el.style.transform = "none";
      el.style.removeProperty("transform");
      ScrollTrigger.refresh();
    };

    const onEnd = (e: AnimationEvent) => {
      if (e.target !== el) return;
      clearTransform();
    };

    el.addEventListener("animationend", onEnd);
    const t = window.setTimeout(clearTransform, 700);

    return () => {
      el.removeEventListener("animationend", onEnd);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div ref={ref} className="page-enter">
      {children}
    </div>
  );
}
