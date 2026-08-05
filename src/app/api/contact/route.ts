import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const full_name = formData.get("full_name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string | null;
    const message = formData.get("message") as string;

    if (!full_name || !phone || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("contact_submissions").insert({
      full_name,
      phone,
      email: email || null,
      message,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Inquiry submitted successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
