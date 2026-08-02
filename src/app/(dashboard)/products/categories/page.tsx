import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Product categories" />
      <CategoriesClient rows={data ?? []} />
    </div>
  );
}
