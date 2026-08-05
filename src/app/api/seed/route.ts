import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createAdminClient();

    const categories = [
      { category_name: "Electronics", is_active: true },
      { category_name: "Perfume", is_active: true },
    ];

    for (const cat of categories) {
      const { data: existing } = await supabase.from("categories").select("category_id").eq("category_name", cat.category_name).single();
      if (!existing) {
        await supabase.from("categories").insert(cat);
      }
    }

    const users = [
      {
        user_id: "7daf020a-e500-40ef-9f07-24c59a7ba939",
        username: "admin",
        full_name: "Super Admin",
        role_id: 3,
        salesperson_nickname: "Admin",
        is_active: true,
      },
      {
        user_id: "c9681ef4-b044-4789-9491-9943f9c66265",
        username: "manager",
        full_name: "Branch Manager",
        role_id: 2,
        salesperson_nickname: "Manager",
        is_active: true,
      },
      {
        user_id: "b417a1b0-e95c-4991-b908-f6a38d18cdfa",
        username: "sales",
        full_name: "Sales Person",
        role_id: 1,
        salesperson_nickname: "Sales",
        is_active: true,
      },
    ];

    const results = [];
    for (const user of users) {
      const { error } = await supabase
        .from("users")
        .upsert(user, { onConflict: "user_id" })
        .select();

      if (error) {
        results.push({ user: user.username, error: error.message });
      } else {
        results.push({ user: user.username, success: true });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
