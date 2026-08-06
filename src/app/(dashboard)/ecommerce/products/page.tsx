import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { WebProductsClient } from "./web-products-client";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const metadata = { title: "Ecommerce Products | Smart Solution ERP" };

export default async function WebProductsPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, selling_price, image, is_popular, is_best_seller, is_coming_soon, status, categories(name), brands(name)"
    )
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader title={t("webstore.products.title", locale)} description={t("webstore.products.pageDesc", locale)} />
      <WebProductsClient products={data ?? []} locale={locale} />
    </div>
  );
}
