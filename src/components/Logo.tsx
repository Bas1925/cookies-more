"use client";

import { useId } from "react";

/**
 * Brand wordmark matching cookies_logo.jpeg — cream cookie "O"s on a brick tile.
 * SVG so it stays sharp in the nav (the full poster photo is unreadable when tiny).
 */
export default function Logo({ className = "" }: { className?: string }) {
  const biteId = useId().replace(/:/g, "");

  return (
    <span className={`inline-flex items-center ${className}`}>
      <svg
        viewBox="0 0 112 80"
        /* The wordmark is Latin and must not mirror with the UI language.
           Without this it inherits direction:rtl from <html> in Arabic and
           Hebrew, which flips what text-anchor="start" means — the "C" then
           renders leftwards off the tile and is clipped away. */
        direction="ltr"
        className="h-12 w-auto rounded-xl shadow-sm ring-1 ring-chocolate/15"
        role="img"
        aria-label="Cookies & More"
      >
        <rect width="112" height="80" rx="12" fill="#964534" />

        {/* C */}
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

        {/* Bitten cookie O */}
        <g transform="translate(36 12)">
          <defs>
            <mask id={biteId}>
              <circle cx="14" cy="14" r="12.5" fill="#fff" />
              <circle cx="24" cy="10" r="7" fill="#000" />
            </mask>
          </defs>
          <circle
            cx="14"
            cy="14"
            r="12.5"
            fill="#f3e6d4"
            mask={`url(#${biteId})`}
          />
          <circle cx="9" cy="11" r="1.5" fill="#964534" />
          <circle cx="15" cy="9" r="1.2" fill="#964534" />
          <circle cx="11" cy="17" r="1.3" fill="#964534" />
          <circle cx="16" cy="15" r="1.1" fill="#964534" />
        </g>

        {/* Whole cookie O */}
        <g transform="translate(68 12)">
          <circle cx="14" cy="14" r="12.5" fill="#f3e6d4" />
          <circle cx="9" cy="10" r="1.5" fill="#964534" />
          <circle cx="16" cy="9" r="1.2" fill="#964534" />
          <circle cx="12" cy="16" r="1.3" fill="#964534" />
          <circle cx="18" cy="15" r="1.1" fill="#964534" />
          <circle cx="14" cy="12" r="1" fill="#964534" />
        </g>

        {/* KIES */}
        <text
          x="56"
          y="68"
          textAnchor="middle"
          fill="#f3e6d4"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="24"
          fontWeight="700"
          letterSpacing="0.14em"
        >
          KIES
        </text>
      </svg>
    </span>
  );
}
