import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProductsClient } from "./products-client";

export const metadata = { title: "Products | Smart Solution ERP" };

export default async function ProductsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: products },
    { data: categories },
    { data: brands },
    { data: units },
    { data: customers },
    { data: branches },
    { data: ledger },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "*, brands(id, name), categories(id, name), units(id, name), product_variants(id, name, stock_quantity)"
      )
      .order("name", { ascending: true }),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("units").select("id, name").order("name"),
    supabase.from("customers").select("id, name, mobile, previous_due, current_due").order("name"),
    supabase.from("branches").select("id, name").order("name"),
    supabase.from("inventory_ledger").select("product_id, quantity"),
    supabase
      .from("users")
      .select("id, first_name, last_name, roles(name)")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
  ]);

  const stockMap: Record<string, number> = {};
  for (const row of ledger ?? []) {
    stockMap[row.product_id] = (stockMap[row.product_id] ?? 0) + Number(row.quantity);
  }

  const roleName = (profile?.roles as { name?: string } | null)?.name ?? "";
  const salesPersonName = profile?.last_name ?? profile?.first_name ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Catalog with barcode, SKU, pricing and stock"
      />
      <ProductsClient
        products={products ?? []}
        categories={categories ?? []}
        brands={brands ?? []}
        units={units ?? []}
        customers={customers ?? []}
        branches={branches ?? []}
        stockMap={stockMap}
        currentUserId={profile?.id ?? user?.id ?? null}
        salesPersonName={salesPersonName}
        roleName={roleName}
      />
    </div>
  );
}
