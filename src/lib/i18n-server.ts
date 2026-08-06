import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale, isLocale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : "en";
}
