import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { BanksClient } from "./banks-client";

export default async function BankAccountsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("bank_accounts").select("*").order("bank_name");

  return (
    <div className="space-y-6">
      <PageHeader title="Bank Accounts" description="Bank balances" />
      <BanksClient rows={data ?? []} />
    </div>
  );
}
