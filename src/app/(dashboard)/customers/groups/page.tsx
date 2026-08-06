import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CustomerGroupsClient } from "./customer-groups-client";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default async function CustomerGroupsPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("customer_groups").select("*").order("name");

  return (
    <div className="space-y-6">
      <PageHeader title={t("customers.groups.title", locale)} description={t("customers.groups.desc", locale)} />
      <CustomerGroupsClient rows={data ?? []} />
    </div>
  );
}
