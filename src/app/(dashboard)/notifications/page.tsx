import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { NotificationsClient } from "./notifications-client";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const metadata = { title: "Notifications | Smart Solution ERP" };

export default async function NotificationsPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <PageHeader title={t("notifications.title", locale)} description={t("notifications.signInDesc", locale)} />;
  }

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <PageHeader title={t("notifications.title", locale)} description={t("notifications.desc", locale)} />
      <NotificationsClient notifications={data ?? []} locale={locale} />
    </div>
  );
}
