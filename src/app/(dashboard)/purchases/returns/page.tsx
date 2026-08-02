import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PurchaseReturnsClient } from "./purchase-returns-client";

export const metadata = { title: "Purchase Returns | Smart Solution ERP" };

export default async function PurchaseReturnsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_returns")
    .select("*, products(name), purchases(purchase_no)")
    .order("date", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Returns" description="Returns to suppliers" />
      <PurchaseReturnsClient returns={data ?? []} />
    </div>
  );
}
