import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { branchId } = await req.json().catch(() => ({}));
  if (!branchId) {
    return NextResponse.json({ error: "branchId is required" }, { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set("store_branch", branchId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "lax",
  });
  return NextResponse.json({ ok: true });
}
