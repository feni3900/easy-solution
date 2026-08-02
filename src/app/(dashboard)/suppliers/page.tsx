import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SuppliersClient } from "./suppliers-client";

export const metadata = { title: "Suppliers | Smart Solution ERP" };

export default async function SuppliersPage() {
  const supabase = await createClient();
  const [{ data: suppliers }, { data: groups }, { data: purchases }] =
    await Promise.all([
      supabase.from("suppliers").select("*").order("name"),
      supabase.from("supplier_groups").select("id, name").order("name"),
      supabase.from("purchases").select("supplier_id, total, paid_amount"),
    ]);

  const totals: Record<string, { total: number; paid: number }> = {};
  for (const p of purchases ?? []) {
    if (!p.supplier_id) continue;
    const t = totals[p.supplier_id] ?? { total: 0, paid: 0 };
    t.total += Number(p.total ?? 0);
    t.paid += Number(p.paid_amount ?? 0);
    totals[p.supplier_id] = t;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" description="Supplier profiles and due balances" />
      <SuppliersClient
        suppliers={suppliers ?? []}
        groups={groups ?? []}
        totals={totals}
      />
    </div>
  );
}
