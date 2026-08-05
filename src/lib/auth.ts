import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) return null;

  const { data: role } = await supabase
    .from("roles_permissions")
    .select("role_name, max_discount_percentage, allow_due")
    .eq("role_id", profile.role_id)
    .single();

  return { ...profile, roles_permissions: role };
}

export async function getRoleId(): Promise<number | null> {
  const profile = await getUserProfile();
  if (!profile) return null;
  return profile.role_id;
}

export async function getRoleName(): Promise<string | null> {
  const profile = await getUserProfile();
  if (!profile) return null;
  return (profile.roles_permissions as { role_name?: string } | null)?.role_name ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const roleName = await getRoleName();
  return roleName === "Admin";
}

export async function isBranchManager(): Promise<boolean> {
  const roleName = await getRoleName();
  return roleName === "Branch Manager";
}

export async function getMaxDiscount(): Promise<number> {
  const profile = await getUserProfile();
  if (!profile) return 0;
  return Number((profile.roles_permissions as { max_discount_percentage?: number } | null)?.max_discount_percentage ?? 0);
}

export async function canAllowDue(): Promise<boolean> {
  const profile = await getUserProfile();
  if (!profile) return false;
  return (profile.roles_permissions as { allow_due?: boolean } | null)?.allow_due ?? false;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireProfile() {
  const profile = await getUserProfile();
  if (!profile) redirect("/login");
  return profile;
}
