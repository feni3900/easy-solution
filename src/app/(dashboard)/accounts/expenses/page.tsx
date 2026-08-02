import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TransactionClient } from "./transaction-client";

export const metadata = { title: "Expenses | Smart Solution ERP" };

export default async function ExpensesPage() {
  const supabase = await createClient();
  const [{ data }, { data: branches }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, branches(name)")
      .order("date", { ascending: false }),
    supabase.from("branches").select("id, name").order("name"),
  ]);

  const total = (data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Business expenses" />
      <TransactionClient
        table="expenses"
        title="Expense"
        entries={data ?? []}
        branches={branches ?? []}
        total={total}
        description="Write cash out to cash book automatically"
      />
    </div>
  );
}
