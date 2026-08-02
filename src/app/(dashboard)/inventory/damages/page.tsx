import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { DamagesClient } from "./damages-client";

export const metadata = { title: "Damaged Products | Smart Solution ERP" };

export default async function DamagesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("damaged_products")
    .select("*, products(name)")
    .order("date", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Damaged Products" description="Recorded stock damage" />
      <DamagesClient damages={data ?? []} />
    </div>
  );
}
