import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AdminLanguageProvider } from "@/lib/admin-language-context";
import { getAdminLang } from "@/lib/admin-language";

export const metadata: Metadata = {
  title: "Admin",
  // Overrides the shop manifest so a Home Screen icon added from here opens
  // /admin rather than the storefront.
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Cookies Admin",
    statusBarStyle: "default",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#964534",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const lang = await getAdminLang();
  return (
    <AdminLanguageProvider initialLang={lang}>
      {children}
    </AdminLanguageProvider>
  );
}
