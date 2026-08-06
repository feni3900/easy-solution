import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ReviewsClient } from "./reviews-client";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const metadata = { title: "Reviews | Smart Solution ERP" };

export default async function ReviewsPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, products(name), customers(name)")
    .order("date", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title={t("webstore.reviews.title", locale)} description={t("webstore.reviews.pageDesc", locale)} />
      <ReviewsClient reviews={data ?? []} locale={locale} />
    </div>
  );
}
