import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user: actor },
  } = await supabase.auth.getUser();

  if (!actor) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { first_name, last_name, email, password, mobile, role_id, branch_id, status } =
    await req.json();

  if (!email || !password || !first_name || !last_name || !role_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const fullName = `${first_name} ${last_name}`.trim();
  const { error: profileError } = await admin
    .from("users")
    .insert([
      {
        id: authUser.user!.id,
        full_name: fullName,
        first_name,
        last_name,
        email,
        mobile: mobile || null,
        role_id,
        branch_id: branch_id || null,
        status,
      },
    ]);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ id: authUser.user!.id });
}
