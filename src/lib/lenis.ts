import type Lenis from "lenis";

let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

export function getLenis() {
  return instance;
}

/** Scroll the page to an absolute Y position (Lenis-aware). */
export function scrollToY(
  y: number,
  opts: { immediate?: boolean; duration?: number } = {},
) {
  if (instance) {
    instance.scrollTo(y, {
      immediate: opts.immediate ?? false,
      duration: opts.duration,
    });
    return;
  }
  window.scrollTo({
    top: y,
    behavior: opts.immediate ? "auto" : "smooth",
  });
}

/**
 * Scroll to an element, accounting for the sticky nav. Prefer this over
 * `scrollIntoView` — Lenis ignores CSS scroll-margin, and native
 * scrollIntoView fights the smooth-scroll loop.
 */
export function scrollToElement(
  el: HTMLElement,
  opts: { offset?: number; immediate?: boolean } = {},
) {
  const navVar = getComputedStyle(document.documentElement)
    .getPropertyValue("--nav-h")
    .trim();
  const navH = Number.parseFloat(navVar) || 80;
  const offset = opts.offset ?? navH;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  scrollToY(Math.max(0, y), { immediate: opts.immediate });
}
