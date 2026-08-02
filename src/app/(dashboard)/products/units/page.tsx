import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { UnitsClient } from "./units-client";

export default async function UnitsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("units").select("*").order("name");

  return (
    <div className="space-y-6">
      <PageHeader title="Units" description="Measurement units" />
      <UnitsClient rows={data ?? []} />
    </div>
  );
}
