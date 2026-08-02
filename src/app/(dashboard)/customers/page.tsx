import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CustomersClient } from "./customers-client";

export const metadata = { title: "Customers | Smart Solution ERP" };

export default async function CustomersPage() {
  const supabase = await createClient();
  const [{ data: customers }, { data: groups }] = await Promise.all([
    supabase.from("customers").select("*").order("name"),
    supabase.from("customer_groups").select("id, name, discount_percent").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Customer profiles and due balances" />
      <CustomersClient customers={customers ?? []} groups={groups ?? []} />
    </div>
  );
}
