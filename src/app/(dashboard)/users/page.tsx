import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { UsersClient } from "./users-client";

export const metadata = { title: "Users | Smart Solution ERP" };

export default async function UsersPage() {
  const supabase = await createClient();
  const [{ data: users }, { data: roles }, { data: branches }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, mobile, status, role_id, branch_id, roles(name), branches(name)")
      .order("created_at", { ascending: false }),
    supabase.from("roles").select("id, name, description").order("name"),
    supabase.from("branches").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Team members and their roles" />
      <UsersClient users={users ?? []} roles={roles ?? []} branches={branches ?? []} />
    </div>
  );
}
