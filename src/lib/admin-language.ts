import "server-only";

import { cookies } from "next/headers";
import {
  ADMIN_LANG_COOKIE,
  adminTranslate,
  isAdminLang,
  type AdminKey,
  type AdminLang,
} from "./admin-i18n";

export async function getAdminLang(): Promise<AdminLang> {
  const value = (await cookies()).get(ADMIN_LANG_COOKIE)?.value;
  return isAdminLang(value) ? value : "en";
}

export async function getAdminTranslator() {
  const lang = await getAdminLang();
  return {
    lang,
    t: (key: AdminKey, vars?: Record<string, string | number>) =>
      adminTranslate(key, lang, vars),
  };
}
