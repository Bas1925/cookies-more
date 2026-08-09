"use client";

import Link from "next/link";
import { ArrowLeft, Camera, ShieldCheck } from "lucide-react";
import { STORE } from "@/lib/data";
import { useLanguage } from "@/lib/language-context";
import type { Lang } from "@/lib/types";

type PrivacyCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  back: string;
  contact: string;
  sections: Array<{
    title: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
};

const COPY: Record<Lang, PrivacyCopy> = {
  en: {
    eyebrow: "Your privacy",
    title: "Privacy Policy",
    intro:
      "This policy explains what Cookies & More collects when you use this website, why we use it, and how you can ask us to update or delete it.",
    updated: "Last updated: 9 August 2026",
    back: "Back to the shop",
    contact: "Contact us on Instagram",
    sections: [
      {
        title: "Information we collect",
        paragraphs: ["When you place an order, we collect the information needed to prepare and manage it:"],
        bullets: [
          "Your name and 10-digit phone number.",
          "The products, quantities, box contents, discount code, and delivery or pickup choice in your order.",
          "The time of the order and its progress status, such as New, Preparing, Ready, or Completed.",
          "Your cart and language preference, which are saved in your browser so the site remembers them.",
        ],
      },
      {
        title: "How we use your information",
        paragraphs: [
          "We use your details only to receive, prepare, update, and complete your order; contact you about it when necessary; and operate and protect the website.",
        ],
      },
      {
        title: "Payments",
        paragraphs: [
          "Checkout on this website is currently a demonstration. No real payment is taken and we do not collect or store card or bank details.",
        ],
      },
      {
        title: "Storage and deletion",
        paragraphs: [
          "Order details remain in the store’s order system until an administrator deletes them. You may ask us to correct or delete your order information by contacting us on Instagram and identifying the order.",
        ],
      },
      {
        title: "Sharing",
        paragraphs: [
          "We do not sell your personal information. We only share it when needed with providers that help us host or operate the service, to complete delivery when applicable, or when required by law.",
        ],
      },
      {
        title: "Cookies and local storage",
        paragraphs: [
          "The customer shop does not currently use advertising or analytics cookies. It uses necessary browser storage for your cart and language choice. The private admin area uses a necessary sign-in cookie.",
        ],
      },
      {
        title: "Contact and changes",
        paragraphs: [
          "For privacy questions or requests, contact Cookies & More through the Instagram profile linked below. We may update this policy when the website or our practices change, and the updated date will appear at the top.",
        ],
      },
    ],
  },
  ar: {
    eyebrow: "خصوصيتك",
    title: "سياسة الخصوصية",
    intro:
      "توضح هذه السياسة المعلومات التي يجمعها موقع Cookies & More عند استخدامه، وسبب استخدامها، وكيف يمكنك طلب تعديلها أو حذفها.",
    updated: "آخر تحديث: 9 أغسطس 2026",
    back: "العودة إلى المتجر",
    contact: "تواصل معنا عبر إنستغرام",
    sections: [
      {
        title: "المعلومات التي نجمعها",
        paragraphs: ["عند إرسال طلب، نجمع المعلومات اللازمة لتجهيزه وإدارته:"],
        bullets: [
          "اسمك ورقم هاتفك المكوّن من 10 أرقام.",
          "المنتجات والكميات ومحتويات الصندوق ورمز الخصم وخيار التوصيل أو الاستلام.",
          "وقت إنشاء الطلب وحالته، مثل: جديد، قيد التحضير، جاهز، أو مكتمل.",
          "محتويات السلة واللغة المختارة، وتُحفظان في متصفحك لكي يتذكرهما الموقع.",
        ],
      },
      {
        title: "كيف نستخدم معلوماتك",
        paragraphs: [
          "نستخدم بياناتك فقط لاستلام طلبك وتجهيزه وتحديثه وإكماله، وللتواصل معك بخصوصه عند الحاجة، ولتشغيل الموقع وحمايته.",
        ],
      },
      {
        title: "الدفع",
        paragraphs: [
          "إتمام الطلب في هذا الموقع تجريبي حاليًا. لا يتم تحصيل أي دفعة حقيقية، ولا نجمع أو نخزن بيانات البطاقات أو الحسابات البنكية.",
        ],
      },
      {
        title: "حفظ البيانات وحذفها",
        paragraphs: [
          "تبقى بيانات الطلب في نظام إدارة الطلبات إلى أن يحذفها المسؤول. يمكنك طلب تصحيح بيانات طلبك أو حذفها بالتواصل معنا عبر إنستغرام مع تحديد الطلب.",
        ],
      },
      {
        title: "مشاركة المعلومات",
        paragraphs: [
          "لا نبيع معلوماتك الشخصية. لا نشاركها إلا عند الحاجة مع الجهات التي تساعدنا في استضافة الخدمة أو تشغيلها، أو لإتمام التوصيل عند الحاجة، أو إذا كان القانون يطلب ذلك.",
        ],
      },
      {
        title: "ملفات الارتباط والتخزين المحلي",
        paragraphs: [
          "لا يستخدم متجر العملاء حاليًا ملفات ارتباط إعلانية أو أدوات تحليل. ويستخدم التخزين الضروري في المتصفح لحفظ السلة واللغة. كما تستخدم منطقة الإدارة الخاصة ملف ارتباط ضروريًا لتسجيل الدخول.",
        ],
      },
      {
        title: "التواصل وتحديث السياسة",
        paragraphs: [
          "لأي سؤال أو طلب متعلق بالخصوصية، تواصل مع Cookies & More عبر حساب إنستغرام أدناه. قد نحدّث هذه السياسة عند تغيير الموقع أو طريقة العمل، وسيظهر تاريخ التحديث في أعلى الصفحة.",
        ],
      },
    ],
  },
  he: {
    eyebrow: "הפרטיות שלכם",
    title: "מדיניות פרטיות",
    intro:
      "מדיניות זו מסבירה איזה מידע Cookies & More אוספת בעת השימוש באתר, מדוע אנו משתמשים בו וכיצד ניתן לבקש לעדכן או למחוק אותו.",
    updated: "עדכון אחרון: 9 באוגוסט 2026",
    back: "חזרה לחנות",
    contact: "צרו קשר באינסטגרם",
    sections: [
      {
        title: "המידע שאנו אוספים",
        paragraphs: ["בעת שליחת הזמנה אנו אוספים את המידע הדרוש להכנתה ולניהולה:"],
        bullets: [
          "שם ומספר טלפון בן 10 ספרות.",
          "המוצרים, הכמויות, תכולת הקופסה, קוד ההנחה ובחירה במשלוח או איסוף.",
          "מועד ההזמנה והסטטוס שלה, כגון חדשה, בהכנה, מוכנה או הושלמה.",
          "העגלה ובחירת השפה נשמרות בדפדפן כדי שהאתר יזכור אותן.",
        ],
      },
      {
        title: "כיצד אנו משתמשים במידע",
        paragraphs: [
          "אנו משתמשים בפרטים רק כדי לקבל, להכין, לעדכן ולהשלים את ההזמנה, ליצור קשר בנוגע אליה בעת הצורך, ולהפעיל ולהגן על האתר.",
        ],
      },
      {
        title: "תשלומים",
        paragraphs: [
          "התשלום באתר הוא כרגע להדגמה בלבד. לא נגבה תשלום אמיתי ואיננו אוספים או שומרים פרטי כרטיס או חשבון בנק.",
        ],
      },
      {
        title: "שמירה ומחיקה",
        paragraphs: [
          "פרטי ההזמנה נשמרים במערכת ניהול ההזמנות עד שמנהל מוחק אותם. אפשר לבקש לתקן או למחוק מידע על הזמנה באמצעות פנייה באינסטגרם וציון ההזמנה.",
        ],
      },
      {
        title: "שיתוף מידע",
        paragraphs: [
          "איננו מוכרים מידע אישי. אנו משתפים אותו רק עם ספקים הנחוצים לאירוח או להפעלת השירות, לצורך משלוח כאשר רלוונטי, או כאשר החוק מחייב זאת.",
        ],
      },
      {
        title: "עוגיות ואחסון מקומי",
        paragraphs: [
          "חנות הלקוחות אינה משתמשת כרגע בעוגיות פרסום או ניתוח. נעשה שימוש באחסון הכרחי בדפדפן עבור העגלה והשפה. אזור הניהול הפרטי משתמש בעוגיית התחברות הכרחית.",
        ],
      },
      {
        title: "יצירת קשר ועדכונים",
        paragraphs: [
          "לשאלות או בקשות בנושא פרטיות, פנו אל Cookies & More דרך פרופיל האינסטגרם שלמטה. אנו עשויים לעדכן את המדיניות כאשר האתר או אופן העבודה משתנים, ותאריך העדכון יופיע בראש העמוד.",
        ],
      },
    ],
  },
};

