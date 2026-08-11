import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings | Maruf Enterprise" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*").order("group_name");

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="System-wide configuration" />
      <SettingsClient settings={data ?? []} />
    </div>
  );
}
