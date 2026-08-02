import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CustomerGroupsClient } from "./customer-groups-client";

export default async function CustomerGroupsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("customer_groups").select("*").order("name");

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Groups" description="Discount groups" />
      <CustomerGroupsClient rows={data ?? []} />
    </div>
  );
}
