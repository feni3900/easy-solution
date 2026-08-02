import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CashBookClient } from "./cashbook-client";

export const metadata = { title: "Cash Book | Smart Solution ERP" };

export default async function CashBookPage() {
  const supabase = await createClient();
  const [{ data: entries }, { data: branches }] = await Promise.all([
    supabase
      .from("cash_book")
      .select("*, branches(name)")
      .order("date", { ascending: false })
      .limit(500),
    supabase.from("branches").select("id, name").order("name"),
  ]);

  const inTotal = (entries ?? [])
    .filter((e) => e.transaction_type === "cash_in")
    .reduce((s, e) => s + Number(e.amount), 0);
  const outTotal = (entries ?? [])
    .filter((e) => e.transaction_type === "cash_out")
    .reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Cash Book" description="Cash in and out entries" />
      <CashBookClient entries={entries ?? []} branches={branches ?? []} inTotal={inTotal} outTotal={outTotal} />
    </div>
  );
}
