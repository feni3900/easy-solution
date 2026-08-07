import { NextResponse } from "next/server";
import { getRoleName } from "@/lib/auth";

export async function GET() {
  const roleName = await getRoleName();
  return NextResponse.json({ role_name: roleName ?? "" });
}
