import { NextResponse } from "next/server";
import { isGuest } from "@/lib/auth";

export async function GET() {
  try {
    if (await isGuest()) {
      return NextResponse.json({ error: "Guest account is read-only" }, { status: 403 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    // Check existing profiles
    const checkRes = await fetch(`${url}/rest/v1/users?select=user_id`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const existing = await checkRes.json();

    const results = [];

    // Insert Admin profile
    const adminRes = await fetch(`${url}/rest/v1/users`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: "7daf020a-e500-40ef-9f07-24c59a7ba939",
        username: "admin",
        full_name: "Super Admin",
        role_id: 3,
        salesperson_nickname: "Admin",
        is_active: true,
      }),
    });
    results.push({ admin: adminRes.status, body: await adminRes.text() });

    // Insert Manager profile
    const managerRes = await fetch(`${url}/rest/v1/users`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: "c9681ef4-b044-4789-9491-9943f9c66265",
        username: "manager",
        full_name: "Branch Manager",
        role_id: 2,
        salesperson_nickname: "Manager",
        is_active: true,
      }),
    });
    results.push({ manager: managerRes.status, body: await managerRes.text() });

    // Insert Sales profile
    const salesRes = await fetch(`${url}/rest/v1/users`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: "b417a1b0-e95c-4991-b908-f6a38d18cdfa",
        username: "sales",
        full_name: "Sales Person",
        role_id: 1,
        salesperson_nickname: "Sales",
        is_active: true,
      }),
    });
    results.push({ sales: salesRes.status, body: await salesRes.text() });

    // Verify
    const verifyRes = await fetch(`${url}/rest/v1/users?select=*`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const profiles = await verifyRes.json();

    return NextResponse.json({
      existing,
      results,
      profiles,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
