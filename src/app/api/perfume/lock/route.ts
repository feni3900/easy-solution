import { NextResponse } from "next/server";
import { PERFUME_COOKIE } from "@/lib/perfume";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PERFUME_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}