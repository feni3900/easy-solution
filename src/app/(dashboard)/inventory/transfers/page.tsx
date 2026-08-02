import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TransfersClient } from "./transfers-client";

export const metadata = { title: "Stock Transfers | Smart Solution ERP" };

export default async function TransfersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_transfers")
    .select("*, products(name), from_warehouses:warehouses!from_warehouse_id(name), to_warehouses:warehouses!to_warehouse_id(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Transfers" description="Movement history between warehouses" />
      <TransfersClient transfers={data ?? []} />
    </div>
  );
}
