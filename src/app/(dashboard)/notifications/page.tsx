import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { NotificationsClient } from "./notifications-client";

export const metadata = { title: "Notifications | Smart Solution ERP" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <PageHeader title="Notifications" description="Sign in to view notifications" />;
  }

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Alerts and updates" />
      <NotificationsClient notifications={data ?? []} />
    </div>
  );
}
