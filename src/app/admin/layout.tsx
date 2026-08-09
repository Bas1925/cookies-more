import type { ReactNode } from "react";
import { AdminLanguageProvider } from "@/lib/admin-language-context";
import { getAdminLang } from "@/lib/admin-language";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const lang = await getAdminLang();
  return (
    <AdminLanguageProvider initialLang={lang}>
      {children}
    </AdminLanguageProvider>
  );
}
