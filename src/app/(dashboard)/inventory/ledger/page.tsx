import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { InventoryClient } from "./inventory-client";

export const metadata = { title: "Inventory Ledger | Smart Solution ERP" };

export default async function InventoryLedgerPage() {
  const supabase = await createClient();

  const [ledgerRes, productsRes, warehousesRes, variantsRes] = await Promise.all([
    supabase
      .from("inventory_ledger")
      .select("*, products(name), warehouses(name), branches(name)")
      .order("date", { ascending: false })
      .limit(500),
    supabase.from("products").select("id, name").order("name"),
    supabase.from("warehouses").select("id, name").order("name"),
    supabase.from("product_variants").select("id, name, product_id").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Ledger"
        description="All stock movements — current stock auto-calculated from these transactions"
      />
      <InventoryClient
        ledger={ledgerRes.data ?? []}
        products={productsRes.data ?? []}
        warehouses={warehousesRes.data ?? []}
        variants={variantsRes.data ?? []}
      />
    </div>
  );
}
