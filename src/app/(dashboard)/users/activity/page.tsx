import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ActivityLogsClient } from "./activity-logs-client";

export const metadata = { title: "Activity Logs | Smart Solution ERP" };

export default async function ActivityLogsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_logs")
    .select("*, users(full_name)")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Logs" description="User actions for accountability" />
      <ActivityLogsClient logs={data ?? []} />
    </div>
  );
}
