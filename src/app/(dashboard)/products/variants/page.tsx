import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { VariantsClient } from "./variants-client";

export const metadata = { title: "Variants | Smart Solution ERP" };

export default async function VariantsPage() {
  const supabase = await createClient();
  const [{ data: variants }, { data: products }] = await Promise.all([
    supabase
      .from("product_variants")
      .select("*, products(name)")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Variants"
        description="Sizes, colors and options per product"
      />
      <VariantsClient variants={variants ?? []} products={products ?? []} />
    </div>
  );
}
