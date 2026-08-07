import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isGuest } from "@/lib/auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    if (await isGuest()) {
      return NextResponse.json({ error: "Guest account is read-only" }, { status: 403 });
    }
    const { product_id, image_url } = await request.json();
    if (!product_id) return NextResponse.json({ error: "product_id required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("products")
      .update({ image_url: image_url || null })
      .eq("product_id", product_id)
      .select("product_id, image_url")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
