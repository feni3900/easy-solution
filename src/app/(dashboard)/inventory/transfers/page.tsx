import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TransfersClient } from "./transfers-client";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const metadata = { title: "Stock Transfers | Maruf Enterprise" };

export default async function TransfersPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_transfers")
    .select("*, products(name), from_warehouses:warehouses!from_warehouse_id(name), to_warehouses:warehouses!to_warehouse_id(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title={t("inventory.transfers.title", locale)} description={t("inventory.transfers.desc", locale)} />
      <TransfersClient transfers={data ?? []} locale={locale} />
    </div>
  );
}
