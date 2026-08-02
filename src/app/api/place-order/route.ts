import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { name, mobile, address, note, items, branchId } = await req.json();

  if (!name || !mobile || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Name, mobile and cart are required." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data, error } = await supabase.rpc("place_online_order", {
    p_name: name,
    p_mobile: mobile,
    p_address: address ?? "",
    p_note: note ?? "",
    p_items: items,
    p_branch_id: branchId ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
