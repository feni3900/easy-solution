import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CouponsClient } from "./coupons-client";

export default async function CouponsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" description="Promotions and discount codes" />
      <CouponsClient rows={data ?? []} />
    </div>
  );
}
