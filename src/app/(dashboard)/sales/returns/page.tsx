import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SalesReturnsClient } from "./sales-returns-client";

export const metadata = { title: "Sales Returns | Smart Solution ERP" };

export default async function SalesReturnsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sales_returns")
    .select("*, products(name), sales_orders(invoice_no)")
    .order("date", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Returns" description="Returned items restock automatically" />
      <SalesReturnsClient returns={data ?? []} />
    </div>
  );
}
