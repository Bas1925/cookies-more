# Cookies & More 🍪

A playful, premium, animated marketing site for the Cookies & More bakery.
The menu mirrors the live order page at
[take.app/cookiesandmore](https://take.app/cookiesandmore) — real items, real
₪ prices, in English and Arabic.

**Orders placed here are real.** Checkout saves the order, and the shop is
pushed a notification on the spot. No money changes hands online — customers
pay **cash on delivery or at pickup** — so the site never collects card or
bank details.

Warm editorial design: oversized display type, real product photography, cinematic scroll animations, and a full shopping flow.

---

## Tech stack

| Area              | Choice                                          |
| ----------------- | ----------------------------------------------- |
| Framework         | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling           | Tailwind CSS v4                                  |
| Animation         | GSAP + ScrollTrigger                            |
| Smooth scrolling  | Lenis (synced to the GSAP ticker)               |
| Heading reveals   | SplitType                                       |
| Sliders           | Swiper                                          |
| Icons             | lucide-react                                    |
| Languages         | English / العربية / עברית, client-side switcher |
| Non-Latin type    | Cairo (Arabic) + Heebo (Hebrew), `next/font`   |
| Imagery           | `next/image` + product photos in `public/menu`  |

## Getting started

Requires **Node.js 18.18+** (Node 20+ recommended).

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> On this machine port 3000 is often taken, so the dev server may pick another
> port — check the terminal output for the exact URL.

### Other scripts

```bash
npm run build     # production build
npm run start     # serve the production build
npm run lint      # ESLint
npx tsc --noEmit  # type-check only
```

## Project structure

```
src/
├─ app/
│  ├─ layout.tsx           # fonts, SEO metadata, Open Graph, <AppFrame>
│  ├─ page.tsx             # homepage — composes every section
│  ├─ template.tsx         # fade-and-rise page transition
│  ├─ opengraph-image.tsx  # generated 1200×630 OG image (next/og)
│  └─ globals.css          # theme tokens, animations, reduced-motion rules
├─ components/
│  ├─ AppFrame.tsx         # CartProvider + SmoothScroll + Preloader + Navbar + CartDrawer
│  ├─ SmoothScroll.tsx     # Lenis ↔ GSAP ScrollTrigger bridge
│  ├─ Preloader.tsx        # sub-2s intro built from the logo image
│  ├─ Navbar.tsx           # sticky nav + animated mobile menu
│  ├─ CartDrawer.tsx       # cart, quantities, delivery/pickup, checkout
│  ├─ AnimatedHeading.tsx  # SplitType word-by-word reveal
│  ├─ ProductThumb.tsx     # rounded thumbnail; falls back to an accent tile
│  ├─ ProductCard.tsx      # square photo card + add-to-bag
│  ├─ Logo.tsx
│  └─ sections/            # Hero, FeaturedFlavors, ShopMenu, BuildABox,
│                          # BrandStory, Process, Instagram, Footer
└─ lib/
   ├─ types.ts             # typed product / cart / localized-string models
   ├─ data.ts              # the menu, store details, process steps
   ├─ i18n.ts              # language list + every chrome string, all 3 languages
   ├─ language-context.tsx # active language, `t()` / `L()`, html lang + dir
   └─ cart-context.tsx     # cart state + localStorage persistence + totals

public/
└─ flavors/                # product photography + logo (see below)
```

## The menu

`PRODUCTS` in `src/lib/data.ts` is the single source of truth — 41 items in
six categories, each with an English `name`, the Arabic `nameAr` exactly as it
appears on the take.app order page, and a `price` in shekels.

| Category      | Arabic         | Items |
| ------------- | -------------- | ----- |
| Boxes         | صناديق         | 3     |
| Cookies       | كوكيز          | 12    |
| Cakes         | كعك            | 10    |
| Mini Cakes    | ميني كعك       | 9     |
| Cinnamon Rolls| سينابون        | 4     |
| More Treats   | منوعات اخرى    | 3     |

### Photography

Every item has its real photo, pulled from the store's own order page and
saved under `public/menu/`. Filenames match product ids exactly, so `data.ts`
derives the path instead of repeating it:

```
public/menu/<product id>.jpeg   →   /menu/cookie-dubai.jpeg
```

**Adding a product:** add the entry to `MENU` in `src/lib/data.ts` and drop
`public/menu/<its id>.jpeg` alongside it. If an item genuinely has no photo,
set `image: undefined` on its entry and the card falls back to an
accent-tinted tile carrying the Arabic name.

Cards crop square — the source photos mix portrait and landscape, and a 4:3
crop cut the portrait ones off badly. Use `objectPosition` on a product to
nudge an individual crop.

`SHOWCASE_IDS` picks the seven signature **cookies** for the pinned horizontal
gallery near the top of the page — the section is titled "Our signature
cookies", so keep cakes and rolls out of it, and keep the list at seven since
the heading quotes the count. The brand logo still lives at
`public/flavors/cookies_logo.jpeg`.

### Things to confirm with the store

- `DELIVERY_FEE` in `src/lib/data.ts` is set to ₪15 as a placeholder.
- Taglines are our own copy — the source menu has no descriptions.
- The seven original demo photos in `public/flavors/` are no longer referenced
  (only the logo is) and can be deleted.

## Features

**Sections:** logo preloader, sticky nav with animated mobile menu, hero
(rotating cookie photo, floating chips, mouse parallax), signature-cookie
showcase (pinned horizontal scroll on desktop), the menu, build-a-box, pinned
brand story, scroll-animated baking process, Instagram grid, and footer.

**The menu shows one category at a time.** Rendering all 41 items at once
meant several screens of scrolling to reach the next category and the same
distance back, so `ShopMenu` opens on Cookies and the category bar is
`sticky` beneath the navbar — switching is one click from anywhere in the
list, and picking a category scrolls back to the top of the new one. Change
`DEFAULT_CATEGORY` in `ShopMenu.tsx` to open on a different one.

There is no newsletter, locations, or reviews section — the store has no
mailing list, the order page lists no street address, and its reviews page is
empty. Contact and social proof run through the Instagram grid and the footer
link. `INSTAGRAM_IDS` in `data.ts` picks the eight tiles; they link to the
profile, not to individual posts.

## Order notifications on the admin phone

The admin panel can push a notification to a phone the moment an order is
placed — including when the app is closed. It runs on the Web Push standard,
so there is no app store and no third-party service.

**Setup, once per deployment:**

1. Generate a key pair: `npx web-push generate-vapid-keys`
2. Add three environment variables to the host (Netlify → Site configuration →
   Environment variables), then redeploy:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY` — secret, never commit it
   - `VAPID_SUBJECT` — e.g. `mailto:you@example.com`
3. On the phone, open `/admin` in **Safari**, log in, then Share →
   **Add to Home Screen**.
4. Open the admin from that new icon, tap the bell, and turn alerts on. There
   is a "send a test alert" button to confirm it works.

**Why the Home Screen step is not optional on iPhone.** iOS has no Notification
API in a Safari tab at all — it only exists for an installed web app, from iOS
16.4 onwards. The panel detects this and shows the install instructions instead
of a dead "enable" button. Android and desktop can enable alerts directly.

Notifications are shown by `public/sw.js` via `registration.showNotification()`,
which is the only mechanism iOS supports — the page-level `new Notification()`
constructor does not exist there. `/api/orders` calls `sendOrderPush` after
saving an order; subscriptions live in Netlify Blobs (`src/lib/push-subs.ts`)
and are dropped automatically when a push service reports them expired.

`/admin` ships its own web manifest at `/admin/manifest.webmanifest` so the
Home Screen icon opens the panel rather than the storefront.

## Languages

The site ships in **English, Arabic and Hebrew**, switched from the navbar.
The choice persists in `localStorage` and drives `<html lang>` and `<html dir>`,
so Arabic and Hebrew render right-to-left with a font that has the glyphs
(Cairo and Heebo respectively — Fraunces and Outfit are Latin-only).

Two places hold copy:

- **`src/lib/i18n.ts`** — every chrome string (nav, headings, buttons, the
  cart), keyed and grouped so a missing translation is obvious. `t("key")`
  reads it; `{placeholders}` are filled by the second argument.
- **`src/lib/data.ts`** — product names, taglines, descriptions, category
  names and process steps, each a `{ en, ar, he }` object. `L(value)` reads
  the active one. Anything missing falls back to English.

The Arabic product names are exactly as the store lists them on take.app. The
English and Hebrew names, and all taglines, are our renderings — **have a
native speaker review the Hebrew before going live.**

On English pages a product's Arabic name is shown under the English one; in
Arabic and Hebrew that subtitle is dropped, since the title is already in the
reader's language.

**Shopping (mock):**

- Add any menu item, or a filled box, to the bag — the drawer does **not**
  pop open; it opens only when the customer taps the bag
- Quantity steppers, remove, and clear
- Delivery vs. pickup (delivery adds a fee)
- Loading / empty / success / error states throughout
- Cart persists across reloads via `localStorage` (key `cookies-and-more-cart-v2`);
  lines pointing at items no longer on the menu are dropped on load
- Checkout is simulated — **no payment is taken**

**Mobile:**

- Interactive controls are ≥44px on phones (`min-h-11`, or `h-11 w-11` shrinking
  to `sm:h-8`), matching the iOS touch-target guideline
- The navbar is **86px** tall, so sticky offsets and scroll anchors read
  `var(--nav-h)` (`5.5rem`, set in `globals.css`) rather than a hard-coded value
  that can drift out of sync with it
- The hero uses `min-h-dvh`, not `min-h-screen` — mobile Safari's collapsing URL
  bar makes `100vh` taller than the visible area and pushed the CTAs off-screen
- The box-builder list only becomes a scroll region from `lg` up. On a phone a
  fixed-height window holding a long list is a trap: a thumb swipe scrolls the
  inner list instead of the page
- Text inputs are 16px on phones (`text-base sm:text-sm`); anything smaller
  makes iOS zoom in when they take focus
- The cart drawer's footer clears the iOS home indicator via
  `env(safe-area-inset-bottom)`

**Animation & accessibility:**

- Lenis smooth scroll driven by the GSAP ticker; ScrollTrigger stays in sync
- All GSAP work runs inside `gsap.context()` and is reverted on unmount; event
  listeners are cleaned up
- Everything honors `prefers-reduced-motion` (animations disabled, layout intact)
- Transform/opacity-only animations for performance
- Semantic HTML, keyboard-navigable, visible focus rings, skip-to-content link,
  ARIA labels and live regions on interactive controls

## Notes & disclaimers

- Item names and prices come from the store's live order page. If the menu
  changes there, update `PRODUCTS` in `src/lib/data.ts` to match.
- **Orders are real and reach the bakery.** Checkout saves the order and pushes
  a notification to the admin phone. Payment is cash on delivery or at pickup;
  the site takes no money and stores no card or bank details.
- There are no discount codes. `WARM10`, `FRESH15` and `COOKIES20` were demo
  codes that really discounted the total, so they were removed along with the
  code input in the bag. Historical orders keep whatever discount they were
  placed with, which is why `Order.discountCode` and `discountAmount` still
  exist on the type and still render in the admin.
