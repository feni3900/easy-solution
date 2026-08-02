import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TransactionClient } from "./transaction-client";

export const metadata = { title: "Income | Smart Solution ERP" };

export default async function IncomePage() {
  const supabase = await createClient();
  const [{ data }, { data: branches }] = await Promise.all([
    supabase
      .from("income")
      .select("*, branches(name)")
      .order("date", { ascending: false }),
    supabase.from("branches").select("id, name").order("name"),
  ]);

  const total = (data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Income" description="Other business income" />
      <TransactionClient
        table="income"
        title="Income"
        entries={data ?? []}
        branches={branches ?? []}
        total={total}
        description="Write cash in to cash book automatically"
      />
    </div>
  );
}
