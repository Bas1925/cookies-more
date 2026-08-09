"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { Product } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

interface ProductThumbProps {
  product: Product;
  /** Sizing / shape utility classes for the container (e.g. "h-12 w-12"). */
  className?: string;
  /** Rounding utility; defaults to a circle. */
  rounded?: string;
  sizes?: string;
  priority?: boolean;
  style?: CSSProperties;
}

/**
 * Self-contained circular (by default) product photo. The container carries
 * the size via `className`; the image fills and covers it. Most of the menu
 * has no photography yet, so products without an `image` fall back to a tile
 * tinted with the product's accent color. The initial is drawn in an SVG so
 * it scales with the tile at every size the thumb is used at.
 */
export default function ProductThumb({
  product,
  className = "",
  rounded = "rounded-full",
  sizes = "96px",
  priority = false,
  style,
}: ProductThumbProps) {
  const { L } = useLanguage();
  const name = L(product.name);

  return (
    <div
      className={`relative overflow-hidden bg-cream-dark ${rounded} ${className}`}
      style={style}
    >
      {product.image ? (
        <Image
          src={product.image}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={{ objectPosition: product.objectPosition ?? "center" }}
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          <rect width="100" height="100" fill={product.accent} />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.92)"
            fontSize="44"
            fontWeight="600"
            fontFamily="var(--font-fraunces), serif"
          >
            {name.slice(0, 1)}
          </text>
        </svg>
      )}
    </div>
  );
}
