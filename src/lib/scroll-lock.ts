import { getLenis } from "./lenis";

/**
 * Body scroll lock that actually holds on iOS Safari.
 *
 * `html { overflow: hidden }` is enough everywhere else, but Safari on iOS
 * ignores it and keeps the page scrollable underneath. With the page still
 * scrolled, `position: fixed` overlays are laid out against a viewport that
 * no longer matches what you see: the drawer renders off-screen and only
 * snaps into place once a tap forces a repaint — and then at the wrong
 * offset. Pinning the body with `position: fixed` and a negative `top` is
 * the one approach Safari honours.
 *
 * Lenis is paused for the duration. It runs its own scroll loop off the GSAP
 * ticker, so left running it overwrites the restored offset on the next frame
 * and the page lands back at the top.
 *
 * Reference counted, because the bag and the mobile menu can both be open at
 * once. Releasing is deferred by a microtask so that handing over from one to
 * the other — tapping "Bag" inside the open menu closes the menu and opens
 * the drawer in a single commit — does not drop the lock and re-take it. That
 * round trip would capture a scroll offset of 0 while the body is still
 * pinned, losing the reader's place on the page.
 */
let locks = 0;
let savedScrollY = 0;
let releaseQueued = false;

function isApplied() {
  return document.body.style.position === "fixed";
}

export function lockScroll() {
  if (typeof document === "undefined") return;

  locks += 1;
  releaseQueued = false;

  if (locks > 1 || isApplied()) return;

  savedScrollY = window.scrollY;
  getLenis()?.stop();

  const { style } = document.body;
  style.position = "fixed";
  style.top = `-${savedScrollY}px`;
  style.left = "0";
  style.right = "0";
  style.width = "100%";
  document.documentElement.classList.add("no-scroll");
}

export function unlockScroll() {
  if (typeof document === "undefined") return;
  if (locks === 0) return;

  locks -= 1;
  if (locks > 0) return;

  releaseQueued = true;
  queueMicrotask(() => {
    // A lock taken in the same commit cancels this release.
    if (!releaseQueued || locks > 0) return;
    releaseQueued = false;

    const { style } = document.body;
    style.position = "";
    style.top = "";
    style.left = "";
    style.right = "";
    style.width = "";
    document.documentElement.classList.remove("no-scroll");

    // While the body was pinned the document had no scroll height, and the
    // browser clamps a restore to 0 until it has laid out again. Reading a
    // layout property forces that synchronously.
    void document.body.offsetHeight;
    window.scrollTo(0, savedScrollY);

    const lenis = getLenis();
    lenis?.start();
    // Lenis was stopped throughout and still holds its old target, so hand it
    // the restored position rather than let it snap back.
    lenis?.scrollTo(savedScrollY, { immediate: true, force: true });
  });
}
