import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PagesClient } from "./pages-client";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const metadata = { title: "Ecommerce Pages | Maruf Enterprise" };

export default async function EcommercePagesPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase
    .from("ecommerce_pages")
    .select("*")
    .order("title");

  return (
    <div className="space-y-6">
      <PageHeader title={t("webstore.pages.title", locale)} description={t("webstore.pages.pageDesc", locale)} />
      <PagesClient pages={data ?? []} locale={locale} />
    </div>
  );
}
