import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CompaniesClient } from "./companies-client";

export const metadata = { title: "Companies | Smart Solution ERP" };

export default async function CompaniesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Multi-company management"
        action={{ label: "Add Company" }}
      />
      <CompaniesClient companies={data ?? []} />
    </div>
  );
}
