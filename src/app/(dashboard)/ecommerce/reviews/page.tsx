import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ReviewsClient } from "./reviews-client";

export const metadata = { title: "Reviews | Smart Solution ERP" };

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, products(name), customers(name)")
    .order("date", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="Customer feedback on storefront" />
      <ReviewsClient reviews={data ?? []} />
    </div>
  );
}
