"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Intro sequence. The wordmark is drawn as vector rather than the logo JPEG —
 * that file is a 1080×1350 phone photo, and stretching it over the viewport
 * (2560px on a 2× display) was visibly soft. SVG stays crisp at any size and
 * lets each glyph animate on its own.
 *
 * The seven glyphs arrive one after another, the rule underneath fills, then
 * the whole panel lifts away. Capped so it can never outstay its welcome.
 */

/**
 * Centers for K·I·E·S at 24px Georgia bold, so each letter is its own element
 * and can be staggered — a single <text> would lay out for free, but tspans
 * can't carry a transform. Derived from the rendered glyph widths (20.7 / 10.8
 * / 17.4 / 15.6) for an even 2.3 gap, centred on the tile's 56.
 */
const WORD = [
  { char: "K", x: 30.1 },
  { char: "I", x: 48.7 },
  { char: "E", x: 65.1 },
  { char: "S", x: 83.9 },
];

export default function Preloader() {
  const [done, setDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const biteId = useId().replace(/:/g, "");

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      const raf = requestAnimationFrame(() => setDone(true));
      return () => cancelAnimationFrame(raf);
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => setDone(true) });

      // The tile lands first, then the glyphs queue in on top of it.
      tl.from(tileRef.current, {
        scale: 0.88,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.4)",
        transformOrigin: "center",
      })
        .from(
          "[data-glyph]",
          {
            yPercent: 55,
            opacity: 0,
            scale: 0.55,
            duration: 0.5,
            stagger: 0.075,
            ease: "back.out(2.2)",
            transformOrigin: "center",
          },
          "-=0.2",
        )
        .from(
          barRef.current,
          { scaleX: 0, duration: 0.9, ease: "power2.inOut" },
          "-=0.75",
        )
        .to(tileRef.current, {
          scale: 1.05,
          duration: 0.35,
          ease: "power1.inOut",
          transformOrigin: "center",
        })
        .to(
          rootRef.current,
          { yPercent: -100, duration: 0.7, ease: "power4.inOut" },
          "+=0.05",
        );
    }, rootRef);

    // Hard safety cap so the intro can never stall the page.
    const cap = window.setTimeout(() => setDone(true), 3000);

    return () => {
      window.clearTimeout(cap);
      ctx.revert();
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] grid place-items-center overflow-hidden bg-chocolate"
      aria-hidden="true"
    >
      {/* Warm pool of light behind the mark */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(150,69,52,0.85),transparent_62%)]" />

      <div className="relative flex flex-col items-center gap-7">
        <svg
          ref={tileRef}
          viewBox="0 0 112 80"
          direction="ltr"
          className="h-auto w-[min(62vw,340px)] drop-shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
          role="img"
          aria-label="Cookies & More"
        >
          <defs>
            <linearGradient id={`${biteId}-tile`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a4503c" />
              <stop offset="100%" stopColor="#8a3f2f" />
            </linearGradient>
            <mask id={biteId}>
              <circle cx="14" cy="14" r="12.5" fill="#fff" />
              <circle cx="24" cy="10" r="7" fill="#000" />
            </mask>
          </defs>

          <rect
            width="112"
            height="80"
            rx="12"
            fill={`url(#${biteId}-tile)`}
          />
          <rect
            x="0.6"
            y="0.6"
            width="110.8"
            height="78.8"
            rx="11.4"
            fill="none"
            stroke="#f3e6d4"
            strokeOpacity="0.22"
            strokeWidth="1.2"
          />

          {/* 1 — C */}
          <g data-glyph>
            <text
              x="10"
              y="38"
              fill="#f3e6d4"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize="30"
              fontWeight="700"
            >
              C
            </text>
          </g>

          {/* 2 — bitten cookie O */}
          <g data-glyph>
            <g transform="translate(36 12)">
              <circle
                cx="14"
                cy="14"
                r="12.5"
                fill="#f3e6d4"
                mask={`url(#${biteId})`}
              />
              <circle cx="9" cy="11" r="1.5" fill="#8a3f2f" />
              <circle cx="15" cy="9" r="1.2" fill="#8a3f2f" />
              <circle cx="11" cy="17" r="1.3" fill="#8a3f2f" />
              <circle cx="16" cy="15" r="1.1" fill="#8a3f2f" />
            </g>
          </g>

          {/* 3 — whole cookie O */}
          <g data-glyph>
            <g transform="translate(68 12)">
              <circle cx="14" cy="14" r="12.5" fill="#f3e6d4" />
              <circle cx="9" cy="10" r="1.5" fill="#8a3f2f" />
              <circle cx="16" cy="9" r="1.2" fill="#8a3f2f" />
              <circle cx="12" cy="16" r="1.3" fill="#8a3f2f" />
              <circle cx="18" cy="15" r="1.1" fill="#8a3f2f" />
              <circle cx="14" cy="12" r="1" fill="#8a3f2f" />
            </g>
          </g>

          {/* 4–7 — K I E S */}
          {WORD.map((letter) => (
            <g data-glyph key={letter.char}>
              <text
                x={letter.x}
                y="68"
                textAnchor="middle"
                fill="#f3e6d4"
                fontFamily="Georgia, 'Times New Roman', serif"
                fontSize="24"
                fontWeight="700"
              >
                {letter.char}
              </text>
            </g>
          ))}
        </svg>

        {/* Fills while the glyphs land */}
        <span className="block h-px w-[min(48vw,240px)] overflow-hidden bg-cream/15">
          <span
            ref={barRef}
            className="block h-full w-full origin-left bg-caramel"
          />
        </span>
      </div>
    </div>
  );
}
