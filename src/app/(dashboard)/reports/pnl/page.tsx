import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";

export const metadata = { title: "Profit & Loss | Smart Solution ERP" };

export default async function PnLPage() {
  const supabase = await createClient();

  const [salesRes, purchasesRes, expensesRes, incomeRes] = await Promise.all([
    supabase.from("sales_orders").select("total").eq("status", "completed"),
    supabase.from("purchases").select("total").eq("status", "received"),
    supabase.from("expenses").select("amount"),
    supabase.from("income").select("amount"),
  ]);

  const revenue = (salesRes.data ?? []).reduce((s, o) => s + Number(o.total), 0);
  const cogs = (purchasesRes.data ?? []).reduce((s, o) => s + Number(o.total), 0);
  const expenses = (expensesRes.data ?? []).reduce((s, o) => s + Number(o.amount), 0);
  const otherIncome = (incomeRes.data ?? []).reduce((s, o) => s + Number(o.amount), 0);

  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenses + otherIncome;

  return (
    <div className="space-y-6">
      <PageHeader title="Profit & Loss" description="Financial summary" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Revenue" value={`৳${revenue.toFixed(2)}`} />
        <StatCard title="Cost of Goods" value={`৳${cogs.toFixed(2)}`} />
        <StatCard
          title="Gross Profit"
          value={`৳${grossProfit.toFixed(2)}`}
          variant={grossProfit < 0 ? "destructive" : "default"}
        />
        <StatCard
          title="Net Profit"
          value={`৳${netProfit.toFixed(2)}`}
          variant={netProfit < 0 ? "destructive" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Income Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-1">
            <span>Sales Revenue</span>
            <span className="font-medium">৳{revenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-t">
            <span>Cost of Goods Sold</span>
            <span className="font-medium text-destructive">(৳{cogs.toFixed(2)})</span>
          </div>
          <div className="flex justify-between py-1 border-t font-semibold">
            <span>Gross Profit</span>
            <span>৳{grossProfit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-t">
            <span>Operating Expenses</span>
            <span className="font-medium text-destructive">(৳{expenses.toFixed(2)})</span>
          </div>
          <div className="flex justify-between py-1 border-t">
            <span>Other Income</span>
            <span className="font-medium text-emerald-600">+৳{otherIncome.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-t text-base font-bold">
            <span>Net Profit</span>
            <span className={netProfit < 0 ? "text-destructive" : "text-emerald-600"}>
              ৳{netProfit.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
