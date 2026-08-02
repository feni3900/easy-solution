import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { WarehousesClient } from "./warehouses-client";

export const metadata = { title: "Warehouses | Smart Solution ERP" };

export default async function WarehousesPage() {
  const supabase = await createClient();
  const [{ data: warehouses }, { data: branches }] = await Promise.all([
    supabase
      .from("warehouses")
      .select("*, branches(name)")
      .order("created_at", { ascending: false }),
    supabase.from("branches").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Warehouses" description="Stock locations" />
      <WarehousesClient
        warehouses={warehouses ?? []}
        branches={branches ?? []}
      />
    </div>
  );
}
