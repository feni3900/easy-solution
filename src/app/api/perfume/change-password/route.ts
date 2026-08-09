import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sha256Hex, safeEqual } from "@/lib/perfume";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { current?: string; next?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const current = body.current ?? "";
  const next = body.next ?? "";
  if (!current || !next || next.length < 4) {
    return NextResponse.json({ error: "Current password and a new password (min 4 chars) are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfume_settings")
    .select("value")
    .eq("key", "section_password_hash")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Perfume section not configured." }, { status: 500 });
  }

  if (!safeEqual(sha256Hex(current), data.value)) {
    return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
  }

  const { error: updErr } = await supabase
    .from("perfume_settings")
    .update({ value: sha256Hex(next), updated_at: new Date().toISOString() })
    .eq("key", "section_password_hash");

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}