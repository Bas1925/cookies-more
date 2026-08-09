import type { CSSProperties } from "react";

/**
 * The original hand-styled illustrated cookie (chocolate-chunk palette),
 * used as the rotating hero graphic. Deterministic layout so SSR and client
 * markup match.
 */
export default function HeroCookie({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  const dough = "#e7b678";
  const edge = "#c88a4a";
  const spot = "#b9793b";
  const chip = "#3b2117";

  // Fixed chip positions (x, y, r, rotation).
  const chips: [number, number, number, number][] = [
    [66, 74, 9, 12],
    [128, 60, 11, -20],
    [95, 110, 10, 40],
    [150, 120, 8, 10],
    [72, 140, 9, -15],
    [120, 150, 10, 25],
    [55, 108, 7, 0],
    [104, 78, 8, -30],
    [140, 92, 7, 18],
  ];

  const fleckDots: [number, number][] = [
    [88, 66],
    [116, 100],
    [64, 124],
    [136, 138],
    [100, 132],
  ];

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={style}
      role="img"
      aria-label="A warm chocolate chunk cookie"
    >
      <defs>
        <radialGradient id="hero-dough" cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor={lighten(dough)} />
          <stop offset="70%" stopColor={dough} />
          <stop offset="100%" stopColor={edge} />
        </radialGradient>
      </defs>

      {/* body */}
      <circle
        cx="100"
        cy="100"
        r="82"
        fill="url(#hero-dough)"
        stroke={edge}
        strokeWidth="4"
      />
      {/* baked spots */}
      <circle cx="78" cy="92" r="26" fill={spot} opacity="0.18" />
      <circle cx="126" cy="118" r="22" fill={spot} opacity="0.16" />
      <circle cx="112" cy="70" r="16" fill={spot} opacity="0.14" />

      {/* chips */}
      {chips.map(([cx, cy, r, rot], i) => (
        <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
          <rect
            x={cx - r}
            y={cy - r}
            width={r * 2}
            height={r * 2}
            rx={r * 0.5}
            fill={chip}
          />
          <rect
            x={cx - r}
            y={cy - r}
            width={r * 2}
            height={r * 0.8}
            rx={r * 0.4}
            fill={lighten(chip)}
            opacity="0.5"
          />
        </g>
      ))}

      {/* salt flecks */}
      {fleckDots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.4" fill="#fff" opacity="0.8" />
      ))}
    </svg>
  );
}

function lighten(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.28);
  return rgbToHex(mix(r), mix(g), mix(b));
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}
