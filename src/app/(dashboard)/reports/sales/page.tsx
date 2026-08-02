import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesChart } from "./sales-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { ShoppingCart, Users, CreditCard, TrendingUp } from "lucide-react";

export const metadata = { title: "Sales Report | Smart Solution ERP" };

export default async function SalesReportPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("sales_orders")
    .select("total, payment_method, sales_channel, order_date, status")
    .order("order_date", { ascending: false });

  const rows = orders ?? [];
  const totalSales = rows.reduce((s, o) => s + Number(o.total), 0);
  const completed = rows.filter((o) => o.status === "completed");
  const cashSales = rows
    .filter((o) => o.payment_method === "cash")
    .reduce((s, o) => s + Number(o.total), 0);
  const creditSales = rows
    .filter((o) => o.payment_method === "credit")
    .reduce((s, o) => s + Number(o.total), 0);
  const onlineSales = rows
    .filter((o) => o.sales_channel === "online")
    .reduce((s, o) => s + Number(o.total), 0);
  const posSales = totalSales - onlineSales;

  // group by day for the chart (last 14 days)
  const dayMap = new Map<string, number>();
  for (const o of completed) {
    const day = new Date(o.order_date).toISOString().slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + Number(o.total));
  }
  const chartData = [...dayMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, total]) => ({ date, total }));

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Report" description="Sales performance across channels and payment methods" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Sales" value={`৳${totalSales.toFixed(2)}`} icon={<ShoppingCart className="size-4" />} />
        <StatCard title="POS Sales" value={`৳${posSales.toFixed(2)}`} icon={<TrendingUp className="size-4" />} />
        <StatCard title="Online Sales" value={`৳${onlineSales.toFixed(2)}`} icon={<GlobeIcon />} />
        <StatCard title="Orders" value={String(completed.length)} icon={<Users className="size-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cash vs Credit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatCard
              title="Cash Sales"
              value={`৳${cashSales.toFixed(2)}`}
              icon={<CreditCard className="size-4" />}
            />
            <StatCard
              title="Credit Sales"
              value={`৳${creditSales.toFixed(2)}`}
              icon={<CreditCard className="size-4" />}
              variant={creditSales > 0 ? "destructive" : "default"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GlobeIcon() {
  return <ShoppingCart className="size-4" />;
}
