import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";

export async function POST(req: NextRequest) {
  let locale = "en";
  try {
    const body = await req.json();
    if (isLocale(body?.locale)) locale = body.locale;
  } catch {
    // ignore malformed body
  }
  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
