import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SupplierGroupsClient } from "./supplier-groups-client";

export default async function SupplierGroupsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("supplier_groups").select("*").order("name");

  return (
    <div className="space-y-6">
      <PageHeader title="Supplier Groups" description="Supplier categories" />
      <SupplierGroupsClient rows={data ?? []} />
    </div>
  );
}
