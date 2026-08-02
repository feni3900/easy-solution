import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { BrandsClient } from "./brands-client";

export default async function BrandsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").order("name");

  return (
    <div className="space-y-6">
      <PageHeader title="Brands" description="Product brands" />
      <BrandsClient rows={data ?? []} />
    </div>
  );
}
