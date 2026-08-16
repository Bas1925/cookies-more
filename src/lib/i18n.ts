import type { Lang, Localized } from "./types";

export const LANGUAGES: {
  id: Lang;
  /** Shown in the switcher, in the language's own script. */
  label: string;
  short: string;
  dir: "ltr" | "rtl";
}[] = [
  { id: "en", label: "English", short: "EN", dir: "ltr" },
  { id: "ar", label: "العربية", short: "ع", dir: "rtl" },
  { id: "he", label: "עברית", short: "עב", dir: "rtl" },
];

export const DEFAULT_LANG: Lang = "en";

export function isLang(value: unknown): value is Lang {
  return LANGUAGES.some((l) => l.id === value);
}

export function dirOf(lang: Lang): "ltr" | "rtl" {
  return LANGUAGES.find((l) => l.id === lang)?.dir ?? "ltr";
}

/**
 * Every string the chrome renders, grouped by key rather than by language so
 * a missing translation is obvious at a glance. Product names, taglines and
 * category copy live on the data itself in `data.ts`.
 */
export const UI = {
  // ── Navigation & cart button ────────────────────────────────────────
  "nav.menu": { en: "Menu", ar: "القائمة", he: "התפריט" },
  "nav.buildBox": { en: "Build a box", ar: "جهّز صندوقك", he: "בניית קופסה" },
  "nav.story": { en: "Our Story", ar: "قصتنا", he: "הסיפור שלנו" },
  "nav.home": {
    en: "Cookies & More home",
    ar: "الصفحة الرئيسية",
    he: "לדף הבית",
  },
  "nav.openMenu": { en: "Open menu", ar: "افتح القائمة", he: "פתיחת התפריט" },
  "nav.closeMenu": { en: "Close menu", ar: "أغلق القائمة", he: "סגירת התפריט" },
  "nav.language": { en: "Language", ar: "اللغة", he: "שפה" },
  "cart.bag": { en: "Bag", ar: "السلة", he: "הסל" },
  "cart.open": { en: "Open cart", ar: "افتح السلة", he: "פתיחת הסל" },

  // ── Hero ─────────────────────────────────────────────────────────────
  "hero.badge": {
    en: "Fresh today",
    ar: "طازج اليوم",
    he: "טרי היום",
  },
  "hero.title": {
    en: "Cookies & More",
    ar: "Cookies & More",
    he: "Cookies & More",
  },
  "hero.sub": {
    en: "Pick your cookies. Add to bag. Done.",
    ar: "اختر الكوكيز المفضلة لديك، وأضفها إلى السلة. هذا كل شيء.",
    he: "בוחרים עוגיות. מוסיפים לסל. וזהו.",
  },
  "hero.shop": { en: "Shop now", ar: "تسوّق الآن", he: "לקנייה עכשיו" },

  // ── Signature showcase ───────────────────────────────────────────────
  "showcase.eyebrow": { en: "Our flavors", ar: "نكهاتنا", he: "הטעמים שלנו" },
  "showcase.title": {
    en: "Seven ways to fall in love.",
    ar: "سبع طرق للوقوع في الحب.",
    he: "שבע דרכים להתאהב.",
  },
  "showcase.note": {
    en: "Our signature cookies — the full menu is below.",
    ar: "قطع الكوكيز المميزة لدينا — القائمة الكاملة بالأسفل.",
    he: "העוגיות המזוהות איתנו — התפריט המלא למטה.",
  },
  "showcase.scroll": {
    en: "Scroll to wander the lineup — tap a cookie to jump to Cookies in the menu.",
    ar: "مرّر لتتصفح التشكيلة — اضغط على أي كوكيز للانتقال إلى قسم الكوكيز في القائمة.",
    he: "גללו לאורך המבחר — לחצו על עוגייה כדי לעבור לקטגוריית העוגיות בתפריט.",
  },
  "showcase.shopCta": {
    en: "Shop this cookie",
    ar: "اطلب هذا الكوكيز",
    he: "להזמנת העוגייה",
  },
  "showcase.openInMenu": {
    en: "Open {name} in the Cookies menu",
    ar: "افتح {name} في قائمة الكوكيز",
    he: "פתיחת {name} בקטגוריית העוגיות",
  },

  // ── Menu ─────────────────────────────────────────────────────────────
  "menu.eyebrow": { en: "Shop", ar: "التسوق", he: "קנייה" },
  "menu.title": {
    en: "Menu",
    ar: "القائمة",
    he: "התפריט",
  },
  "menu.intro": {
    en: "{items} items — tap a category and add to your bag.",
    ar: "{items} صنفًا — اختر فئة وأضف ما تريد إلى سلتك.",
    he: "{items} פריטים — בחרו קטגוריה והוסיפו לסל.",
  },
  "menu.categories": {
    en: "Menu categories",
    ar: "فئات القائمة",
    he: "קטגוריות התפריט",
  },
  "menu.showing": {
    en: "Showing {count} items in {category}",
    ar: "عرض {count} صنفًا في {category}",
    he: "מוצגים {count} פריטים ב{category}",
  },

  // ── Product card ─────────────────────────────────────────────────────
  "product.add": { en: "Add to bag", ar: "أضف إلى السلة", he: "הוספה לסל" },
  /**
   * Compact label for the 3-up mobile grid: cards are ~106px there, and the
   * full Arabic label needs 70px in a 59px slot, so it was being clipped.
   */
  "product.addShort": { en: "Add", ar: "أضف", he: "הוסף" },
  "product.added": { en: "Added!", ar: "أُضيف!", he: "נוסף!" },
  "product.addNamed": {
    en: "Add {name} to bag",
    ar: "أضف {name} إلى السلة",
    he: "הוספת {name} לסל",
  },
  "readyBox.choose": {
    en: "Choose items",
    ar: "اختر الأصناف",
    he: "בחירת פריטים",
  },
  "readyBox.chooseShort": { en: "Choose", ar: "اختر", he: "בחרו" },
  "readyBox.chooseNamed": {
    en: "Choose items for {name}",
    ar: "اختر أصناف {name}",
    he: "בחירת פריטים ל{name}",
  },
  "readyBox.picksHint": {
    en: "Pick {count} items",
    ar: "اختر {count} أصناف",
    he: "בחרו {count} פריטים",
  },
  "readyBox.cardRule": {
    en: "{name} {count}",
    ar: "{name} {count}",
    he: "{name} {count}",
  },
  "readyBox.title": {
    en: "What's inside?",
    ar: "ماذا تريد في الصندوق؟",
    he: "מה שמים בפנים?",
  },
  "readyBox.sub": {
    en: "Fill the {name} with {count} items. Limits below are what this shop allows.",
    ar: "املأ {name} بـ {count} أصناف. الحدود أدناه هي ما يسمح به المتجر.",
    he: "מלאו את {name} ב-{count} פריטים. המגבלות למטה הן מה שהחנות מאפשרת.",
  },
  "readyBox.rules": {
    en: "What you can add",
    ar: "ما يمكنك إضافته",
    he: "מה אפשר להוסיף",
  },
  "readyBox.picked": {
    en: "{count} of {capacity} selected",
    ar: "{count} من {capacity} مختارة",
    he: "{count} מתוך {capacity} נבחרו",
  },
  "readyBox.need": {
    en: "Add {count} more",
    ar: "أضف {count} أخرى",
    he: "הוסיפו עוד {count}",
  },
  "readyBox.full": {
    en: "Box is full — remove one to swap",
    ar: "الصندوق ممتלئ — أزل صنفاً للتبديل",
    he: "הקופסה מלאה — הסירו פריט כדי להחליף",
  },
  "readyBox.maxOf": {
    en: "Up to {count} from {name}",
    ar: "حتى {count} من {name}",
    he: "עד {count} מ{name}",
  },
  "readyBox.categoryFull": {
    en: "That's all you can pick from {name}",
    ar: "هذا كل ما يمكن اختياره من {name}",
    he: "זה כל מה שאפשר לבחור מ{name}",
  },
  "readyBox.close": { en: "Close", ar: "إغلاق", he: "סגירה" },
  "readyBox.include": {
    en: "Include {name}",
    ar: "أضف {name}",
    he: "הוספת {name}",
  },

  // ── Build a box ──────────────────────────────────────────────────────
  "box.eyebrow": { en: "Build a box", ar: "جهّز صندوقك", he: "בניית קופסה" },
  "box.title": {
    en: "Fill a box your way.",
    ar: "املأ صندوقك كما تحب.",
    he: "ממלאים קופסה בדרך שלכם.",
  },
  "box.sub": {
    en: "Pick a size and fill it with your favorite cookies.",
    ar: "اختر حجم الصندوق واملأه بالكوكيز المفضلة لديك.",
    he: "בחרו גודל ומלאו אותו בעוגיות האהובות עליכם.",
  },
  "box.size": { en: "Box size", ar: "حجم الصندوق", he: "גודל הקופסה" },
  "box.slots": {
    en: "{count} cookies",
    ar: "{count} كوكيز",
    he: "{count} עוגיות",
  },
  "box.empty": {
    en: "Empty — pick your favorites",
    ar: "فارغ — اختر مفضلاتك",
    he: "ריקה — בחרו את המועדפים",
  },
  "box.filled": {
    en: "{count} of {capacity} cookies",
    ar: "{count} من {capacity} كوكيز",
    he: "{count} מתוך {capacity} עוגיות",
  },
  "box.reset": { en: "Reset", ar: "تفريغ الصندوق", he: "איפוס" },
  "box.choose": {
    en: "Choose your cookies",
    ar: "اختر الكوكيز",
    he: "בחרו עוגיות",
  },
  "box.premium": {
    en: "Box +{amount}",
    ar: "إضافة {amount} للسعر",
    he: "בקופסה +{amount}",
  },
  "box.extrasNote": {
    en: "Premium cookie extras: {amount}",
    ar: "إضافات الكوكيز المميزة: {amount}",
    he: "תוספות לעוגיות פרימיום: {amount}",
  },
  "box.add": {
    en: "Add box to bag",
    ar: "أضف الصندوق إلى السلة",
    he: "הוספת הקופסה לסל",
  },
  "box.needFull": {
    en: "Add {count} more to fill the box",
    ar: "أضف {count} أخرى لملء الصندوق",
    he: "הוסיפו עוד {count} כדי למלא את הקופסה",
  },
  "box.needOne": {
    en: "Pick at least one item",
    ar: "اختر صنفاً واحداً على الأقل",
    he: "בחרו לפחות פריט אחד",
  },
  "box.added": {
    en: "Added to bag!",
    ar: "أُضيف إلى السلة!",
    he: "נוסף לסל!",
  },
  "box.addOne": {
    en: "Add one {name}",
    ar: "أضف واحدة من {name}",
    he: "הוספת {name} אחד",
  },
  "box.removeOne": {
    en: "Remove one {name}",
    ar: "أزل واحدة من {name}",
    he: "הסרת {name} אחד",
  },

  // ── Brand story ──────────────────────────────────────────────────────
  "story.eyebrow": { en: "Our story", ar: "قصتنا", he: "הסיפור שלנו" },
  "story.title": {
    en: "Handmade in small batches, baked fresh every single day.",
    ar: "صناعة يدوية بكميات صغيرة، تُخبز طازجة كل يوم.",
    he: "בעבודת יד במנות קטנות, נאפה טרי מדי יום.",
  },
  "story.p1": {
    en: "Cookies & More started in a tiny home kitchen with one stubborn belief: a cookie should be an event. We brown our butter, rest our dough overnight, and bake in small trays so every cookie comes out with crisp edges and a molten, cloud-soft middle.",
    ar: "بدأت Cookies & More في مطبخ منزلي صغير بفكرة واحدة: يجب أن تكون كل قطعة كوكيز تجربة مميزة. نحمّر الزبدة، ونترك العجينة لترتاح ليلة كاملة، ونخبز بكميات صغيرة لنحصل على حواف مقرمشة وقلب طري وذائب.",
    he: "‏Cookies & More התחילה במטבח ביתי קטן עם אמונה עיקשת אחת: עוגייה צריכה להיות אירוע. אנחנו משחימים את החמאה, מניחים לבצק לנוח לילה שלם, ואופים במגשים קטנים כדי שכל עוגייה תצא עם שוליים פריכים ומרכז רך ונמס.",
  },
  "story.p2": {
    en: "Nothing sits on a shelf. We bake to order from early morning, using real chocolate, proper vanilla, and zero shortcuts — so the cookie in your hand is the cookie we'd want in ours.",
    ar: "لا شيء يبقى على الرف. نخبز حسب الطلب منذ الصباح الباكر، باستخدام شوكولاتة حقيقية وفانيلا أصلية ومن دون اختصارات — لتصلك كل قطعة كما نحب أن نتناولها نحن.",
    he: "שום דבר לא יושב על המדף. אנחנו אופים בהזמנה מהבוקר המוקדם, עם שוקולד אמיתי, וניל אמיתי ובלי קיצורי דרך — כך שהעוגייה שבידכם היא זו שהיינו רוצים בשלנו.",
  },
  "story.stat1": {
    en: "Items on the menu",
    ar: "صنفًا في القائمة",
    he: "פריטים בתפריט",
  },
  "story.stat2": {
    en: "Doors open, every day",
    ar: "نفتح أبوابنا كل يوم",
    he: "נפתחים, כל יום",
  },
  "story.stat3": {
    en: "Handmade, small-batch daily",
    ar: "صناعة يدوية بكميات صغيرة يومياً",
    he: "בעבודת יד, במנות קטנות מדי יום",
  },

  // ── Process ──────────────────────────────────────────────────────────
  "process.eyebrow": {
    en: "How it's made",
    ar: "كيف نصنعها",
    he: "איך זה נעשה",
  },
  "process.title": {
    en: "From mixing bowl to your door.",
    ar: "من وعاء الخلط إلى باب بيتك.",
    he: "מקערת הערבוב עד הדלת שלכם.",
  },
  "process.step": { en: "Step {n}", ar: "الخطوة {n}", he: "שלב {n}" },

  // ── Instagram ────────────────────────────────────────────────────────
  "ig.eyebrow": { en: "Follow us", ar: "تابعونا", he: "עקבו אחרינו" },
  "ig.title": {
    en: "Straight from the oven.",
    ar: "مباشرة من الفرن.",
    he: "היישר מהתנור.",
  },
  "ig.sub": {
    en: "See what’s baking on Instagram.",
    ar: "شاهد ما نخبزه على إنستغرام.",
    he: "ראו מה נאפה באינסטגרם.",
  },
  "ig.openProfile": {
    en: "{name} — open our Instagram",
    ar: "{name} — افتح إنستغرام",
    he: "{name} — לאינסטגרם שלנו",
  },

  // ── Footer ───────────────────────────────────────────────────────────
  "footer.blurb": {
    en: "Cookies, cakes and cinnamon rolls — delivery or pickup.",
    ar: "كوكيز وكعك وسينابون — توصيل أو استلام.",
    he: "עוגיות, עוגות וסינבון — משלוח או איסוף.",
  },
  "footer.explore": { en: "Explore", ar: "تصفّح", he: "ניווט" },
  "footer.follow": { en: "Follow us", ar: "تابعونا", he: "עקבו אחרינו" },
  "footer.privacy": {
    en: "Privacy Policy",
    ar: "سياسة الخصوصية",
    he: "מדיניות פרטיות",
  },
  "footer.rights": {
    en: "Cookies & More — fresh cookies, cakes and cinnamon rolls.",
    ar: "Cookies & More — كوكيز وكعك وسينابون طازجة.",
    he: "‏Cookies & More — עוגיות, עוגות וסינבון טריים.",
  },

  // ── Cart drawer ──────────────────────────────────────────────────────
  "bag.title": { en: "Your bag", ar: "سلتك", he: "הסל שלך" },
  "bag.close": { en: "Close bag", ar: "أغلق السلة", he: "סגירת הסל" },
  "bag.emptyTitle": {
    en: "Your bag is empty",
    ar: "سلتك فارغة",
    he: "הסל שלך ריק",
  },
  "bag.emptyText": {
    en: "Still warm from the oven and waiting for you. Add a few cookies to get started.",
    ar: "ما زالت دافئة من الفرن وتنتظرك. أضف بعض الكوكيز للبدء.",
    he: "עדיין חמות מהתנור ומחכות לך. הוסיפו כמה עוגיות כדי להתחיל.",
  },
  "bag.browse": {
    en: "Browse the menu",
    ar: "تصفّح القائمة",
    he: "לעיון בתפריט",
  },
  "bag.fulfillment": {
    en: "How would you like it?",
    ar: "كيف تريد استلامها؟",
    he: "איך תרצו לקבל?",
  },
  "bag.delivery": { en: "Delivery", ar: "توصيل", he: "משלוח" },
  "bag.pickup": { en: "Pickup", ar: "استلام", he: "איסוף" },
  "bag.customerDetails": {
    en: "Your details",
    ar: "بياناتك",
    he: "הפרטים שלך",
  },
  "bag.customerName": { en: "Name", ar: "الاسم", he: "שם" },
  "bag.customerNamePlaceholder": {
    en: "Your full name",
    ar: "الاسم الكامل",
    he: "השם המלא",
  },
  "bag.phone": { en: "Phone number", ar: "رقم الهاتف", he: "מספר טלפון" },
  "bag.phonePlaceholder": {
    en: "10 digits",
    ar: "10 أرقام",
    he: "10 ספרות",
  },
  "bag.nameRequired": {
    en: "Enter your name.",
    ar: "أدخل اسمك.",
    he: "הזינו את שמכם.",
  },
  "bag.phoneInvalid": {
    en: "Enter a 10-digit phone number.",
    ar: "أدخل رقم هاتف مكوّنًا من 10 أرقام.",
    he: "הזינו מספר טלפון בן 10 ספרות.",
  },
  "bag.subtotal": { en: "Subtotal", ar: "المجموع الفرعي", he: "סכום ביניים" },
  "bag.total": { en: "Total", ar: "الإجمالي", he: "סה״כ" },
  "bag.free": { en: "Free", ar: "مجاناً", he: "חינם" },
  "bag.checkout": { en: "Checkout", ar: "إتمام الطلب", he: "לתשלום" },
  "bag.processing": { en: "Processing…", ar: "جارٍ المعالجة…", he: "מעבד…" },
  "bag.paymentNote": {
    en: "Pay in cash on delivery or at pickup.",
    ar: "الدفع نقدًا عند التوصيل أو الاستلام.",
    he: "התשלום במזומן במשלוח או באיסוף.",
  },
  "bag.error": {
    en: "Something went wrong. Please try again.",
    ar: "حدث خطأ ما. حاول مرة أخرى.",
    he: "משהו השתבש. נסו שוב.",
  },
  "bag.successTitle": { en: "Order placed!", ar: "تم الطلب!", he: "ההזמנה בוצעה!" },
  "bag.successText": {
    en: "We’ve got your order. We’ll call you shortly on the number you gave to confirm the details. Pay in cash on delivery or at pickup.",
    ar: "استلمنا طلبك. سنتصل بك قريبًا على الرقم الذي أدخلته لتأكيد التفاصيل. الدفع نقدًا عند التوصيل أو الاستلام.",
    he: "קיבלנו את ההזמנה שלכם. נתקשר אליכם בקרוב למספר שהשארתם כדי לאשר את הפרטים. התשלום במזומן במשלוח או באיסוף.",
  },
  "bag.keepBrowsing": {
    en: "Keep browsing",
    ar: "تابع التصفح",
    he: "המשך עיון",
  },
  "bag.emptyBox": { en: "Empty box", ar: "صندوق فارغ", he: "קופסה ריקה" },
  "bag.removeNamed": {
    en: "Remove {name}",
    ar: "أزل {name}",
    he: "הסרת {name}",
  },
  "bag.increase": {
    en: "Increase {name} quantity",
    ar: "زد كمية {name}",
    he: "הגדלת הכמות של {name}",
  },
  "bag.decrease": {
    en: "Decrease {name} quantity",
    ar: "قلّل كمية {name}",
    he: "הקטנת הכמות של {name}",
  },
} satisfies Record<string, Localized>;

export type UIKey = keyof typeof UI;

/** Looks up a key, fills `{placeholders}`, and falls back to English. */
export function translate(
  key: UIKey,
  lang: Lang,
  vars?: Record<string, string | number>,
): string {
  const entry = UI[key] as Localized;
  let out = entry[lang] || entry.en;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${name}}`, String(value));
    }
  }
  return out;
}
