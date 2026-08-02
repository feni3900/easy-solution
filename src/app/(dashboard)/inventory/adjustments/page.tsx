import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdjustmentsClient } from "./adjustments-client";

export const metadata = { title: "Stock Adjustments | Smart Solution ERP" };

export default async function AdjustmentsPage() {
  const supabase = await createClient();
  const [{ data: adjustments }, { data: products }] = await Promise.all([
    supabase
      .from("stock_adjustments")
      .select("*, products(name)")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Adjustments"
        description="Manually correct stock levels (gains or losses)"
      />
      <AdjustmentsClient
        adjustments={adjustments ?? []}
        products={products ?? []}
      />
    </div>
  );
}
