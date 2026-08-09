import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PERFUME_COOKIE, sha256Hex, safeEqual } from "@/lib/perfume";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const password = body.password?.trim() ?? "";
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfume_settings")
    .select("value")
    .eq("key", "section_password_hash")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Perfume section is not configured yet. Run migration 0042_perfume.sql first." },
      { status: 500 }
    );
  }

  const storedHash = data.value;
  const inputHash = sha256Hex(password);

  if (!safeEqual(inputHash, storedHash)) {
    return NextResponse.json({ error: "Incorrect perfume password" }, { status: 401 });
  }

  // Cookie value is the hash of the stored hash: verifiable again on next request
  // in middleware without another DB read, and not forgeable via a plain cookie.
  const cookieValue = sha256Hex(storedHash + PERFUME_COOKIE);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PERFUME_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}