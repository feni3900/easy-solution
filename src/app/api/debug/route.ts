import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    const { data: profiles, error: profileError } = await supabase
      .from("users")
      .select("*");

    return NextResponse.json({
      authUsers: authUsers?.users?.map((u) => ({ id: u.id, email: u.email })) ?? [],
      authError: authError?.message ?? null,
      profiles: profiles ?? [],
      profileError: profileError?.message ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
