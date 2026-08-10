import type { Lang, Localized, ProcessStep } from "./types";
import {
  boxCapacity,
  boxExtrasTotal,
  boxLinePrice,
  getBoxes,
  getBoxFillings,
  getCatalogSnapshot,
  getCategories,
  getCategory,
  getProduct,
  getProducts,
  productsInCategory,
  shopProducts,
} from "./catalog-store";

export type { Category, CategoryId, Product, Catalog } from "./types";

/** Reads the active language out of a localized string, falling back to English. */
export function pick(value: Localized | undefined, lang: Lang): string {
  if (!value) return "";
  return value[lang] || value.en;
}

/** Live categories (hidden ones filtered out). Prefer useCatalog() in React. */
export function listCategories() {
  return getCategories();
}

/** @deprecated Prefer listCategories() / useCatalog() — kept for gradual migration. */
export const CATEGORIES = getCategories();

/** @deprecated Prefer getProducts() / useCatalog() */
export const PRODUCTS = getProducts({ includeHidden: true });

/** @deprecated Prefer getBoxes() / useCatalog() */
export const BOXES = getBoxes();

/** @deprecated Prefer getBoxFillings() / useCatalog() */
export const BOX_FILLINGS = getBoxFillings();

export {
  getCatalogSnapshot,
  getCategories,
  getCategory,
  getProduct,
  getProducts,
  shopProducts,
  productsInCategory,
  getBoxes,
  getBoxFillings,
  boxCapacity,
  boxExtrasTotal,
  boxLinePrice,
};

const SHOWCASE_IDS = [
  "cookie-dubai",
  "cookie-kinder",
  "cookie-chocolate",
  "cookie-red-velvet",
  "cookie-pretzel",
  "cookie-coffee",
  "cookie-amsterdam",
];

export function getShowcaseProducts() {
  return SHOWCASE_IDS.map((id) => {
    const product = getProduct(id);
    if (!product) throw new Error(`Showcase references unknown product: ${id}`);
    return product;
  }).filter((p) => !p.hidden);
}

/** @deprecated Prefer getShowcaseProducts() */
export const SHOWCASE_PRODUCTS = getShowcaseProducts();

const INSTAGRAM_IDS = [
  "cake-bento",
  "cookie-dubai",
  "cinnabon-8",
  "cake-red-velvet",
];

export function getInstagramGallery() {
  return INSTAGRAM_IDS.map((id) => getProduct(id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p) && !p!.hidden,
  );
}

/** @deprecated Prefer getInstagramGallery() */
export const INSTAGRAM_GALLERY = getInstagramGallery();

export const HERO_PRODUCT_ID = "cookie-amsterdam";
export const FEATURE_IMAGE = "/menu/cookie-kinder.jpeg";
export const INSET_IMAGE = "/menu/cookie-chocolate.jpeg";
export const LOGO_IMAGE = "/flavors/cookies_logo.jpeg";

export const CURRENCY = "₪";

/** Prices are whole shekels on the menu, so only show decimals when needed. */
export function formatPrice(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const body = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `${CURRENCY}${body}`;
}

/** TODO: confirm the real delivery fee with the store. */
export const DELIVERY_FEE = 15;

export const STORE = {
  name: "Cookies & More",
  handle: "coo_kies.and.more",
  area: { en: "Israel", ar: "إسرائيل", he: "ישראל" } as Localized,
  hours: {
    en: "09:00 – 22:00, daily",
    ar: "٩:٠٠ – ٢٢:٠٠ يومياً",
    he: "09:00 – 22:00, כל יום",
  } as Localized,
  orderUrl: "https://take.app/cookiesandmore",
  instagramUrl: "https://www.instagram.com/coo_kies.and.more",
};

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: "mix",
    title: { en: "Mix", ar: "الخلط", he: "ערבוב" },
    text: {
      en: "We brown real butter and fold in premium chocolate. Every batch is mixed by hand in small quantities.",
      ar: "نحمّر الزبدة الحقيقية ونضيف شوكولاته فاخرة. كل دفعة تُخلط يدوياً بكميات صغيرة.",
      he: "משחימים חמאה אמיתית ומקפלים פנימה שוקולד משובח. כל מנה נערבבת ביד בכמויות קטנות.",
    },
  },
  {
    id: "shape",
    title: { en: "Shape", ar: "التشكיל", he: "עיצוב" },
    text: {
      en: "Dough is scooped generously and rested overnight so the flavors deepen before it ever hits the oven.",
      ar: "تُغرف العجينة بسخاء وتُترك ليلة كاملة لتتعمق النكهات قبل الخبز.",
      he: "הבצק נלקח בנדיבות ונח לילה שלם כדי שהטעמים יעמיקו לפני האפייה.",
    },
  },
  {
    id: "bake",
    title: { en: "Bake", ar: "الخبز", he: "אפייה" },
    text: {
      en: "Baked to order in small trays for crisp edges and a molten, cloud-soft middle every single time.",
      ar: "تُخبز حسب الطلب بصواني صغيرة لحواف مقرمشة ومنتصف طري وذائب في كل مرة.",
      he: "נאפה בהזמנה במגשים קטנים לשוליים פריכים ומרכז רך ונמס בכל פעם.",
    },
  },
  {
    id: "pack",
    title: { en: "Pack", ar: "التغليف", he: "אריזה" },
    text: {
      en: "Cookies are boxed while still warm in recyclable packaging designed to keep them gooey en route.",
      ar: "تُعبّأ الكوكيز وهي دافئة في تغليف قابل لإعادة التدوير يحافظ على طراوتها.",
      he: "העוגיות נארזות בעודן חמות באריזה מתכלה ששומרת עליהן רכות בדרך.",
    },
  },
  {
    id: "deliver",
    title: { en: "Deliver", ar: "التوصيل", he: "משלוח" },
    text: {
      en: "Hand-delivered across the city or ready for pickup, so the first bite is always fresh from the oven.",
      ar: "توصيل يدوي في أنحاء المدينة أو جاهزة للاستلام، لتكون القضمة الأولى طازجة دائماً.",
      he: "משלוח אישי ברחבי העיר או איסוף עצמי, כך שהביס הראשון תמיד טרי מהתנור.",
    },
  },
];

export const NAV_LINKS: { key: "menu" | "buildBox"; href: string }[] = [
  { key: "menu", href: "#shop-cookies" },
  { key: "buildBox", href: "#build" },
];
