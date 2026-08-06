import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const skipRecord = formData.get("skip_record") === "true";
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${randomUUID()}.${ext}`;

    const { error: upError } = await supabaseAdmin.storage
      .from("gallery")
      .upload(path, file, { contentType: file.type || "image/png", upsert: false });
    if (upError) return NextResponse.json({ error: upError.message }, { status: 500 });

    const { data: urlData } = supabaseAdmin.storage.from("gallery").getPublicUrl(path);
    const url = urlData.publicUrl;

    if (skipRecord) {
      return NextResponse.json({ success: true, data: { url } });
    }

    const { data: record, error: dbError } = await supabaseAdmin
      .from("gallery")
      .insert({
        filename: file.name,
        url: url,
        size: file.size,
        mime_type: file.type || "image/png",
        alt_text: file.name.replace(/\.[^/.]+$/, ""),
        folder: "uploads",
      })
      .select()
      .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
