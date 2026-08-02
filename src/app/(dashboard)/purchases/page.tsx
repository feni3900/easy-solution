import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PurchasesClient } from "./purchases-client";

export const metadata = { title: "Purchases | Smart Solution ERP" };

export default async function PurchasesPage() {
  const supabase = await createClient();

  const [
    { data: purchases },
    { data: suppliers },
    { data: products },
    { data: branches },
    { data: categories },
    { data: brands },
    { data: units },
    { data: variants },
  ] = await Promise.all([
    supabase
      .from("purchases")
      .select("*, suppliers(name), branches(name)")
      .order("purchase_date", { ascending: false })
      .limit(500),
    supabase.from("suppliers").select("id, name").order("name"),
    supabase
      .from("products")
      .select("id, name, purchase_price, selling_price, product_variants(id, name)")
      .order("name"),
    supabase.from("branches").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("units").select("id, name").order("name"),
    supabase.from("product_variants").select("id, product_id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Purchases" description="Supplier purchases — stock in on receipt" />
      <PurchasesClient
        purchases={purchases ?? []}
        suppliers={suppliers ?? []}
        products={products ?? []}
        branches={branches ?? []}
        categories={categories ?? []}
        brands={brands ?? []}
        units={units ?? []}
        variants={variants ?? []}
      />
    </div>
  );
}
