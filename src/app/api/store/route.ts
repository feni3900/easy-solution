import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { companyId, branchId } = await req.json().catch(() => ({}));
  const cookieStore = await cookies();

  if (companyId) {
    cookieStore.set("store_company", companyId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "lax",
    });
    // Clear branch when switching company so it defaults to first branch in new company
    cookieStore.set("store_branch", "", {
      path: "/",
      maxAge: 0,
      httpOnly: false,
      sameSite: "lax",
    });
  }

  if (branchId) {
    cookieStore.set("store_branch", branchId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "lax",
    });
  }

  return NextResponse.json({ ok: true });
}
