import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SalesOrdersClient } from "./sales-orders-client";

export const metadata = { title: "Sales Orders | Smart Solution ERP" };

export default async function SalesOrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sales_orders")
    .select(
      "*, customers(name), branches(name), users(full_name), sales_items(product_id)"
    )
    .order("order_date", { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Orders" description="POS and online sales" />
      <SalesOrdersClient orders={data ?? []} />
    </div>
  );
}
