import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { RolesClient } from "./roles-client";

export const metadata = { title: "Roles | Smart Solution ERP" };

export default async function RolesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("roles").select("*, permissions(module_name, access_level)").order("name");

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" description="Role-based access control" />
      <RolesClient roles={data ?? []} />
    </div>
  );
}