export default function PrivacyPolicy() {
  const { lang } = useLanguage();
  const copy = COPY[lang];

  return (
    <section className="min-h-screen bg-cream px-5 pb-20 pt-32 text-chocolate md:px-8 md:pt-36">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/#shop-cookies"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-chocolate shadow-sm ring-1 ring-chocolate/10 transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {copy.back}
        </Link>

        <header className="mt-8 rounded-[2rem] bg-brick px-6 py-10 text-cream shadow-xl shadow-chocolate/10 md:px-10 md:py-12">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-cream/65">
            <ShieldCheck className="h-5 w-5 text-caramel" />
            {copy.eyebrow}
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold md:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-cream/75 md:text-lg">
            {copy.intro}
          </p>
          <p className="mt-5 text-sm text-cream/50">{copy.updated}</p>
        </header>

        <div className="mt-8 space-y-5">
          {copy.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl bg-white/75 p-6 ring-1 ring-chocolate/10 md:p-8"
            >
              <h2 className="font-display text-2xl font-semibold text-chocolate">
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 leading-7 text-chocolate/70">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 space-y-3 text-chocolate/70">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-3 leading-7">
                      <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-caramel" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        <a
          href={STORE.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-caramel px-6 py-3 font-semibold text-cream shadow-lg shadow-caramel/20 transition-transform hover:-translate-y-0.5"
        >
          <Camera className="h-5 w-5" />
          {copy.contact}
        </a>
      </div>
    </section>
  );
}
