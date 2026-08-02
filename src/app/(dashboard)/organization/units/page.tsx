import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { BusinessUnitsClient } from "./units-client";

export const metadata = { title: "Business Units | Smart Solution ERP" };

export default async function BusinessUnitsPage() {
  const supabase = await createClient();
  const [{ data: units }, { data: branches }] = await Promise.all([
    supabase
      .from("business_units")
      .select("*, branches(name)")
      .order("created_at", { ascending: false }),
    supabase.from("branches").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Business Units" description="Units within branches" />
      <BusinessUnitsClient units={units ?? []} branches={branches ?? []} />
    </div>
  );
}
