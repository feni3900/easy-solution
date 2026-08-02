import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { WebProductsClient } from "./web-products-client";

export const metadata = { title: "Ecommerce Products | Smart Solution ERP" };

export default async function WebProductsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, selling_price, image, is_popular, is_best_seller, is_coming_soon, status, categories(name), brands(name)"
    )
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader title="Ecommerce Products" description="Catalog visibility and homepage sections" />
      <WebProductsClient products={data ?? []} />
    </div>
  );
}
