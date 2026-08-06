import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CouponsClient } from "./coupons-client";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default async function CouponsPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title={t("webstore.coupons.title", locale)} description={t("webstore.coupons.pageDesc", locale)} />
      <CouponsClient rows={data ?? []} locale={locale} />
    </div>
  );
}
