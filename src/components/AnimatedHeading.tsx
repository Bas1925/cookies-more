"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import { useLanguage } from "@/lib/language-context";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedHeadingProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Delay before the reveal begins, in seconds. */
  delay?: number;
  /** Start the reveal immediately instead of on scroll. */
  immediate?: boolean;
  /**
   * Force text direction. Use `ltr` for Latin brand names so SplitType
   * word wrappers don't reverse under Arabic/Hebrew document direction.
   */
  dir?: "ltr" | "rtl" | "auto";
}

/**
 * Reveals a heading word-by-word using SplitType + GSAP.
 * Fully cleans up its split, tween, and ScrollTrigger on unmount.
 * Falls back to a plain, fully-visible heading when reduced motion is on.
 */
function mostlyLtr(text: string) {
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  const rtl = (text.match(/[\u0590-\u05FF\u0600-\u06FF]/g) || []).length;
  return latin > 0 && latin >= rtl;
}

export default function AnimatedHeading({
  children,
  as = "h2",
  className,
  delay = 0,
  immediate = false,
  dir,
}: AnimatedHeadingProps) {
  const ref = useRef<HTMLElement>(null);
  // Needed as an effect dependency: the hero title reads "Cookies & More" in
  // all three languages, so `children` alone never changes on a switch and the
  // re-align below would keep the previous direction's alignment.
  const { dir: pageDir } = useLanguage();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const split = new SplitType(el, {
      types: "lines,words",
      lineClass: "split-line",
    });

    /**
     * SplitType copies the computed `text-align` inline onto every line it
     * creates. A Latin heading is pinned to dir="ltr" above so its word
     * wrappers don't lay out in reverse under RTL — but that also makes the
     * `start` keyword resolve to "left", which left the hero title hugging the
     * inner edge in Arabic/Hebrew while the rest of the column hugged the
     * outer one. Resolve start/end against the *page* direction instead, so
     * word order and alignment can disagree. `center` is left alone.
     */
    const pageRtl = pageDir === "rtl";
    for (const line of split.lines ?? []) {
      const align = (line as HTMLElement).style.textAlign;
      if (align === "start") {
        (line as HTMLElement).style.textAlign = pageRtl ? "right" : "left";
      } else if (align === "end") {
        (line as HTMLElement).style.textAlign = pageRtl ? "left" : "right";
      }
    }

    const ctx = gsap.context(() => {
      gsap.set(split.words, { yPercent: 120, opacity: 0 });
      const tween = gsap.to(split.words, {
        yPercent: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.045,
        delay,
        scrollTrigger: immediate
          ? undefined
          : {
              trigger: el,
              start: "top 85%",
              once: true,
            },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    }, el);

    return () => {
      ctx.revert();
      split.revert();
    };
  }, [delay, immediate, children, pageDir]);

  const Tag = as as ElementType;

  /**
   * SplitType replaces the heading's text node with per-word elements, which
   * React knows nothing about. On a language switch React would patch the
   * stale structure and the effect cleanup would then `revert()` it back to
   * the *previous* text. Keying on the text makes React mount a fresh element
   * instead, so the split always runs against the current copy.
   */
  const textKey = typeof children === "string" ? children : undefined;
  const resolvedDir =
    dir ??
    (typeof children === "string" && mostlyLtr(children) ? "ltr" : undefined);

  return (
    <Tag
      key={textKey}
      ref={ref}
      className={className}
      data-animated-heading
      dir={resolvedDir}
      style={resolvedDir === "ltr" ? { unicodeBidi: "isolate" } : undefined}
    >
      {children}
    </Tag>
  );
}
