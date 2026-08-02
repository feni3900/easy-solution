import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { BranchesClient } from "./branches-client";

export const metadata = { title: "Branches | Smart Solution ERP" };

export default async function BranchesPage() {
  const supabase = await createClient();
  const [{ data: branches }, { data: companies }] = await Promise.all([
    supabase
      .from("branches")
      .select("*, companies(name)")
      .order("created_at", { ascending: false }),
    supabase.from("companies").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Branches" description="Company branches" />
      <BranchesClient branches={branches ?? []} companies={companies ?? []} />
    </div>
  );
}
