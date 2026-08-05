import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PagesClient } from "./pages-client";

export const metadata = { title: "Ecommerce Pages | Smart Solution ERP" };

export default async function EcommercePagesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ecommerce_pages")
    .select("*")
    .order("title");

  return (
    <div className="space-y-6">
      <PageHeader title="Pages" description="Manage storefront static pages (About, Contact, Terms)" />
      <PagesClient pages={data ?? []} />
    </div>
  );
}
